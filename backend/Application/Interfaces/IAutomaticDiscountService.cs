using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Application.Interfaces
{
    public interface IAutomaticDiscountService
    {
        Task<List<AutomaticDiscountDto>> GetAutomaticDiscountsAsync(
            Guid customerId,
            Guid? vehicleId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            decimal? subtotal = null,
            CancellationToken cancellationToken = default);
    }

    public class AutomaticDiscountDto
    {
        public Guid DiscountId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string DiscountType { get; set; } = "percentage";
        public decimal DiscountValue { get; set; }
        public decimal? DiscountAmount { get; set; }
        public int Priority { get; set; }
    }
}
