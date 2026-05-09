namespace Backend.Application.DTOs.Vehicle;

/// <summary>
/// Filter / search parameters for the supplier-facing vehicles list
/// (<c>GET /api/supplier/vehicles</c>).
///
/// All fields are optional — when omitted the supplier sees their entire
/// (non-deleted) fleet. Filtering is performed server-side; the frontend
/// just forwards user input through query string.
/// </summary>
/// <param name="Search">
/// Free-text search applied (case-insensitively) against
/// <c>Make</c>, <c>Model</c>, and <c>LicensePlate</c>.
/// </param>
/// <param name="Status">
/// Optional admin lifecycle status filter, e.g. "Pending" / "Approved" /
/// "Rejected". Compared case-insensitively.
/// </param>
/// <param name="AvailabilityStatus">
/// Optional availability filter, e.g. "Available" / "Unavailable".
/// Compared case-insensitively.
/// </param>
public record SupplierVehicleListFilterRequest(
    string? Search = null,
    string? Status = null,
    string? AvailabilityStatus = null
);
