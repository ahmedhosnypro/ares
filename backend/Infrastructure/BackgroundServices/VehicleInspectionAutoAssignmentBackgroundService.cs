using System;
using System.Threading;
using System.Threading.Tasks;
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
            _logger.LogInformation("VehicleInspectionAutoAssignmentBackgroundService is starting.");

            // Run every 1 hour
            using var timer = new PeriodicTimer(TimeSpan.FromHours(1));

            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await AssignInspectorsAsync(stoppingToken);
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

            var pendingBookings = await bookingRepository.GetBookingsForAutoAssignmentAsync(targetTime, cancellationToken);

            foreach (var booking in pendingBookings)
            {
                _logger.LogInformation("Auto-assigning inspector for Booking {BookingId}", booking.Id);
                
                var command = new AssignInspectorCommand(booking.Id);
                await mediator.Send(command, cancellationToken);
            }
        }
    }
}
