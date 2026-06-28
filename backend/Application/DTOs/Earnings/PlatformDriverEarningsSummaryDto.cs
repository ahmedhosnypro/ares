namespace Backend.Application.DTOs.Earnings;

public record PlatformDriverEarningsSummaryDto(
    decimal TotalDriverEarnings,
    decimal TotalPlatformDeduction,
    decimal TotalPayoutsCompleted,
    decimal TotalPendingPayouts,
    int TotalActiveDrivers,
    int PendingPayoutRequests,
    int PendingWalletVerifications
);
