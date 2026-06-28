using Backend.Application.DTOs.Earnings;

namespace Backend.Application.Interfaces;

public interface IDriverEarningsAdminService
{
    Task<AdminDriverEarningsOverviewDto> GetDriverEarningsOverviewAsync(Guid driverProfileId, CancellationToken ct = default);
    Task<IReadOnlyList<AdminDriverPayoutListItemDto>> GetPendingPayoutsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AdminDriverPayoutListItemDto>> GetPendingVerificationAsync(CancellationToken ct = default);
    Task ApprovePayoutAsync(Guid payoutId, Guid adminUserId, CancellationToken ct = default);
    Task RejectPayoutAsync(Guid payoutId, Guid adminUserId, string reason, CancellationToken ct = default);
    Task RetryFailedPayoutAsync(Guid payoutId, Guid adminUserId, CancellationToken ct = default);
    Task VerifyWalletInfoAsync(Guid driverProfileId, CancellationToken ct = default);
    Task<IReadOnlyList<DriverEarningRowDto>> GetDriverEarningsHistoryAsync(Guid driverProfileId, int pageNumber, int pageSize, CancellationToken ct = default);
    Task<PlatformDriverEarningsSummaryDto> GetPlatformEarningsSummaryAsync(CancellationToken ct = default);
}
