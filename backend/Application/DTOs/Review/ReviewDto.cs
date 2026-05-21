namespace Backend.Application.DTOs.Review;

/// <summary>
/// DTO for review information
/// </summary>
public record ReviewDto(
    Guid ReviewId,
    Guid VehicleId,
    Guid UserId,
    string UserName,
    int Rating,
    string? Comment,
    string? AdminResponse,
    string? SupplierReply,
    DateTime? RepliedAt,
    DateTime CreatedAt);
