using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services
{
    public class DiscountValidationService : IDiscountValidationService
    {
        private readonly IApplicationDbContext _context;
        private readonly ILogger<DiscountValidationService> _logger;

        public DiscountValidationService(IApplicationDbContext context, ILogger<DiscountValidationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<DiscountValidationResult> ValidateDiscountCodeAsync(
            string code,
            Guid vehicleId,
            Guid? customerId,
            DateTime startDate,
            DateTime endDate,
            decimal subtotal,
            string? ipAddress = null,
            string? userAgent = null,
            CancellationToken cancellationToken = default)
        {
            DiscountCode? discount = null;
            bool isValid = false;
            string? errorCode = null;
            string? errorMessage = null;

            try
            {
                var normalizedCode = code.Trim().ToUpperInvariant();

                discount = await _context.DiscountCodes
                    .Include(d => d.VehicleCategories)
                    .FirstOrDefaultAsync(d => d.Code == normalizedCode && d.IsActive, cancellationToken);

                if (discount == null)
                {
                    errorCode = "NOT_FOUND";
                    errorMessage = "Discount code not found or inactive";
                    return LogAndReturn(DiscountValidationResult.Invalid(errorCode, errorMessage));
                }

                var now = DateTime.UtcNow;
                if (now < discount.ValidFrom || now > discount.ValidTo)
                {
                    errorCode = "EXPIRED";
                    errorMessage = "Discount code is not currently valid";
                    return LogAndReturn(DiscountValidationResult.Invalid(errorCode, errorMessage));
                }

                if (discount.UsageLimitTotal.HasValue && discount.CurrentUsageCount >= discount.UsageLimitTotal.Value)
                {
                    errorCode = "USAGE_LIMIT_REACHED";
                    errorMessage = "Discount code has reached its total usage limit";
                    return LogAndReturn(DiscountValidationResult.Invalid(errorCode, errorMessage));
                }

                if (customerId.HasValue)
                {
                    var customerUsageCount = await _context.DiscountUsages
                        .CountAsync(u => u.DiscountId == discount.Id && u.CustomerId == customerId.Value, cancellationToken);

                    if (customerUsageCount >= discount.UsageLimitPerCustomer)
                    {
                        errorCode = "CUSTOMER_LIMIT_REACHED";
                        errorMessage = "You have already used this discount code the maximum number of times";
                        return LogAndReturn(DiscountValidationResult.Invalid(errorCode, errorMessage));
                    }
                }

                if (customerId.HasValue)
                {
                    var customerSegment = await CustomerSegmentHelper.DetermineSegmentAsync(_context, customerId.Value, cancellationToken);
                    var allowedSegments = CustomerSegmentHelper.ParseSegments(discount.CustomerSegments);

                    if (!allowedSegments.Contains("all", StringComparer.OrdinalIgnoreCase) &&
                        !allowedSegments.Contains(customerSegment, StringComparer.OrdinalIgnoreCase))
                    {
                        errorCode = "SEGMENT_NOT_ELIGIBLE";
                        errorMessage = "This discount code is not available for your customer segment";
                        return LogAndReturn(DiscountValidationResult.Invalid(errorCode, errorMessage));
                    }
                }

                var vehicle = await _context.Vehicles
                    .FirstOrDefaultAsync(v => v.Id == vehicleId, cancellationToken);

                if (vehicle == null)
                {
                    errorCode = "VEHICLE_NOT_FOUND";
                    errorMessage = "Vehicle not found";
                    return LogAndReturn(DiscountValidationResult.Invalid(errorCode, errorMessage));
                }

                if (discount.VehicleCategories != null && discount.VehicleCategories.Any())
                {
                    if (!vehicle.CategoryId.HasValue || !discount.VehicleCategories.Any(vc => vc.CategoryId == vehicle.CategoryId.Value))
                    {
                        errorCode = "CATEGORY_NOT_ELIGIBLE";
                        errorMessage = "This discount code does not apply to this vehicle category";
                        return LogAndReturn(DiscountValidationResult.Invalid(errorCode, errorMessage));
                    }
                }

                if (discount.MinimumDuration.HasValue)
                {
                    var bookingDurationHours = (endDate - startDate).TotalHours;
                    if (bookingDurationHours < discount.MinimumDuration.Value)
                    {
                        errorCode = "MINIMUM_DURATION_NOT_MET";
                        errorMessage = $"Booking must be at least {discount.MinimumDuration.Value} hours to use this discount";
                        return LogAndReturn(DiscountValidationResult.Invalid(errorCode, errorMessage));
                    }
                }

                if (discount.MinimumValue.HasValue && subtotal < discount.MinimumValue.Value)
                {
                    errorCode = "MINIMUM_VALUE_NOT_MET";
                    errorMessage = $"Booking subtotal must be at least {discount.MinimumValue.Value} to use this discount";
                    return LogAndReturn(DiscountValidationResult.Invalid(errorCode, errorMessage));
                }

                isValid = true;
                decimal discountAmount;
                if (discount.DiscountType == "percentage")
                {
                    discountAmount = Math.Round(subtotal * (discount.DiscountValue / 100m), 2);
                }
                else
                {
                    discountAmount = Math.Min(discount.DiscountValue, subtotal);
                }

                var finalPrice = subtotal - discountAmount;
                var savingsPercentage = subtotal > 0 ? Math.Round((discountAmount / subtotal) * 100, 2) : 0;

                return LogAndReturn(DiscountValidationResult.Valid(
                    discount.Id,
                    discount.Code,
                    discount.DiscountType,
                    discount.DiscountValue,
                    discountAmount,
                    finalPrice,
                    savingsPercentage));
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error validating discount code {Code}", code);
                errorCode = "VALIDATION_ERROR";
                errorMessage = "An error occurred while validating the discount code";
                return LogAndReturn(DiscountValidationResult.Invalid(errorCode, errorMessage));
            }

            DiscountValidationResult LogAndReturn(DiscountValidationResult result)
            {
                _ = LogValidationAttemptAsync(discount?.Id, code, customerId, vehicleId, result.IsValid, result.Errors, ipAddress, userAgent, cancellationToken);
                return result;
            }
        }

        private async Task LogValidationAttemptAsync(
            Guid? discountId,
            string code,
            Guid? customerId,
            Guid? vehicleId,
            bool isValid,
            List<DiscountValidationError> errors,
            string? ipAddress,
            string? userAgent,
            CancellationToken cancellationToken)
        {
            try
            {
                var log = new DiscountValidationLog
                {
                    DiscountId = discountId,
                    Code = code,
                    CustomerId = customerId,
                    VehicleId = vehicleId,
                    IsValid = isValid,
                    ValidationErrors = errors.Count > 0
                        ? JsonSerializer.Serialize(errors.Select(e => new { e.Code, e.Message }))
                        : null,
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    ValidatedAt = DateTime.UtcNow
                };

                _context.AddDiscountValidationLog(log);
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to log discount validation attempt for code {Code}", code);
            }
        }
    }
}
