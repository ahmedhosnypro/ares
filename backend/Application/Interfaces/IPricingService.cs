using System;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Application.Interfaces
{
    public interface IPricingService
    {
        /// <summary>
        /// Calculates the pricing for a booking, breaking down the cost per day and applying any active category offers.
        /// </summary>
        /// <param name="vehicleId">The vehicle ID.</param>
        /// <param name="pickupDate">The pickup date.</param>
        /// <param name="returnDate">The return date.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>A tuple with OriginalPrice, DiscountAmount, and FinalPrice.</returns>
        Task<(decimal OriginalPrice, decimal DiscountAmount, decimal FinalPrice)> CalculateBookingPricingAsync(
            Guid vehicleId,
            DateTime pickupDate,
            DateTime returnDate,
            CancellationToken cancellationToken = default);
    }
}
