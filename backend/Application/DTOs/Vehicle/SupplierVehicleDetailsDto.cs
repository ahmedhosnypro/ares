namespace Backend.Application.DTOs.Vehicle;

/// <summary>
/// Detail payload for the supplier portal's vehicle edit page
/// (<c>GET /api/supplier/vehicles/{id}</c>).
///
/// Includes every field the supplier might need to inspect or edit.
/// <see cref="IsReadOnly"/> is computed server-side based on
/// <see cref="Status"/> so the frontend doesn't have to duplicate the
/// rejected-is-read-only business rule.
/// </summary>
public record SupplierVehicleDetailsDto(
    Guid VehicleId,
    string Make,
    string Model,
    int? Year,
    string Color,
    string LicensePlate,
    string Transmission,
    string FuelType,
    int? Seats,
    decimal PricePerDay,
    string LocationCity,
    string Description,
    string ImageUrl,
    string Status,
    string AvailabilityStatus,
    int BookingsCount,
    bool IsReadOnly,
    DateTime CreatedAt
);
