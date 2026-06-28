using Backend.Application.DTOs.Earnings;

namespace Backend.Application.Services;

/// <summary>
/// Read-only earnings analytics for the Supplier portal.
///
/// Every method takes the authenticated <c>supplierId</c> as its first
/// argument and is responsible for filtering its underlying queries by
/// <c>booking.Vehicle.UserId == supplierId</c>. By contract, earnings,
/// counts and chart series are aggregated from <c>Completed</c> bookings
/// only — pending, in-flight and cancelled bookings never contribute to
/// any return value.
///
/// Kept separate from <see cref="ISupplierDashboardService"/> so the
/// dashboard headline stats endpoint and the earnings analytics endpoints
/// can evolve independently without coupling.
/// </summary>
public interface ISupplierEarningsService
{
    /// <summary>
    /// Returns the four headline earnings figures for the supplier:
    /// total earnings, this-month revenue, last-month revenue, and
    /// completed-bookings count.
    /// </summary>
    Task<SupplierEarningsStatsDto> GetStatsAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns 12 monthly revenue data points (Jan..Dec) for the given
    /// calendar year. Months with no completed bookings appear with
    /// <see cref="MonthlyRevenuePointDto.Revenue"/> = 0 so the frontend
    /// chart always renders a full axis.
    /// </summary>
    /// <param name="supplierId">Authenticated supplier id.</param>
    /// <param name="year">Calendar year to aggregate; defaults to current UTC year when null.</param>
    Task<IReadOnlyList<MonthlyRevenuePointDto>> GetMonthlyChartAsync(
        Guid supplierId,
        int? year = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the top 5 vehicles owned by the supplier.
    /// Ranked by lifetime completed-booking earnings (if sortBy="earnings") 
    /// or by total completed bookings (if sortBy="bookings").
    /// Vehicles with zero completed bookings are excluded.
    /// </summary>
    Task<IReadOnlyList<SupplierTopVehicleDto>> GetTopVehiclesAsync(
        Guid supplierId,
        string sortBy = "earnings",
        CancellationToken cancellationToken = default);
}
