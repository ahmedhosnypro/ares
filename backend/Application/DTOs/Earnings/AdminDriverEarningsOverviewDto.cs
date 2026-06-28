namespace Backend.Application.DTOs.Earnings;

public record AdminDriverEarningsOverviewDto(
    Guid DriverProfileId,
    string DriverName,
    string? ProfilePictureUrl,
    decimal TotalEarnings,
    decimal AvailableBalance,
    decimal PendingPayoutAmount,
    decimal PaidOutAmount,
    int CompletedTripsCount,
    bool HasPaymentInfo,
    bool IsWalletVerified
);
