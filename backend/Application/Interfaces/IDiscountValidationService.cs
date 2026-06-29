using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Application.Interfaces
{
    public interface IDiscountValidationService
    {
        Task<DiscountValidationResult> ValidateDiscountCodeAsync(
            string code,
            Guid vehicleId,
            Guid? customerId,
            DateTime startDate,
            DateTime endDate,
            decimal subtotal,
            string? ipAddress = null,
            string? userAgent = null,
            CancellationToken cancellationToken = default);
    }

    public class DiscountValidationResult
    {
        public bool IsValid { get; set; }
        public Guid? DiscountId { get; set; }
        public string? Code { get; set; }
        public string? DiscountType { get; set; }
        public decimal? DiscountValue { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalPrice { get; set; }
        public decimal SavingsPercentage { get; set; }
        public List<DiscountValidationError> Errors { get; set; } = new();

        public static DiscountValidationResult Valid(Guid discountId, string code, string discountType, decimal discountValue, decimal discountAmount, decimal finalPrice, decimal savingsPercentage)
        {
            return new DiscountValidationResult
            {
                IsValid = true,
                DiscountId = discountId,
                Code = code,
                DiscountType = discountType,
                DiscountValue = discountValue,
                DiscountAmount = discountAmount,
                FinalPrice = finalPrice,
                SavingsPercentage = savingsPercentage
            };
        }

        public static DiscountValidationResult Invalid(string errorCode, string message)
        {
            return new DiscountValidationResult
            {
                IsValid = false,
                Errors = new List<DiscountValidationError> { new(errorCode, message) }
            };
        }
    }

    public class DiscountValidationError
    {
        public string Code { get; set; }
        public string Message { get; set; }

        public DiscountValidationError(string code, string message)
        {
            Code = code;
            Message = message;
        }
    }
}
