using System;
using System.Collections.Generic;

namespace Backend.Application.DTOs.Driver
{
    public class PublicDriverDto
    {
        public Guid DriverProfileId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public double AverageRating { get; set; }
        public int TotalTrips { get; set; }
    }
}
