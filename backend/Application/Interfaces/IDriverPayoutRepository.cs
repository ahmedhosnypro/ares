using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;

namespace Backend.Application.Interfaces
{
    /// <summary>
    /// Repository for driver payout operations.
    /// </summary>
    public interface IDriverPayoutRepository
    {
        /// <summary>
        /// Gets a payout by ID.
        /// </summary>
        Task<DriverPayout> GetPayoutByIdAsync(Guid payoutId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets all payouts for a driver.
        /// </summary>
        Task<IReadOnlyList<DriverPayout>> GetPayoutsByDriverAsync(Guid driverProfileId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Updates payout status.
        /// </summary>
        Task UpdatePayoutStatusAsync(Guid payoutId, DriverPayoutStatus status, string? rejectionReason = null, Guid? reviewedBy = null, CancellationToken cancellationToken = default);

        /// <summary>
        /// Marks a payout as completed with Paymob references.
        /// </summary>
        Task CompletePayoutAsync(Guid payoutId, string paymobTransactionId, long paymobPayoutId, CancellationToken cancellationToken = default);
    }
}