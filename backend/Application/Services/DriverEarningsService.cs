using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Earnings;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services
{
    /// <summary>
    /// Service for driver earnings management.
    /// </summary>
    public class DriverEarningsService : IDriverEarningsService
    {
        private static readonly ConcurrentDictionary<Guid, SemaphoreSlim> _payoutLocks = new();

        private readonly IApplicationDbContext _context;

        public DriverEarningsService(IApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets summary statistics for the driver dashboard.
        /// </summary>
        public async Task<DriverEarningsStatsDto> GetStatsAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var thisMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var nextMonthStart = thisMonthStart.AddMonths(1);
            var lastMonthStart = thisMonthStart.AddMonths(-1);

            var query = _context.DriverEarnings
                .AsNoTracking()
                .Where(e => e.DriverProfileId == driverProfileId);

            var totalEarnings = await query.SumAsync(e => e.NetEarning, cancellationToken);

            var thisMonthEarnings = await query
                .Where(e => e.EarnedAt >= thisMonthStart && e.EarnedAt < nextMonthStart)
                .SumAsync(e => e.NetEarning, cancellationToken);

            var lastMonthEarnings = await query
                .Where(e => e.EarnedAt >= lastMonthStart && e.EarnedAt < thisMonthStart)
                .SumAsync(e => e.NetEarning, cancellationToken);

            var availableBalance = await query
                .Where(e => e.Status == DriverEarningStatus.Available)
                .SumAsync(e => e.NetEarning, cancellationToken);

            var pendingPayoutAmount = await query
                .Where(e => e.Status == DriverEarningStatus.PendingPayout)
                .SumAsync(e => e.NetEarning, cancellationToken);

            var completedTripsCount = await query
                .CountAsync(e => e.Status != DriverEarningStatus.Reversed, cancellationToken);

            return new DriverEarningsStatsDto(
                TotalEarnings: totalEarnings,
                ThisMonthEarnings: thisMonthEarnings,
                LastMonthEarnings: lastMonthEarnings,
                AvailableBalance: availableBalance,
                PendingPayoutAmount: pendingPayoutAmount,
                CompletedTripsCount: completedTripsCount
            );
        }

        /// <summary>
        /// Gets monthly earnings data for the chart.
        /// </summary>
        public async Task<IReadOnlyList<DriverMonthlyEarningPointDto>> GetMonthlyChartAsync(Guid driverProfileId, int year, CancellationToken cancellationToken = default)
        {
            var yearStart = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var yearEnd = yearStart.AddYears(1);

            var monthlySums = await _context.DriverEarnings
                .AsNoTracking()
                .Where(e => e.DriverProfileId == driverProfileId
                            && e.EarnedAt >= yearStart
                            && e.EarnedAt < yearEnd
                            && e.Status != DriverEarningStatus.Reversed)
                .GroupBy(e => e.EarnedAt.Month)
                .Select(g => new
                {
                    Month = g.Key,
                    Earnings = g.Sum(e => e.NetEarning),
                })
                .ToListAsync(cancellationToken);

            var sumByMonth = monthlySums.ToDictionary(x => x.Month, x => x.Earnings);

            var points = new List<DriverMonthlyEarningPointDto>(12);
            for (int month = 1; month <= 12; month++)
            {
                sumByMonth.TryGetValue(month, out var earnings);
                points.Add(new DriverMonthlyEarningPointDto(
                    Month: CultureInfo.InvariantCulture.DateTimeFormat.GetAbbreviatedMonthName(month),
                    MonthNumber: month,
                    Year: year,
                    Earnings: earnings
                ));
            }

            return points;
        }

        /// <summary>
        /// Gets top 5 highest-earning bookings.
        /// </summary>
        public async Task<IReadOnlyList<DriverTopBookingDto>> GetTopBookingsAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            var topBookings = await _context.DriverEarnings
                .Where(e => e.DriverProfileId == driverProfileId && e.Status != DriverEarningStatus.Reversed)
                .OrderByDescending(e => e.NetEarning)
                .Take(5)
                .Select(e => new DriverTopBookingDto(
                    BookingId: e.BookingId,
                    BookingNumber: e.Booking.BookingNumber,
                    VehicleName: e.Booking.Vehicle.Name,
                    CustomerName: e.Booking.User.FullName,
                    NetEarning: e.NetEarning,
                    CompletedAt: e.EarnedAt
                ))
                .ToListAsync(cancellationToken);

            return topBookings;
        }

        /// <summary>
        /// Gets paginated earnings history.
        /// </summary>
        public async Task<IReadOnlyList<DriverEarningRowDto>> GetEarningsHistoryAsync(Guid driverProfileId, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
        {
            var earnings = await _context.DriverEarnings
                .Where(e => e.DriverProfileId == driverProfileId)
                .OrderByDescending(e => e.EarnedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new DriverEarningRowDto(
                    BookingId: e.BookingId,
                    BookingNumber: e.Booking.BookingNumber,
                    CompletedAt: e.EarnedAt,
                    GrossEarning: e.GrossEarning,
                    PlatformDeduction: e.PlatformDeduction,
                    NetEarning: e.NetEarning,
                    Status: e.Status
                ))
                .ToListAsync(cancellationToken);

            return earnings;
        }

        /// <summary>
        /// Gets total number of earnings entries for pagination.
        /// </summary>
        public async Task<int> GetEarningsCountAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            return await _context.DriverEarnings
                .Where(e => e.DriverProfileId == driverProfileId)
                .CountAsync(cancellationToken);
        }

        /// <summary>
        /// Requests a payout of available balance.
        /// </summary>
        public async Task<DriverPayoutDto> RequestPayoutAsync(Guid driverProfileId, DriverPayoutRequestDto request, CancellationToken cancellationToken = default)
        {
            if (request.Amount <= 0)
                throw new InvalidOperationException("Payout amount must be positive.");

            var semaphore = _payoutLocks.GetOrAdd(driverProfileId, _ => new SemaphoreSlim(1, 1));
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                var driver = await _context.DriverProfiles
                    .Include(d => d.PaymentInfo)
                    .FirstOrDefaultAsync(d => d.Id == driverProfileId, cancellationToken);

                if (driver == null)
                {
                    throw new InvalidOperationException("Driver profile not found.");
                }

                if (driver.PaymentInfo == null || !driver.PaymentInfo.IsVerified)
                {
                    throw new InvalidOperationException("Payout information is not verified.");
                }

                var availableEarnings = await _context.DriverEarnings
                    .Where(e => e.DriverProfileId == driverProfileId && e.Status == DriverEarningStatus.Available)
                    .ToListAsync(cancellationToken);

                var availableBalance = availableEarnings.Sum(e => e.NetEarning);
                if (request.Amount > availableBalance)
                {
                    throw new InvalidOperationException("Requested amount exceeds available balance.");
                }

                if (request.Amount < await GetMinPayoutAmountAsync(cancellationToken))
                {
                    throw new InvalidOperationException("Requested amount is below the minimum payout threshold.");
                }

                using var transaction = await _context.BeginTransactionAsync(cancellationToken);

                var payout = new DriverPayout
                {
                    DriverProfileId = driverProfileId,
                    Amount = request.Amount,
                    Status = DriverPayoutStatus.Requested,
                    RequestedAt = DateTime.UtcNow
                };

                await _context.DriverPayouts.AddAsync(payout, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                decimal remainingAmount = request.Amount;
                foreach (var earning in availableEarnings.OrderBy(e => e.EarnedAt))
                {
                    if (remainingAmount <= 0) break;

                    var amountToDeduct = Math.Min(earning.NetEarning, remainingAmount);
                    earning.Status = DriverEarningStatus.PendingPayout;
                    earning.PayoutId = payout.Id;
                    
                    await _context.DriverPayoutTransactions.AddAsync(new DriverPayoutTransaction
                    {
                        DriverPayoutId = payout.Id,
                        DriverEarningId = earning.Id,
                        Amount = amountToDeduct,
                        CreatedAt = DateTime.UtcNow
                    }, cancellationToken);

                    remainingAmount -= amountToDeduct;
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return new DriverPayoutDto(
                    Id: payout.Id,
                    RequestedAt: payout.RequestedAt,
                    Amount: payout.Amount,
                    Status: payout.Status,
                    ReviewedAt: payout.ReviewedAt,
                    RejectionReason: payout.RejectionReason,
                    PaymobTransactionId: payout.PaymobTransactionId,
                    CompletedAt: payout.ProcessedAt
                );
            }
            finally
            {
                semaphore.Release();
            }
        }

        /// <summary>
        /// Gets payout history for the driver.
        /// </summary>
        public async Task<IReadOnlyList<DriverPayoutDto>> GetPayoutHistoryAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            var payouts = await _context.DriverPayouts
                .Where(p => p.DriverProfileId == driverProfileId)
                .OrderByDescending(p => p.RequestedAt)
                .Select(p => new DriverPayoutDto(
                    Id: p.Id,
                    RequestedAt: p.RequestedAt,
                    Amount: p.Amount,
                    Status: p.Status,
                    ReviewedAt: p.ReviewedAt,
                    RejectionReason: p.RejectionReason,
                    PaymobTransactionId: p.PaymobTransactionId,
                    CompletedAt: p.ProcessedAt
                ))
                .ToListAsync(cancellationToken);

            return payouts;
        }

        /// <summary>
        /// Creates an earning record for a completed booking.
        /// </summary>
        public async Task<DriverEarning> CreateEarningForBookingAsync(Booking booking, CancellationToken cancellationToken = default)
        {
            if (booking.AssignedDriverProfileId == null)
            {
                throw new InvalidOperationException("Booking has no assigned driver.");
            }

            var existing = await _context.DriverEarnings
                .FirstOrDefaultAsync(e => e.BookingId == booking.Id, cancellationToken);

            if (existing != null)
                return existing;

            var driverFee = booking.DriverFee ?? 0m;
            var driverCommissionPercentage = await GetDriverCommissionPercentageAsync(cancellationToken);
            var platformDeduction = driverFee * driverCommissionPercentage / 100;
            var netEarning = driverFee - platformDeduction;

            var earning = new DriverEarning
            {
                BookingId = booking.Id,
                DriverProfileId = booking.AssignedDriverProfileId.Value,
                GrossEarning = booking.DriverFee ?? 0,
                PlatformDeduction = platformDeduction,
                NetEarning = netEarning,
                Status = DriverEarningStatus.Available,
                EarnedAt = DateTime.UtcNow
            };

            await _context.DriverEarnings.AddAsync(earning, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return earning;
        }

        /// <summary>
        /// Reverses an earning if the booking is cancelled/refunded.
        /// </summary>
        public async Task ReverseEarningForBookingAsync(Guid bookingId, CancellationToken cancellationToken = default)
        {
            var earning = await _context.DriverEarnings
                .FirstOrDefaultAsync(e => e.BookingId == bookingId, cancellationToken);

            if (earning == null || earning.Status == DriverEarningStatus.Reversed)
                return;

            if (earning.Status == DriverEarningStatus.Paid)
                return;

            if (earning.Status == DriverEarningStatus.PendingPayout && earning.PayoutId.HasValue)
            {
                var payout = await _context.DriverPayouts
                    .FirstOrDefaultAsync(p => p.Id == earning.PayoutId.Value, cancellationToken);

                if (payout != null && payout.Status != DriverPayoutStatus.Failed && payout.Status != DriverPayoutStatus.Rejected)
                {
                    payout.Status = DriverPayoutStatus.Failed;
                    payout.FailureReason = "Booking was cancelled while payout was pending.";
                }
            }

            earning.Status = DriverEarningStatus.Reversed;
            earning.ReversedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        private async Task<decimal> GetDriverCommissionPercentageAsync(CancellationToken cancellationToken)
        {
            var setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.Key == "driver.commission_percentage", cancellationToken);

            return setting != null ? decimal.Parse(setting.Value) : 0;
        }

        private async Task<decimal> GetMinPayoutAmountAsync(CancellationToken cancellationToken)
        {
            var setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.Key == "driver.min_payout_amount", cancellationToken);

            return setting != null ? decimal.Parse(setting.Value) : 50;
        }
    }
}