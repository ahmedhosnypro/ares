using System;
using Backend.Domain.Entities.Enums;

namespace Backend.Application.DTOs.Earnings
{
    /// <summary>
    /// DTO for payout history entries.
    /// </summary>
    public record DriverPayoutDto(
        Guid Id,
        DateTime RequestedAt,
        decimal Amount,
        DriverPayoutStatus Status,
        DateTime? ReviewedAt,
        string? RejectionReason,
        string? PaymobTransactionId,
        DateTime? CompletedAt
    );
}