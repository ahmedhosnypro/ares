using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services;

public class SupplierRestrictionService : ISupplierRestrictionService
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<SupplierRestrictionService> _logger;

    public SupplierRestrictionService(
        IApplicationDbContext context,
        INotificationService notificationService,
        IEmailService emailService,
        UserManager<ApplicationUser> userManager,
        ILogger<SupplierRestrictionService> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _emailService = emailService;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task ApplyRestrictionAsync(Guid supplierId, Guid adminId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Applying restriction workflow for supplier {SupplierId} by admin {AdminId}", supplierId, adminId);

        // Step 1: Disable Supplier Vehicles
        var vehicles = await _context.Vehicles
            .Where(v => v.UserId == supplierId && v.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var vehicle in vehicles)
        {
            vehicle.AvailabilityStatus = "Unavailable";
        }

        // Step 2 & 3: Detect Future Bookings, Cancel, and Refund
        var now = DateTime.UtcNow;
        var futureBookings = await _context.Bookings
            .Include(b => b.Vehicle)
            .Include(b => b.User)
            .Where(b => b.Vehicle != null && b.Vehicle.UserId == supplierId)
            .Where(b => b.PickupDate > now && b.Status != BookingStatus.Cancelled && b.Status != BookingStatus.CancelledByAdmin && b.Status != BookingStatus.Completed && b.Status != BookingStatus.Active)
            .ToListAsync(cancellationToken);

        foreach (var booking in futureBookings)
        {
            booking.Status = BookingStatus.CancelledByAdmin;
            booking.CancelledAt = now;

            var totalAmount = booking.TotalPrice ?? 0m;

            // Full refund because admin cancelled due to restriction
            var cancellation = new BookingCancellation
            {
                Id = Guid.NewGuid(),
                BookingId = booking.Id,
                CancelledBy = adminId,
                PolicyType = PolicyType.Free, // 100% refund
                RefundPercentage = 100m,
                OriginalAmount = totalAmount,
                CancellationFee = 0m,
                RefundCommissionAmount = 0m,
                RefundSupplierAmount = 0m,
                Currency = "EGP",
                RefundStatus = RefundStatus.Processing,
                Reason = "Supplier account restricted by administration",
                ReasonCategory = ReasonCategory.Other,
                CreatedAt = now
            };

            _context.AddBookingCancellation(cancellation);

            // Step 4: Customer Notifications
            if (booking.User != null)
            {
                var title = "Booking Cancelled";
                var message = "Your booking has been cancelled because the vehicle is no longer available. A full refund will be processed automatically. Please visit the platform to book another available vehicle.";

                await _notificationService.CreateNotificationAsync(
                    booking.UserId,
                    title,
                    message,
                    $"BookingCancelled:{booking.Id}",
                    cancellationToken);

                if (!string.IsNullOrEmpty(booking.User.Email))
                {
                    await _emailService.SendEmailAsync(booking.User.Email, title, message);
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Step 5: Determine Target Status
        var supplier = await _userManager.FindByIdAsync(supplierId.ToString());
        if (supplier != null)
        {
            var activeBookingsCount = await _context.Bookings
                .Where(b => b.Vehicle != null && b.Vehicle.UserId == supplierId && b.Status == BookingStatus.Active)
                .CountAsync(cancellationToken);

            var newStatus = activeBookingsCount > 0 ? "Restricted" : "Blocked";

            if (supplier.Status != newStatus)
            {
                _logger.LogInformation("Setting supplier {SupplierId} status to {NewStatus} based on active bookings count: {ActiveCount}", supplierId, newStatus, activeBookingsCount);
                supplier.Status = newStatus;
                await _userManager.UpdateAsync(supplier);
            }
        }
    }

    public async Task CheckAndConvertToBlockedAsync(Guid supplierId, CancellationToken cancellationToken = default)
    {
        var supplier = await _userManager.FindByIdAsync(supplierId.ToString());
        if (supplier == null) return;

        // Check if supplier is restricted
        if (supplier.Status != "Restricted" && supplier.Status != "RESTRICTED") return;

        // Count active bookings for this supplier's vehicles
        var activeBookingsCount = await _context.Bookings
            .Where(b => b.Vehicle != null && b.Vehicle.UserId == supplierId && b.Status == BookingStatus.Active)
            .CountAsync(cancellationToken);

        if (activeBookingsCount == 0)
        {
            _logger.LogInformation("Restricted supplier {SupplierId} has 0 active bookings. Converting status to Blocked.", supplierId);
            supplier.Status = "Blocked";
            await _userManager.UpdateAsync(supplier);
        }
    }

    public async Task RemoveRestrictionAsync(Guid supplierId, Guid adminId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Removing restriction workflow for supplier {SupplierId} by admin {AdminId}", supplierId, adminId);

        // Re-enable Supplier Vehicles (make them Available again)
        var vehicles = await _context.Vehicles
            .Where(v => v.UserId == supplierId && v.IsActive && (v.Status == "Approved" || v.Status == "Active"))
            .ToListAsync(cancellationToken);

        foreach (var vehicle in vehicles)
        {
            vehicle.AvailabilityStatus = "Available";
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
