using System;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Exceptions;
using Backend.Application.Features.VehicleInspections.Commands.AssignInspector;
using Backend.Application.Interfaces;
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

            // Find bookings starting in <= 24 hours
            var targetTime = DateTime.UtcNow.AddHours(24);

            var pendingBookings = (await bookingRepository.GetBookingsForAutoAssignmentAsync(targetTime, cancellationToken)).ToList();

            _logger.LogInformation("Eligible Bookings Found: {Count} booking(s) found starting before {TargetTime}.", pendingBookings.Count, targetTime);

            int successCount = 0;
            int failureCount = 0;

            foreach (var booking in pendingBookings)
            {
                try
                {
                    _logger.LogInformation("Auto-assigning inspector for Booking {BookingId}", booking.Id);

                    var command = new AssignInspectorCommand(booking.Id);
                    await mediator.Send(command, cancellationToken);

                    _logger.LogInformation("Assignment Success: Successfully assigned inspector for Booking {BookingId}", booking.Id);
                    successCount++;
                }
                catch (ConflictException ex)
                {
                    _logger.LogWarning(ex, "Booking Skipped: Booking {BookingId} was skipped because of status conflict: {Message}", booking.Id, ex.Message);
                    failureCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Assignment Failure: Failed to auto-assign inspector for Booking {BookingId}", booking.Id);
                    failureCount++;
                }
            }

            _logger.LogInformation("Job Completion Summary: Total Processed: {Total}, Successes: {Successes}, Failures: {Failures}",
                pendingBookings.Count, successCount, failureCount);
        }
    }
}
