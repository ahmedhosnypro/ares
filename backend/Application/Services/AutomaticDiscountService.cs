using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services
{
    public class AutomaticDiscountService : IAutomaticDiscountService
    {
        private readonly IApplicationDbContext _context;
        private readonly ILogger<AutomaticDiscountService> _logger;

        public AutomaticDiscountService(IApplicationDbContext context, ILogger<AutomaticDiscountService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<AutomaticDiscountDto>> GetAutomaticDiscountsAsync(
            Guid customerId,
            Guid? vehicleId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            decimal? subtotal = null,
            CancellationToken cancellationToken = default)
        {
            var customerSegment = await CustomerSegmentHelper.DetermineSegmentAsync(_context, customerId, cancellationToken);

            var now = DateTime.UtcNow;
            var query = _context.DiscountCodes
                .Include(d => d.VehicleCategories)
                .Where(d => d.IsActive && d.IsAutomatic && d.ValidFrom <= now && d.ValidTo >= now)
                .Where(d => !d.UsageLimitTotal.HasValue || d.CurrentUsageCount < d.UsageLimitTotal.Value)
                .AsQueryable();

            var discounts = await query.ToListAsync(cancellationToken);

            var eligibleDiscounts = new List<AutomaticDiscountDto>();

            var discountIds = discounts.Select(d => d.Id).ToList();
            var usageCountsByDiscount = await _context.DiscountUsages
                .Where(u => u.CustomerId == customerId && discountIds.Contains(u.DiscountId))
                .GroupBy(u => u.DiscountId)
                .Select(g => new { DiscountId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.DiscountId, x => x.Count, cancellationToken);

            Vehicle? vehicle = null;
            if (vehicleId.HasValue)
            {
                vehicle = await _context.Vehicles
                    .FirstOrDefaultAsync(v => v.Id == vehicleId.Value, cancellationToken);
            }

            foreach (var discount in discounts)
            {
                var allowedSegments = CustomerSegmentHelper.ParseSegments(discount.CustomerSegments);
                if (!allowedSegments.Contains("all", StringComparer.OrdinalIgnoreCase) &&
                    !allowedSegments.Contains(customerSegment, StringComparer.OrdinalIgnoreCase))
                {
                    continue;
                }

                var customerUsageCount = usageCountsByDiscount.TryGetValue(discount.Id, out var cnt) ? cnt : 0;

                if (customerUsageCount >= discount.UsageLimitPerCustomer)
                {
                    continue;
                }

                if (vehicleId.HasValue && vehicle != null && discount.VehicleCategories != null && discount.VehicleCategories.Any())
                {
                    if (!vehicle.CategoryId.HasValue || !discount.VehicleCategories.Any(vc => vc.CategoryId == vehicle.CategoryId.Value))
                    {
                        continue;
                    }
                }

                if (discount.MinimumDuration.HasValue && startDate.HasValue && endDate.HasValue)
                {
                    var durationHours = (endDate.Value - startDate.Value).TotalHours;
                    if (durationHours < discount.MinimumDuration.Value)
                    {
                        continue;
                    }
                }

                if (discount.MinimumValue.HasValue && subtotal.HasValue && subtotal.Value < discount.MinimumValue.Value)
                {
                    continue;
                }

                decimal? calculatedAmount = null;
                if (subtotal.HasValue)
                {
                    calculatedAmount = discount.DiscountType == "percentage"
                        ? Math.Round(subtotal.Value * (discount.DiscountValue / 100m), 2)
                        : Math.Min(discount.DiscountValue, subtotal.Value);
                }

                eligibleDiscounts.Add(new AutomaticDiscountDto
                {
                    DiscountId = discount.Id,
                    Code = discount.Code,
                    Description = discount.Description,
                    DiscountType = discount.DiscountType,
                    DiscountValue = discount.DiscountValue,
                    DiscountAmount = calculatedAmount,
                    Priority = discount.Priority
                });
            }

            return eligibleDiscounts
                .OrderByDescending(d => d.Priority)
                .ThenByDescending(d => d.DiscountAmount ?? d.DiscountValue)
                .ToList();
        }

    }
}
