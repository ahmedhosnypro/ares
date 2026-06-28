namespace Backend.Application.DTOs.Earnings
{
    /// <summary>
    /// Summary statistics for the driver earnings dashboard.
    /// </summary>
    public record DriverEarningsStatsDto(
        decimal TotalEarnings,
        decimal ThisMonthEarnings,
        decimal LastMonthEarnings,
        decimal AvailableBalance,
        decimal PendingPayoutAmount,
        int CompletedTripsCount
    );
}