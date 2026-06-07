using Backend.Application.DTOs.Dashboard;

namespace Backend.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns at most one latest real event per category (booking, payment, user, vehicle, verification),
    /// sorted by CreatedAt descending. Never returns fake or mock data.
    /// </summary>
    Task<IReadOnlyList<RecentActivityItemDto>> GetRecentSummaryAsync(Guid? supplierId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RecentBookingDto>> GetRecentBookingsAsync(Guid? supplierId, int limit = 5, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UpcomingBookingDto>> GetUpcomingBookingsAsync(Guid? supplierId, int days = 7, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RevenueDataPointDto>> GetRevenueWeekAsync(Guid? supplierId, CancellationToken cancellationToken = default);

    Task<LiveTrackingDto> GetLiveTrackingAsync(Guid? supplierId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TopVehicleDto>> GetTopVehiclesAsync(Guid? supplierId, int limit = 5, CancellationToken cancellationToken = default);

    Task<SystemStatusDto> GetSystemStatusAsync(CancellationToken cancellationToken = default);

    Task<RevenueOverviewDto> GetRevenueOverviewAsync(string filter, CancellationToken cancellationToken = default);
}
