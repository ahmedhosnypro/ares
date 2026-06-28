using Backend.Application.DTOs.Dashboard;

namespace Backend.Application.Interfaces;

/// <summary>
/// Read-only analytics service for the supplier-facing dashboard.
///
/// Kept separate from <see cref="IDashboardService"/> so the supplier
/// portal can evolve independently of the admin dashboard without
/// risking regressions to existing admin behaviour.
/// </summary>
public interface ISupplierDashboardService
{
    /// <summary>
    /// Returns the four headline stats for the authenticated supplier.
    /// All numbers are filtered by <c>Vehicle.UserId == supplierId</c>.
    /// </summary>
    /// <param name="supplierId">Authenticated supplier user id.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task<SupplierDashboardStatsDto> GetStatsAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns booking counts grouped by business-friendly categories for the
    /// authenticated supplier. All counts are filtered by <c>Vehicle.UserId == supplierId</c>.
    /// </summary>
    /// <param name="supplierId">Authenticated supplier user id.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task<BookingsByStatusDto> GetBookingsByStatusAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns vehicle counts grouped by their actual AvailabilityStatus for the authenticated supplier.
    /// Used for the Vehicle Status Distribution chart.
    /// </summary>
    Task<Dictionary<string, int>> GetVehicleStatusDistributionAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default);
}
