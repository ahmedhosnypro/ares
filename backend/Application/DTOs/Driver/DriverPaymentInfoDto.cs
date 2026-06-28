namespace Backend.Application.DTOs.Driver;

public record DriverPaymentInfoDto(
    string? WalletPhoneNumber,
    string PayoutMethod,
    bool IsVerified
);

public class UpdatePayoutInfoRequest
{
    public string WalletPhoneNumber { get; set; } = string.Empty;
}
