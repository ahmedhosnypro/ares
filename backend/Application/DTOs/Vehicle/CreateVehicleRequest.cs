using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Vehicle;

/// <summary>
/// Request DTO for creating a new vehicle
/// </summary>
public record CreateVehicleRequest(
    [Required] Guid UserId,
    [Required][MaxLength(100)] string Make,
    [Required][MaxLength(100)] string Model,
    [Required] int Year,
    [Required][MaxLength(50)] string Color,
    [Required][MaxLength(50)] string LicensePlate,
    [Required][MaxLength(50)] string Transmission,
    [Required][MaxLength(50)] string FuelType,
    [Required] int Seats,
    [Required] decimal PricePerDay,
    [Required][MaxLength(100)] string LocationCity,
    string? Description,
    [MaxLength(50)] string Status = "Active",
    [MaxLength(50)] string AvailabilityStatus = "Available"
);