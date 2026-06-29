using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services
{
    public class PricingService : IPricingService
    {
        private readonly IApplicationDbContext _context;

        public PricingService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(decimal OriginalPrice, decimal DiscountAmount, decimal FinalPrice)> CalculateBookingPricingAsync(
            Guid vehicleId,
            DateTime pickupDate,
            DateTime returnDate,
            CancellationToken cancellationToken = default)
        {
            var vehicle = await _context.Vehicles
                .Include(v => v.Category)
                .FirstOrDefaultAsync(v => v.Id == vehicleId, cancellationToken);

            if (vehicle == null)
            {
                throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
            }

            var pricePerDay = vehicle.PricePerDay ?? 0m;
            int totalDays = (returnDate - pickupDate).Days;

            if (totalDays <= 0) totalDays = 1;

            var originalPrice = pricePerDay * totalDays;

            var applicableDiscounts = vehicle.CategoryId.HasValue
                ? await _context.DiscountCodes
                    .Include(d => d.VehicleCategories)
                    .Where(d => d.IsActive && d.IsAutomatic && d.ValidFrom <= DateTime.UtcNow && d.ValidTo >= DateTime.UtcNow)
                    .Where(d => !d.VehicleCategories.Any() || d.VehicleCategories.Any(vc => vc.CategoryId == vehicle.CategoryId.Value))
                    .OrderByDescending(d => d.Priority)
                    .ThenByDescending(d => d.DiscountValue)
                    .ToListAsync(cancellationToken)
                : new List<DiscountCode>();

            decimal discountAmount = 0m;

            if (applicableDiscounts.Count > 0)
            {
                var canStack = applicableDiscounts.Any(d => d.AllowStacking);
                if (canStack)
                {
                    var stackableDiscounts = applicableDiscounts.Where(d => d.AllowStacking).ToList();
                    foreach (var discount in stackableDiscounts)
                    {
                        var amount = discount.DiscountType == "percentage"
                            ? Math.Round(originalPrice * (discount.DiscountValue / 100m), 2)
                            : Math.Min(discount.DiscountValue, originalPrice);
                        discountAmount += amount;
                    }
                }
                else
                {
                    var bestDiscount = applicableDiscounts.First();
                    discountAmount = bestDiscount.DiscountType == "percentage"
                        ? Math.Round(originalPrice * (bestDiscount.DiscountValue / 100m), 2)
                        : Math.Min(bestDiscount.DiscountValue, originalPrice);
                }
            }

            if (discountAmount > originalPrice)
            {
                discountAmount = originalPrice;
            }

            var finalPrice = originalPrice - discountAmount;
            return (originalPrice, discountAmount, finalPrice);
        }
    }
}
