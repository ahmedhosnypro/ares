using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Vehicle;

/// <summary>
/// Request DTO for updating an existing vehicle
/// </summary>
public record UpdateVehicleRequest(
    [MaxLength(100)] string? Make,
    [MaxLength(100)] string? Model,
    int? Year,
    [MaxLength(50)] string? Color,
    [MaxLength(50)] string? LicensePlate,
    [MaxLength(50)] string? Transmission,
    [MaxLength(50)] string? FuelType,
    int? Seats,
    decimal? PricePerDay,
    [MaxLength(100)] string? LocationCity,
    string? Description,
    [MaxLength(50)] string? Status,
    [MaxLength(50)] string? AvailabilityStatus,
    List<VehicleImageUpdateDto>? Images = null,
    List<VehicleFeatureUpdateDto>? Features = null
);