using System.Threading;
using System.Threading.Tasks;
using Backend.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Features.VehicleInspections.EventHandlers
{
    public class NoInspectorAvailableEventHandler : INotificationHandler<NoInspectorAvailableEvent>
    {
        private readonly ILogger<NoInspectorAvailableEventHandler> _logger;

        public NoInspectorAvailableEventHandler(ILogger<NoInspectorAvailableEventHandler> logger)
        {
            _logger = logger;
        }

        public Task Handle(NoInspectorAvailableEvent notification, CancellationToken cancellationToken)
        {
            // Simulate sending Email to Admin
            _logger.LogCritical("EMAIL NOTIFICATION: No Inspector available for Booking {BookingId} in Region '{Region}' at {PickupTime}. Please assign manually.",
                notification.BookingId, notification.Region, notification.PickupTime);

            // Simulate sending In-App Notification to Admin
            _logger.LogCritical("IN-APP NOTIFICATION: Action required! No available inspectors for Booking {BookingId}.", notification.BookingId);

            return Task.CompletedTask;
        }
    }
}
