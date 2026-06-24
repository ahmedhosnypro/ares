using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Exceptions;
using Backend.Application.Features.VehicleInspections.Commands.AssignInspector;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.BackgroundServices
{
    public class VehicleInspectionAutoAssignmentBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<VehicleInspectionAutoAssignmentBackgroundService> _logger;

        public VehicleInspectionAutoAssignmentBackgroundService(IServiceProvider serviceProvider, ILogger<VehicleInspectionAutoAssignmentBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Job Start: VehicleInspectionAutoAssignmentBackgroundService is starting.");

            // Run immediately on startup
            try
            {
                await AssignInspectorsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during initial execution of inspector auto-assignment.");
            }

            // Run every 1 hour
            using var timer = new PeriodicTimer(TimeSpan.FromHours(1));

            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    _logger.LogInformation("Job Start: VehicleInspectionAutoAssignmentBackgroundService periodic tick triggered.");
                    await AssignInspectorsAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    // Normal shutdown, ignore
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing inspector auto-assignment.");
                }
            }
        }

        private async Task AssignInspectorsAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var bookingRepository = scope.ServiceProvider.GetRequiredService<IBookingRepository>();
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var targetTime = DateTime.UtcNow.AddHours(24);

            await ProcessPickupAssignmentsAsync(bookingRepository, mediator, notificationService, targetTime, cancellationToken);
            await ProcessReturnAssignmentsAsync(bookingRepository, mediator, notificationService, targetTime, cancellationToken);
        }

        private async Task ProcessPickupAssignmentsAsync(
            IBookingRepository bookingRepository, 
            IMediator mediator, 
            INotificationService notificationService,
            DateTime targetTime, 
            CancellationToken cancellationToken)
        {
            var pendingBookings = (await bookingRepository.GetBookingsForPickupAutoAssignmentAsync(targetTime, cancellationToken)).ToList();
            _logger.LogInformation("Eligible Pickup Bookings Found: {Count} booking(s) found.", pendingBookings.Count);

            int successCount = 0;
            int failureCount = 0;

            foreach (var booking in pendingBookings)
            {
                try
                {
                    _logger.LogInformation("Auto-assigning Pickup inspector for Booking {BookingId}", booking.Id);

                    var command = new AssignInspectorCommand(booking.Id, "Pickup", false);
                    await mediator.Send(command, cancellationToken);

                    _logger.LogInformation("Assignment Success: Successfully assigned Pickup inspector for Booking {BookingId}", booking.Id);
                    successCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Assignment Failure: Failed to auto-assign Pickup inspector for Booking {BookingId}", booking.Id);
                    failureCount++;

                    // Increment attempts
                    booking.PickupAssignmentAttempts++;
                    await bookingRepository.UpdateAsync(booking, cancellationToken);

                    if (booking.PickupAssignmentAttempts >= 6)
                    {
                        await NotifyAdminOfAssignmentFailure(notificationService, booking.Id, "Pickup", cancellationToken);
                    }
                }
            }
            
            _logger.LogInformation("Pickup Job Completion Summary: Processed: {Total}, Successes: {Successes}, Failures: {Failures}",
                pendingBookings.Count, successCount, failureCount);
        }

        private async Task ProcessReturnAssignmentsAsync(
            IBookingRepository bookingRepository, 
            IMediator mediator, 
            INotificationService notificationService,
            DateTime targetTime, 
            CancellationToken cancellationToken)
        {
            var pendingBookings = (await bookingRepository.GetBookingsForReturnAutoAssignmentAsync(targetTime, cancellationToken)).ToList();
            _logger.LogInformation("Eligible Return Bookings Found: {Count} booking(s) found.", pendingBookings.Count);

            int successCount = 0;
            int failureCount = 0;

            foreach (var booking in pendingBookings)
            {
                try
                {
                    _logger.LogInformation("Auto-assigning Return inspector for Booking {BookingId}", booking.Id);

                    var command = new AssignInspectorCommand(booking.Id, "Return", false);
                    await mediator.Send(command, cancellationToken);

                    _logger.LogInformation("Assignment Success: Successfully assigned Return inspector for Booking {BookingId}", booking.Id);
                    successCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Assignment Failure: Failed to auto-assign Return inspector for Booking {BookingId}", booking.Id);
                    failureCount++;

                    // Increment attempts
                    booking.ReturnAssignmentAttempts++;
                    await bookingRepository.UpdateAsync(booking, cancellationToken);

                    if (booking.ReturnAssignmentAttempts >= 6)
                    {
                        await NotifyAdminOfAssignmentFailure(notificationService, booking.Id, "Return", cancellationToken);
                    }
                }
            }
            
            _logger.LogInformation("Return Job Completion Summary: Processed: {Total}, Successes: {Successes}, Failures: {Failures}",
                pendingBookings.Count, successCount, failureCount);
        }

        private async Task NotifyAdminOfAssignmentFailure(INotificationService notificationService, Guid bookingId, string inspectionType, CancellationToken cancellationToken)
        {
            try
            {
                await notificationService.NotifyAdminsAsync(
                    "Auto Assignment Failed",
                    $"The system failed to auto-assign an inspector for {inspectionType} inspection of Booking {bookingId} after 6 attempts.",
                    "AutoAssignmentFailed",
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to notify admins of auto-assignment failure for Booking {BookingId}", bookingId);
            }
        }
    }
}
