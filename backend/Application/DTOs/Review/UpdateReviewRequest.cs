namespace Backend.Application.DTOs.Review;

/// <summary>
/// Request DTO for updating an existing review within the 24h edit window.
/// </summary>
/// <param name="Rating">The updated rating (1-5)</param>
/// <param name="Comment">Optional updated review comment</param>
public record UpdateReviewRequest(
    int Rating,
    string? Comment);
