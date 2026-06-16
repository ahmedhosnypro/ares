using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Driver
{
    public class CreateDriverReviewRequest
    {
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        public string? Comment { get; set; }
    }

    public class DriverReviewDto
    {
        public Guid Id { get; set; }
        public Guid BookingId { get; set; }
        public Guid DriverProfileId { get; set; }
        public Guid CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
