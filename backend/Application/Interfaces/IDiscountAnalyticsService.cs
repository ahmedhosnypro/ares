using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Application.Interfaces
{
    public interface IDiscountAnalyticsService
    {
        Task<DiscountAnalyticsDto> GetDiscountAnalyticsAsync(
            Guid discountId,
            DateTime? startDate = null,
            DateTime? endDate = null,
            CancellationToken cancellationToken = default);
    }

    public class DiscountAnalyticsDto
    {
        public Guid DiscountId { get; set; }
        public string Code { get; set; } = string.Empty;
        public int TotalUses { get; set; }
        public int UniqueCustomers { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalDiscount { get; set; }
        public decimal AverageDiscountPerBooking { get; set; }
        public decimal ConversionRate { get; set; }
        public int NewCustomersAcquired { get; set; }
        public decimal Roi { get; set; }
        public List<UsageByDateDto> UsageByDate { get; set; } = new();
    }

    public class UsageByDateDto
    {
        public DateTime Date { get; set; }
        public int Uses { get; set; }
        public decimal Revenue { get; set; }
        public decimal Discount { get; set; }
    }
}
