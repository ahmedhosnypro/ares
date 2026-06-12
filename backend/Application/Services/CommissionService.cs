using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services
{
    public class CommissionService : ICommissionService
    {
        private readonly IApplicationDbContext _context;
        private readonly ILogger<CommissionService> _logger;

        public const decimal DefaultGlobalCommission = 10.0m;
        public const string GlobalCommissionSettingKey = "GlobalCommissionPercentage";

        public CommissionService(IApplicationDbContext context, ILogger<CommissionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<decimal> GetEffectiveCommissionAsync(Guid vehicleId, CancellationToken cancellationToken = default)
        {
            var vehicle = await _context.Vehicles
                .Include(v => v.Category)
                .FirstOrDefaultAsync(v => v.Id == vehicleId, cancellationToken);

            if (vehicle?.Category != null && vehicle.Category.IsActive)
            {
                _logger.LogInformation("Using category commission {Percentage}% for Vehicle {VehicleId}", 
                    vehicle.Category.CommissionPercentage, vehicleId);
                return vehicle.Category.CommissionPercentage;
            }

            var globalSetting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.Key == GlobalCommissionSettingKey, cancellationToken);

            if (globalSetting != null && decimal.TryParse(globalSetting.Value, out var globalCommission))
            {
                return globalCommission;
            }

            _logger.LogInformation("No category override or global setting found. Using default commission {Percentage}% for Vehicle {VehicleId}", 
                DefaultGlobalCommission, vehicleId);
            return DefaultGlobalCommission;
        }

        public (decimal CommissionAmount, decimal SupplierAmount) CalculateCommission(decimal totalPrice, decimal commissionPercentage)
        {
            if (commissionPercentage < 0 || commissionPercentage > 100)
            {
                throw new ArgumentOutOfRangeException(nameof(commissionPercentage), "Commission percentage must be between 0 and 100.");
            }

            var commissionAmount = totalPrice * (commissionPercentage / 100m);
            // Round to 2 decimal places to match database schema
            commissionAmount = Math.Round(commissionAmount, 2);
            var supplierAmount = totalPrice - commissionAmount;

            return (commissionAmount, supplierAmount);
        }
    }
}
