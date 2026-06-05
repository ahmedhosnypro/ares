using Backend.Domain.Entities.Enums;

namespace Backend.Application.DTOs.Driver
{
    public class DriverProfileStatusDto
    {
        public DriverProfileStatus Status { get; set; }
        public DriverAvailability Availability { get; set; }
        public bool IsActive { get; set; }
        public string? RejectionReason { get; set; }
    }
}
