using Backend.Application.DTOs.Common;

namespace Backend.Application.DTOs.Booking;

/// <summary>
/// Vehicle information with supplier details for booking details
/// </summary>
public record VehicleWithSupplierDto(
    Guid Id,
    string Name,
    string Image,
    SupplierDto Supplier,
    string? PlateNumber = null,
    decimal? DailyRate = null,
    string? Make = null,
    string? Model = null,
    int? Year = null,
    string? AvailabilityStatus = null);
