using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services
{
    public class DiscountApplicationService : IDiscountApplicationService
    {
        private readonly IApplicationDbContext _context;
        private readonly IDiscountValidationService _validationService;
        private readonly ILogger<DiscountApplicationService> _logger;

        public DiscountApplicationService(
            IApplicationDbContext context,
            IDiscountValidationService validationService,
            ILogger<DiscountApplicationService> logger)
        {
            _context = context;
            _validationService = validationService;
            _logger = logger;
        }

        public async Task<BookingDiscountResult> ApplyDiscountToBookingAsync(
            Guid bookingId,
            string code,
            Guid customerId,
            CancellationToken cancellationToken = default)
        {
            await using var transaction = await _context.BeginTransactionAsync(cancellationToken);

            try
            {
                var booking = await _context.Bookings
                    .Include(b => b.Vehicle)
                    .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken);

                if (booking == null)
                {
                    return BookingDiscountResult.Error("Booking not found");
                }

                if (booking.UserId != customerId)
                {
                    return BookingDiscountResult.Error("Booking does not belong to this customer");
                }

                if (booking.Status != BookingStatus.Draft && booking.Status != BookingStatus.PaymentPending && booking.Status != BookingStatus.PendingApproval)
                {
                    return BookingDiscountResult.Error("Discounts can only be applied to draft or pending bookings");
                }

                var subtotal = booking.OriginalPrice ?? booking.TotalPrice ?? 0m;

                var validation = await _validationService.ValidateDiscountCodeAsync(
                    code,
                    booking.VehicleId,
                    customerId,
                    booking.PickupDate ?? DateTime.UtcNow,
                    booking.ReturnDate ?? DateTime.UtcNow.AddDays(1),
                    subtotal,
                    cancellationToken: cancellationToken);

                if (!validation.IsValid)
                {
                    var errorMsg = validation.Errors.Count > 0
                        ? validation.Errors[0].Message
                        : "Discount code is not valid";
                    return BookingDiscountResult.Error(errorMsg);
                }

                if (!string.IsNullOrEmpty(booking.AppliedDiscountCodes))
                {
                    var existingCodes = ParseAppliedCodes(booking.AppliedDiscountCodes);
                    if (existingCodes.Contains(code.Trim().ToUpperInvariant(), StringComparer.OrdinalIgnoreCase))
                    {
                        return BookingDiscountResult.Error("This discount code has already been applied to this booking");
                    }

                    var existingDiscounts = await _context.DiscountCodes
                        .Where(d => existingCodes.Contains(d.Code))
                        .ToListAsync(cancellationToken);

                    var anyNonStackable = existingDiscounts.Any(d => !d.AllowStacking);
                    var newDiscount = await _context.DiscountCodes
                        .FirstOrDefaultAsync(d => d.Id == validation.DiscountId, cancellationToken);

                    if (anyNonStackable || (newDiscount != null && !newDiscount.AllowStacking))
                    {
                        return BookingDiscountResult.Error("This booking already has a discount applied and stacking is not allowed");
                    }
                }

                var discountAmount = validation.DiscountAmount;
                var originalPrice = subtotal;
                var finalPrice = subtotal - discountAmount;

                booking.DiscountAmount = (booking.DiscountAmount ?? 0m) + discountAmount;
                booking.TotalPrice = finalPrice;
                booking.OriginalPrice = originalPrice;

                var appliedCodes = string.IsNullOrEmpty(booking.AppliedDiscountCodes)
                    ? new List<string>()
                    : ParseAppliedCodes(booking.AppliedDiscountCodes);
                appliedCodes.Add(code.Trim().ToUpperInvariant());
                booking.AppliedDiscountCodes = JsonSerializer.Serialize(appliedCodes);

                var discountUsage = new DiscountUsage
                {
                    DiscountId = validation.DiscountId!.Value,
                    BookingId = bookingId,
                    CustomerId = customerId,
                    DiscountAmount = discountAmount,
                    OriginalPrice = originalPrice,
                    FinalPrice = finalPrice,
                    UsedAt = DateTime.UtcNow
                };

                _context.AddDiscountUsage(discountUsage);

                var rowsAffected = await _context.IncrementDiscountUsageCountAsync(validation.DiscountId!.Value, cancellationToken);

                if (rowsAffected == 0)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return BookingDiscountResult.Error("Discount code usage limit has been reached");
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return BookingDiscountResult.Successful(bookingId, discountAmount, originalPrice, finalPrice);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Error applying discount code {Code} to booking {BookingId}", code, bookingId);
                return BookingDiscountResult.Error("An error occurred while applying the discount code");
            }
        }

        private static List<string> ParseAppliedCodes(string appliedCodesJson)
        {
            try
            {
                var codes = JsonSerializer.Deserialize<List<string>>(appliedCodesJson);
                return codes ?? new List<string>();
            }
            catch
            {
                return new List<string>();
            }
        }
    }
}
