using System;

namespace Backend.Application.DTOs.Driver
{
    public class AdminDriverListItemDto
    {
        public Guid DriverProfileId { get; set; }
        public Guid UserId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string Status { get; set; } = null!;
        public string Availability { get; set; } = null!;
        public bool IsActive { get; set; }
        public double AverageRating { get; set; }
        public int TotalTrips { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
