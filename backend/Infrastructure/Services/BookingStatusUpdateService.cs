using Backend.Application.Interfaces;
using Backend.Domain.Entities.Enums;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Services;

public class BookingStatusUpdateService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BookingStatusUpdateService> _logger;

    public BookingStatusUpdateService(
        IServiceProvider serviceProvider,
        ILogger<BookingStatusUpdateService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("BookingStatusUpdateService is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await UpdateBookingStatusesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing BookingStatusUpdateService.");
            }

            // Run every 2 minutes
            await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
        }

        _logger.LogInformation("BookingStatusUpdateService is stopping.");
    }

    private async Task UpdateBookingStatusesAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var now = DateTime.Now; // Using local time to match DB values in typical local dev
        var nowUtc = DateTime.UtcNow; // Hold timestamps are stored in UTC
        _logger.LogDebug($"Checking for booking status updates at {now}");

        // 1. Confirmed -> Active (Pickup date reached, and workflow statuses permit)
        var bookingsToActivate = await context.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed &&
                        b.PickupDate.HasValue &&
                        b.PickupDate.Value <= now &&
                        (b.DriverAssignmentStatus == DriverAssignmentStatus.NotRequired || b.DriverAssignmentStatus == DriverAssignmentStatus.Assigned) &&
                        (b.InspectionStatus == InspectionStatus.NotRequired || b.InspectionStatus == InspectionStatus.Approved))
            .ToListAsync(cancellationToken);

        foreach (var booking in bookingsToActivate)
        {
            booking.Status = BookingStatus.Active;
            booking.UpdatedAt = now;
            _logger.LogInformation($"Booking {booking.Id} (Num: {booking.BookingNumber}) transitioned from Confirmed to Active.");
        }

        // 2. Active -> Completed (Return date reached)
        var bookingsToComplete = await context.Bookings
            .Where(b => b.Status == BookingStatus.Active &&
                        b.ReturnDate.HasValue &&
                        b.ReturnDate.Value <= now)
            .ToListAsync(cancellationToken);

        foreach (var booking in bookingsToComplete)
        {
            booking.Status = BookingStatus.Completed;
            booking.UpdatedAt = now;
            _logger.LogInformation($"Booking {booking.Id} (Num: {booking.BookingNumber}) transitioned from Active to Completed.");
        }

        // 3. Draft -> Cancelled (Pickup date passed but never confirmed)
        var pendingToCancel = await context.Bookings
            .Where(b => b.Status == BookingStatus.Draft &&
                        b.PickupDate.HasValue &&
                        b.PickupDate.Value <= now.AddHours(-1)) // Give 1 hour grace period
            .ToListAsync(cancellationToken);

        foreach (var booking in pendingToCancel)
        {
            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = "Automatic cancellation: Pickup date passed without confirmation.";
            booking.CancelledAt = now;
            booking.UpdatedAt = now;
            
            if (booking.DriverAssignmentStatus == DriverAssignmentStatus.Waiting)
                booking.DriverAssignmentStatus = DriverAssignmentStatus.Expired;
                
            _logger.LogInformation($"Booking {booking.Id} (Num: {booking.BookingNumber}) automatically Cancelled (was Draft after pickup date).");
        }

        // 3b. Confirmed -> Cancelled (Failed workflows: Driver Expired or Inspection Rejected)
        var workflowFailedToCancel = await context.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed &&
                        (b.DriverAssignmentStatus == DriverAssignmentStatus.Expired || 
                         b.InspectionStatus == InspectionStatus.Rejected))
            .ToListAsync(cancellationToken);

        foreach (var booking in workflowFailedToCancel)
        {
            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = "Automatic cancellation: Required workflow (Driver or Inspection) failed.";
            booking.CancelledAt = now;
            booking.UpdatedAt = now;
            _logger.LogInformation($"Booking {booking.Id} (Num: {booking.BookingNumber}) automatically Cancelled due to failed workflow.");
        }

        // 3c. Driver Waiting -> Expired (Pickup date passed and still waiting for driver)
        var driversToExpire = await context.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed &&
                        b.DriverAssignmentStatus == DriverAssignmentStatus.Waiting &&
                        b.PickupDate.HasValue &&
                        b.PickupDate.Value <= now)
            .ToListAsync(cancellationToken);

        foreach (var booking in driversToExpire)
        {
            booking.DriverAssignmentStatus = DriverAssignmentStatus.Expired;
            booking.UpdatedAt = now;
            _logger.LogInformation($"Booking {booking.Id} (Num: {booking.BookingNumber}) Driver Assignment Expired (past pickup date).");
        }

        // 4. PaymentPending -> Expired (hold elapsed without confirmation).
        //    The vehicle is released for other customers. Availability checks
        //    already treat a lapsed hold as free (lazy expiry); this sweep makes
        //    the released state explicit and durable.
        var holdsToExpire = await context.Bookings
            .Where(b => b.Status == BookingStatus.PaymentPending &&
                        b.HoldExpiresAt.HasValue &&
                        b.HoldExpiresAt.Value <= nowUtc)
            .ToListAsync(cancellationToken);

        foreach (var booking in holdsToExpire)
        {
            booking.Status = BookingStatus.Expired;
            booking.UpdatedAt = nowUtc;
            _logger.LogInformation($"Booking {booking.Id} (Num: {booking.BookingNumber}) hold expired (PaymentPending -> Expired); vehicle released.");
        }

        // 5. Abandoned Draft -> Cancelled (no progress for 24h).
        //    Keeps the funnel tidy and prevents stale drafts from being resumed
        //    indefinitely. These never reserved the vehicle, so nothing to release.
        var abandonCutoffUtc = nowUtc.AddHours(-24);
        var abandonedDrafts = await context.Bookings
            .Where(b => b.Status == BookingStatus.Draft &&
                        b.UpdatedAt <= abandonCutoffUtc)
            .ToListAsync(cancellationToken);

        foreach (var booking in abandonedDrafts)
        {
            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = "Automatic cancellation: checkout abandoned.";
            booking.CancelledAt = nowUtc;
            booking.UpdatedAt = nowUtc;
            _logger.LogInformation($"Booking {booking.Id} (Num: {booking.BookingNumber}) auto-cancelled (abandoned {booking.Status} checkout).");
        }

        if (bookingsToActivate.Any() || bookingsToComplete.Any() || pendingToCancel.Any()
            || holdsToExpire.Any() || abandonedDrafts.Any() || workflowFailedToCancel.Any() || driversToExpire.Any())
        {
            await context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation(
                $"Saved {bookingsToActivate.Count + bookingsToComplete.Count + pendingToCancel.Count + holdsToExpire.Count + abandonedDrafts.Count + workflowFailedToCancel.Count + driversToExpire.Count} status transitions.");
        }
    }
}
