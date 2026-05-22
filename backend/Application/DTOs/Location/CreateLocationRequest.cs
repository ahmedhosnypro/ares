using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Location;

/// <summary>
/// Request DTO for creating a new location
/// </summary>
public record CreateLocationRequest(
    [Required]
    Guid UserId,

    [MaxLength(255)]
    string? AddressLine,

    [MaxLength(100)]
    string? City,

    [MaxLength(100)]
    string? Governorate,

    [MaxLength(100)]
    string? Country,

    [MaxLength(20)]
    string? PostalCode,

    decimal? Latitude,

    decimal? Longitude,

    bool IsPrimary = false,

    [MaxLength(500)]
    string? ImageUrl = null);