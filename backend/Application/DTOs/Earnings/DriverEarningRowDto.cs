using System;
using Backend.Domain.Entities.Enums;

namespace Backend.Application.DTOs.Earnings
{
    /// <summary>
    /// Single row in the paginated earnings history table.
    /// </summary>
    public record DriverEarningRowDto(
        Guid BookingId,
        string BookingNumber,
        DateTime CompletedAt,
        decimal GrossEarning,
        decimal PlatformDeduction,
        decimal NetEarning,
        DriverEarningStatus Status
    );
}