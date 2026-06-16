using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
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

            // If the booking is less than a day but has hours, we usually charge 1 day.
            // But we will follow the existing totalDays logic.
            if (totalDays <= 0) totalDays = 1;

            decimal originalPrice = 0m;
            decimal discountAmount = 0m;

            // Fetch active category offer if available
            var offer = vehicle.CategoryId.HasValue
                ? await _context.CategoryOffers
                    .Where(o => o.CategoryId == vehicle.CategoryId.Value && o.IsActive)
                    .OrderByDescending(o => o.CreatedAt)
                    .FirstOrDefaultAsync(cancellationToken)
                : null;

            for (int i = 0; i < totalDays; i++)
            {
                var currentDate = pickupDate.AddDays(i);
                originalPrice += pricePerDay;

                if (offer != null && currentDate >= offer.StartDate && currentDate <= offer.EndDate)
                {
                    var discountForDay = Math.Round(pricePerDay * (offer.DiscountPercentage / 100m), 2);
                    discountAmount += discountForDay;
                }
            }

            var finalPrice = originalPrice - discountAmount;
            return (originalPrice, discountAmount, finalPrice);
        }
    }
}
