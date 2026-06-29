namespace Backend.Application.DTOs.Booking;

/// <summary>
/// Response DTO for booking creation
/// </summary>
public record BookingResponse(
    Guid BookingId,
    string BookingNumber,
    string Status,
    decimal TotalPrice,
    string Message,
    Guid? ApprovedBy = null,
    DateTime? ApprovedAt = null,
    string? RejectionReason = null);
