namespace Backend.Application.DTOs.Review;

/// <summary>
/// DTO returned for the review attached to a single booking.
/// Includes the 24h edit window flag so the UI can lock the form after the deadline.
/// This is a NEW DTO and does not modify <see cref="ReviewDto"/>, which is still used
/// by the public vehicle reviews endpoint.
/// </summary>
public record BookingReviewDto(
    Guid ReviewId,
    Guid BookingId,
    Guid VehicleId,
    Guid UserId,
    int Rating,
    string? Comment,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime EditDeadline,
    bool CanEdit);
