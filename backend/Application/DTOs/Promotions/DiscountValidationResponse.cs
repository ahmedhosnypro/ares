using System;
using System.Collections.Generic;

namespace Backend.Application.DTOs.Promotions
{
    public record DiscountValidationResponse(
        bool IsValid,
        Guid? DiscountId,
        string? Code,
        string? DiscountType,
        decimal? DiscountValue,
        decimal DiscountAmount,
        decimal FinalPrice,
        decimal SavingsPercentage,
        List<DiscountValidationErrorDto> Errors
    );

    public record DiscountValidationErrorDto(string Code, string Message);
}
