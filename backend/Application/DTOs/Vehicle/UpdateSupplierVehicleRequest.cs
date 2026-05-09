using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Vehicle;

/// <summary>
/// Supplier-facing update-vehicle payload for
/// <c>PUT /api/supplier/vehicles/{id}</c>.
///
/// All fields are optional — only fields explicitly sent are applied.
/// <c>Status</c> and <c>AvailabilityStatus</c> are intentionally absent:
///   * <c>Status</c> is owned by admins (Pending → Approved/Rejected).
///   * <c>AvailabilityStatus</c> has its own dedicated toggle endpoint
///     (<c>PATCH /api/supplier/vehicles/{id}/availability</c>) so the
///     update flow stays focused on profile editing.
/// </summary>
public record UpdateSupplierVehicleRequest(
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
    string? ImageUrl
);
