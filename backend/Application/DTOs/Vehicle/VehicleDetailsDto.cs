using Backend.Application.DTOs.Common;

namespace Backend.Application.DTOs.Vehicle;

/// <summary>
/// DTO for detailed vehicle information
/// </summary>
public record VehicleDetailsDto(
    Guid VehicleId,
    string Make,
    string Model,
    int Year,
    string Color,
    string LicensePlate,
    string Transmission,
    string FuelType,
    int Seats,
    decimal PricePerDay,
    decimal? OriginalPricePerDay,
    decimal? DiscountPercentage,
    string LocationCity,
    string Description,
    string Status,
    string AvailabilityStatus,
    List<VehicleImageDto> Images,
    List<VehicleFeatureDto> Features,
    SupplierDto Supplier,
    double AverageRating,
    int ReviewCount,
    Guid? CategoryId = null,
    string? CategoryName = null);
