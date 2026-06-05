using System;

namespace Backend.Application.DTOs.Driver
{
    public class DriverAssignmentDto
    {
        public Guid BookingId { get; set; }
        public string BookingNumber { get; set; } = null!;
        public DateTime PickupDate { get; set; }
        public DateTime ReturnDate { get; set; }
        public string? PickupLocation { get; set; }
        public string? DropoffLocation { get; set; }
        public string CustomerName { get; set; } = null!;
        public string CustomerPhone { get; set; } = null!;
        public string VehicleName { get; set; } = null!;
        public decimal Earnings { get; set; }
        public string Status { get; set; } = null!;
    }
}
