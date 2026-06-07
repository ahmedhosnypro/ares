using System;
using MediatR;

namespace Backend.Domain.Events
{
    public class TripEndedEvent : INotification
    {
        public Guid BookingId { get; }
        public string CustomerEmail { get; }
        public string CustomerName { get; }
        public string VehicleName { get; }

        public TripEndedEvent(
            Guid bookingId,
            string customerEmail,
            string customerName,
            string vehicleName)
        {
            BookingId = bookingId;
            CustomerEmail = customerEmail;
            CustomerName = customerName;
            VehicleName = vehicleName;
        }
    }
}
