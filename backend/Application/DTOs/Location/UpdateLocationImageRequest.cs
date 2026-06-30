using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Location;

/// <summary>
/// Request DTO for updating a location's image URL
/// </summary>
public record UpdateLocationImageRequest(
    [MaxLength(500)]
    string? ImageUrl);
