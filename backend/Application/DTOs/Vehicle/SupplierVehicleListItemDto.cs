namespace Backend.Application.DTOs.Vehicle;

/// <summary>
/// Row shape for the supplier-facing vehicles table
/// (<c>GET /api/supplier/vehicles</c>).
///
/// A separate record from the public <see cref="VehicleListDto"/> on purpose
/// — the supplier table needs operational fields (admin status, availability,
/// bookings count, created at) that don't belong on the public search list.
/// </summary>
/// <param name="VehicleId">Vehicle id.</param>
/// <param name="Make">Manufacturer.</param>
/// <param name="Model">Model name.</param>
/// <param name="Year">Model year (nullable to tolerate legacy rows).</param>
/// <param name="ImageUrl">URL of the primary image, or empty string when none.</param>
/// <param name="LicensePlate">License plate (kept here to support quick search by plate in the table).</param>
/// <param name="PricePerDay">Daily rental price.</param>
/// <param name="Status">Admin lifecycle status: Pending / Approved / Rejected / Deleted.</param>
/// <param name="AvailabilityStatus">Public visibility flag: Available / Unavailable / FullyBooked / etc.</param>
/// <param name="BookingsCount">Total bookings created for this vehicle (any status). Useful for the table.</param>
/// <param name="CreatedAt">UTC timestamp of vehicle creation.</param>
public record SupplierVehicleListItemDto(
    Guid VehicleId,
    string Make,
    string Model,
    int? Year,
    string ImageUrl,
    string LicensePlate,
    decimal PricePerDay,
    string Status,
    string AvailabilityStatus,
    int BookingsCount,
    DateTime CreatedAt
);
