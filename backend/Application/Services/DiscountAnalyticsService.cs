using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services
{
    public class DiscountAnalyticsService : IDiscountAnalyticsService
    {
        private readonly IApplicationDbContext _context;
        private readonly ILogger<DiscountAnalyticsService> _logger;

        public DiscountAnalyticsService(IApplicationDbContext context, ILogger<DiscountAnalyticsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<DiscountAnalyticsDto> GetDiscountAnalyticsAsync(
            Guid discountId,
            DateTime? startDate = null,
            DateTime? endDate = null,
            CancellationToken cancellationToken = default)
        {
            var discount = await _context.DiscountCodes
                .FirstOrDefaultAsync(d => d.Id == discountId, cancellationToken);

            if (discount == null)
            {
                return new DiscountAnalyticsDto
                {
                    DiscountId = discountId
                };
            }

            var usageQuery = _context.DiscountUsages
                .Where(u => u.DiscountId == discountId);

            if (startDate.HasValue)
            {
                usageQuery = usageQuery.Where(u => u.UsedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                usageQuery = usageQuery.Where(u => u.UsedAt <= endDate.Value);
            }

            var totalUses = await usageQuery.CountAsync(cancellationToken);
            var uniqueCustomers = await usageQuery.Select(u => u.CustomerId).Distinct().CountAsync(cancellationToken);
            var totalRevenue = await usageQuery.SumAsync(u => u.FinalPrice, cancellationToken);
            var totalDiscount = await usageQuery.SumAsync(u => u.DiscountAmount, cancellationToken);
            var averageDiscountPerBooking = totalUses > 0 ? Math.Round(totalDiscount / totalUses, 2) : 0m;

            var newCustomersAcquired = await CountNewCustomersAsync(usageQuery, endDate, cancellationToken);

            var conversionRate = await CalculateConversionRateAsync(discount.Code, discountId, startDate, endDate, cancellationToken);

            var roi = totalDiscount > 0 ? Math.Round(totalRevenue / totalDiscount, 2) : 0m;

            var usageProjections = await usageQuery
                .Select(u => new { u.UsedAt.Date, u.FinalPrice, u.DiscountAmount })
                .ToListAsync(cancellationToken);

            var usageByDate = usageProjections
                .GroupBy(u => u.Date)
                .Select(g => new UsageByDateDto
                {
                    Date = g.Key,
                    Uses = g.Count(),
                    Revenue = g.Sum(x => x.FinalPrice),
                    Discount = g.Sum(x => x.DiscountAmount)
                })
                .OrderBy(x => x.Date)
                .ToList();

            return new DiscountAnalyticsDto
            {
                DiscountId = discountId,
                Code = discount.Code,
                TotalUses = totalUses,
                UniqueCustomers = uniqueCustomers,
                TotalRevenue = totalRevenue,
                TotalDiscount = totalDiscount,
                AverageDiscountPerBooking = averageDiscountPerBooking,
                ConversionRate = conversionRate,
                NewCustomersAcquired = newCustomersAcquired,
                Roi = roi,
                UsageByDate = usageByDate
            };
        }

        private async Task<int> CountNewCustomersAsync(IQueryable<Domain.Entities.DiscountUsage> usageQuery, DateTime? endDate, CancellationToken cancellationToken)
        {
            var bookingCutoff = endDate ?? DateTime.UtcNow;

            var discountCustomerIds = await usageQuery
                .Select(u => u.CustomerId)
                .Distinct()
                .ToListAsync(cancellationToken);

            if (discountCustomerIds.Count == 0) return 0;

            var returningCustomerIds = await _context.Bookings
                .Where(b => discountCustomerIds.Contains(b.UserId) &&
                    (b.Status == Domain.Entities.Enums.BookingStatus.Completed ||
                     b.Status == Domain.Entities.Enums.BookingStatus.Confirmed ||
                     b.Status == Domain.Entities.Enums.BookingStatus.Active) &&
                    b.CreatedAt <= bookingCutoff)
                .GroupBy(b => b.UserId)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToListAsync(cancellationToken);

            return discountCustomerIds.Count - returningCustomerIds.Count;
        }

        private async Task<decimal> CalculateConversionRateAsync(
            string code,
            Guid discountId,
            DateTime? startDate,
            DateTime? endDate,
            CancellationToken cancellationToken)
        {
            var validationQuery = _context.DiscountValidationLogs
                .Where(v => v.DiscountId == discountId);

            if (startDate.HasValue)
            {
                validationQuery = validationQuery.Where(v => v.ValidatedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                validationQuery = validationQuery.Where(v => v.ValidatedAt <= endDate.Value);
            }

            var totalValidations = await validationQuery.CountAsync(cancellationToken);

            if (totalValidations == 0)
                return 0m;

            var validValidations = await validationQuery.CountAsync(v => v.IsValid, cancellationToken);

            return Math.Round((decimal)validValidations / totalValidations * 100, 2);
        }
    }
}
