using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Repositories
{
    /// <summary>
    /// Repository for driver payout operations.
    /// </summary>
    public class DriverPayoutRepository : IDriverPayoutRepository
    {
        private readonly IApplicationDbContext _context;

        public DriverPayoutRepository(IApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets a payout by ID.
        /// </summary>
        public async Task<DriverPayout> GetPayoutByIdAsync(Guid payoutId, CancellationToken cancellationToken = default)
        {
            return await _context.DriverPayouts
                .FirstOrDefaultAsync(p => p.Id == payoutId, cancellationToken)
                ?? throw new InvalidOperationException("Payout not found.");
        }

        /// <summary>
        /// Gets all payouts for a driver.
        /// </summary>
        public async Task<IReadOnlyList<DriverPayout>> GetPayoutsByDriverAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            return await _context.DriverPayouts
                .Where(p => p.DriverProfileId == driverProfileId)
                .ToListAsync(cancellationToken);
        }

        /// <summary>
        /// Updates payout status.
        /// </summary>
        public async Task UpdatePayoutStatusAsync(Guid payoutId, DriverPayoutStatus status, string? rejectionReason = null, Guid? reviewedBy = null, CancellationToken cancellationToken = default)
        {
            var payout = await GetPayoutByIdAsync(payoutId, cancellationToken);
            payout.Status = status;
            payout.ReviewedAt = DateTime.UtcNow;
            payout.ReviewedBy = reviewedBy;
            payout.RejectionReason = rejectionReason;
            await _context.SaveChangesAsync(cancellationToken);
        }

        /// <summary>
        /// Marks a payout as completed with Paymob references.
        /// </summary>
        public async Task CompletePayoutAsync(Guid payoutId, string paymobTransactionId, long paymobPayoutId, CancellationToken cancellationToken = default)
        {
            var payout = await GetPayoutByIdAsync(payoutId, cancellationToken);
            payout.Status = DriverPayoutStatus.Completed;
            payout.ProcessedAt = DateTime.UtcNow;
            payout.PaymobTransactionId = paymobTransactionId;
            payout.PaymobPayoutId = paymobPayoutId;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}