namespace Backend.Application.DTOs.Vehicle;

/// <summary>
/// Aggregate statistics for the Admin / Supplier "Vehicles" dashboard card row.
///
/// Returned by <c>GET /api/vehicles/admin/stats</c>. All counts are computed
/// from the database — they are intentionally NOT derived from the paginated
/// list endpoint, so the cards keep showing system-wide truth regardless of
/// the current page, page size, or active search/filter on the table.
///
/// Scoping rules (enforced in the service layer, identical to the rules
/// already used by <see cref="VehicleListDto"/>):
/// <list type="bullet">
///   <item><description>Admin → counts span every active vehicle in the system.</description></item>
///   <item><description>Supplier → counts are restricted to vehicles owned by the calling supplier.</description></item>
/// </list>
///
/// All counts only consider rows where <c>IsActive = true</c> so soft-deleted
/// vehicles never appear in the totals — this matches the filter used by the
/// admin vehicles table.
/// </summary>
/// <param name="TotalVehicles">Total number of (non-soft-deleted) vehicles in scope.</param>
/// <param name="AvailableVehicles">Vehicles whose <c>AvailabilityStatus</c> is "Available".</param>
/// <param name="OnRentalVehicles">
/// Distinct vehicles currently tied to an in-progress booking
/// (<c>BookingStatus.Active</c>). A vehicle is counted at most once even when
/// it has multiple active booking rows.
/// </param>
public record AdminVehicleStatsDto(
    int TotalVehicles,
    int AvailableVehicles,
    int OnRentalVehicles);
