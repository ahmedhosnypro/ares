namespace Backend.Application.DTOs.Earnings
{
    /// <summary>
    /// Request body for a payout request.
    /// </summary>
    public record DriverPayoutRequestDto(
        decimal Amount
    );
}