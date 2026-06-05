using System;
using System.Collections.Generic;

namespace Backend.Application.DTOs.Driver
{
    public class AdminDriverDetailsDto : DriverProfileDetailsDto
    {
        public int TotalTrips { get; set; }
        public double AverageRating { get; set; }
        public decimal TotalEarnings { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
