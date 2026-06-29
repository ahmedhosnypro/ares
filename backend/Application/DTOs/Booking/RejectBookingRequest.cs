using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Booking;

public record RejectBookingRequest(
    [Required]
    string Reason);
