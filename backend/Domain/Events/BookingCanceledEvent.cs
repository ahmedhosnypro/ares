using System;
using MediatR;

namespace Backend.Domain.Events
{
    public class BookingCanceledEvent : INotification
    {
        public Guid BookingId { get; }
        public string CustomerEmail { get; }
        public string CustomerName { get; }
        public string SupplierEmail { get; }
        public string VehicleName { get; }
        public decimal RefundAmount { get; }

        public BookingCanceledEvent(
            Guid bookingId,
            string customerEmail,
            string customerName,
            string supplierEmail,
            string vehicleName,
            decimal refundAmount)
        {
            BookingId = bookingId;
            CustomerEmail = customerEmail;
            CustomerName = customerName;
            SupplierEmail = supplierEmail;
            VehicleName = vehicleName;
            RefundAmount = refundAmount;
        }
    }
}
