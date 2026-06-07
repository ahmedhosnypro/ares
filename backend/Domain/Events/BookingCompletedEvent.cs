using System;
using MediatR;

namespace Backend.Domain.Events
{
    public class BookingCompletedEvent : INotification
    {
        public Guid BookingId { get; }
        public string CustomerEmail { get; }
        public string CustomerName { get; }
        public string SupplierEmail { get; }
        public string VehicleName { get; }
        public DateTime StartDate { get; }
        public DateTime EndDate { get; }
        public decimal TotalAmount { get; }

        public BookingCompletedEvent(
            Guid bookingId,
            string customerEmail,
            string customerName,
            string supplierEmail,
            string vehicleName,
            DateTime startDate,
            DateTime endDate,
            decimal totalAmount)
        {
            BookingId = bookingId;
            CustomerEmail = customerEmail;
            CustomerName = customerName;
            SupplierEmail = supplierEmail;
            VehicleName = vehicleName;
            StartDate = startDate;
            EndDate = endDate;
            TotalAmount = totalAmount;
        }
    }
}
