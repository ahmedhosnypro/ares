using System;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace Backend.Application.Services
{
    public class DriverPricingService : IDriverPricingService
    {
        private readonly IApplicationDbContext _context;

        public DriverPricingService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<decimal> GetDailyRateAsync(CancellationToken cancellationToken = default)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "driver.daily_rate", cancellationToken);
            if (setting != null && decimal.TryParse(setting.Value, out var rate))
            {
                return rate;
            }
            return 25.00m; // Default rate
        }

        public async Task SetDailyRateAsync(decimal rate, CancellationToken cancellationToken = default)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "driver.daily_rate", cancellationToken);
            if (setting == null)
            {
                setting = new SystemSetting { Key = "driver.daily_rate", Value = rate.ToString("F2") };
                _context.AddSystemSetting(setting);
            }
            else
            {
                setting.Value = rate.ToString("F2");
            }
            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task CalculateBookingDriverFeesAsync(Booking booking, int totalDays, CancellationToken cancellationToken = default)
        {
            if (booking.RequiresDriver)
            {
                var dailyRate = await GetDailyRateAsync(cancellationToken);
                booking.DriverFee = dailyRate * totalDays;
                
                // Assuming Vehicle.PricePerDay logic is handled elsewhere, we compute GrandTotal based on existing properties
                if (booking.Vehicle != null)
                {
                    booking.VehicleFee = booking.Vehicle.PricePerDay * totalDays;
                }
                
                booking.GrandTotal = (booking.VehicleFee ?? 0) + booking.DriverFee;
                booking.TotalPrice = booking.GrandTotal; // Retro-compatibility
            }
        }
    }
}
