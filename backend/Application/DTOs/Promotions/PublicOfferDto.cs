using System;
using System.Collections.Generic;

namespace Backend.Application.DTOs.Promotions
{
    public record PublicOfferDto(
        Guid Id,
        string Code,
        string Description,
        string DiscountType,
        decimal DiscountValue,
        string DiscountDisplay,
        DateTime ValidFrom,
        DateTime ValidTo,
        List<string>? CategoryNames,
        bool IsAutomatic,
        int? MinimumDurationHours,
        decimal? MinimumValue
    );
}
