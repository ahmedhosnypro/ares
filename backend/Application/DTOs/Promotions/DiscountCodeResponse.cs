using System;
using System.Collections.Generic;

namespace Backend.Application.DTOs.Promotions
{
    public record DiscountCodeResponse(
        Guid DiscountId,
        string Code,
        string Description,
        string DiscountType,
        decimal DiscountValue,
        DateTime ValidFrom,
        DateTime ValidTo,
        int? UsageLimitTotal,
        int UsageLimitPerCustomer,
        int CurrentUsageCount,
        int? RemainingUses,
        List<string> CustomerSegments,
        List<Guid> VehicleCategoryIds,
        int? MinimumDuration,
        decimal? MinimumValue,
        bool AllowStacking,
        bool IsAutomatic,
        int Priority,
        bool IsActive,
        Guid SupplierId,
        Guid CreatedBy,
        DateTime CreatedAt,
        DateTime UpdatedAt
    );
}
