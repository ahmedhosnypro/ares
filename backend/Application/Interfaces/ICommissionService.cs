using System;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Application.Interfaces
{
    public interface ICommissionService
    {
        /// <summary>
        /// Gets the effective commission percentage for a specific vehicle.
        /// It checks if the vehicle's category has an active commission override.
        /// Otherwise, it falls back to the Global Commission setting.
        /// </summary>
        Task<decimal> GetEffectiveCommissionAsync(Guid vehicleId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Calculates the commission amount and supplier amount from the total price.
        /// </summary>
        (decimal CommissionAmount, decimal SupplierAmount) CalculateCommission(decimal totalPrice, decimal commissionPercentage);
    }
}
