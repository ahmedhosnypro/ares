namespace Backend.Application.DTOs.Location;

/// <summary>
/// Location information DTO for location management
/// </summary>
public record LocationDto(
    Guid Id,
    string? AddressLine,
    string? City,
    string? Governorate,
    string? Country,
    string? PostalCode,
    decimal? Latitude,
    decimal? Longitude,
    bool IsPrimary,
    string? ImageUrl,
    DateTime CreatedAt,
    DateTime UpdatedAt);