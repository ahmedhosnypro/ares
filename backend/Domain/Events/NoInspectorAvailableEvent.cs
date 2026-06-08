using System;
using MediatR;

namespace Backend.Domain.Events
{
    public class NoInspectorAvailableEvent : INotification
    {
        public Guid BookingId { get; }
        public string? Region { get; }
        public DateTime PickupTime { get; }

        public NoInspectorAvailableEvent(Guid bookingId, string? region, DateTime pickupTime)
        {
            BookingId = bookingId;
            Region = region;
            PickupTime = pickupTime;
        }
    }
}
