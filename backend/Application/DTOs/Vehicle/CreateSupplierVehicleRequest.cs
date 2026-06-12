using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Vehicle;

/// <summary>
/// Supplier-facing create-vehicle payload for
/// <c>POST /api/supplier/vehicles</c>.
///
/// Differs from <see cref="CreateVehicleRequest"/> in two important ways:
///   * <b>No <c>UserId</c> field.</b> Owner is taken from the authenticated
///     supplier's claim; the frontend cannot inject another supplier's id.
///   * <b>No <c>Status</c> / <c>AvailabilityStatus</c> fields.</b> The
///     service forces <c>Status = "Pending"</c> (awaiting admin approval)
///     and <c>AvailabilityStatus = "Unavailable"</c> on creation, per spec.
///
/// First version supports a single image URL (<see cref="ImageUrl"/>).
/// </summary>
public record CreateSupplierVehicleRequest(
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
    [Required] Guid CategoryId,
    string? Description,
    string? ImageUrl
);
