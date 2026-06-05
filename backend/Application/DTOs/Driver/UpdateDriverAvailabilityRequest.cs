using Backend.Domain.Entities.Enums;

namespace Backend.Application.DTOs.Driver
{
    public class UpdateDriverAvailabilityRequest
    {
        public DriverAvailability Availability { get; set; }
    }
}
