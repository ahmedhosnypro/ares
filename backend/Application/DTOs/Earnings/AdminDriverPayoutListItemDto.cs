namespace Backend.Application.DTOs.Earnings;

public record AdminDriverPayoutListItemDto(
    Guid PayoutId,
    Guid DriverProfileId,
    string DriverName,
    decimal Amount,
    string Status,
    DateTime RequestedAt,
    DateTime? ReviewedAt,
    DateTime? ProcessedAt,
    string? RejectionReason,
    string? PaymobTransactionId,
    string? WalletPhoneNumber,
    bool IsWalletVerified
);
