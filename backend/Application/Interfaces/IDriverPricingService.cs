using System;
using System.Threading;
using System.Threading.Tasks;
using Backend.Domain.Entities;

namespace Backend.Application.Interfaces
{
    public interface IDriverPricingService
    {
        Task<decimal> GetDailyRateAsync(CancellationToken cancellationToken = default);
        Task SetDailyRateAsync(decimal rate, CancellationToken cancellationToken = default);
        Task CalculateBookingDriverFeesAsync(Booking booking, int totalDays, CancellationToken cancellationToken = default);
    }
}
