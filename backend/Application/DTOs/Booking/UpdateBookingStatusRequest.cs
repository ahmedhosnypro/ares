using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Booking;

/// <summary>
/// Request DTO for updating the status of a booking
/// </summary>
public record UpdateBookingStatusRequest(
    [Required]
    string Status,

    string? Remarks
);
