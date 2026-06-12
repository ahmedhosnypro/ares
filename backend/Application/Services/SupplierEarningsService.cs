using System.Globalization;
using Backend.Application.DTOs.Earnings;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services;

/// <summary>
/// Default implementation of <see cref="ISupplierEarningsService"/>.
///
/// Design notes (mirrors <see cref="SupplierDashboardService"/> style):
///   * Every query is <c>AsNoTracking</c> and emits a single aggregate
///     (Count / Sum / GroupBy) instead of materialising entities. This
///     keeps the analytics endpoints cheap even for suppliers with large
///     booking histories.
///   * Ownership is enforced directly in the SQL <c>WHERE</c> clause
///     (<c>b.Vehicle.UserId == supplierId</c>) so a forged supplier id
///     simply yields zero rows.
///   * Only <see cref="BookingStatus.Completed"/> bookings contribute to
///     any figure on this service — pending, confirmed, active and
///     cancelled bookings are excluded by design.
///   * The "revenue date" for monthly grouping is the booking's
///     <c>ReturnDate</c> (the rental's natural revenue-recognition
///     moment), with a defensive fallback to <c>CreatedAt</c> when
///     <c>ReturnDate</c> is null. This keeps the chart and the stats
///     consistent: this-month / last-month bucket the same way as the
///     monthly chart's points.
/// </summary>
public class SupplierEarningsService : ISupplierEarningsService
{
    /// <summary>How many vehicles the "top performing" leaderboard returns.</summary>
    public const int TopVehiclesLimit = 5;

    /// <summary>
    /// Payment status that indicates the booking's money was returned to
    /// the customer. Stored as a string on <see cref="BookingPayment"/>
    /// (see entity comment for the full enum). We treat any payment row
    /// in this status as a disqualifier for earnings — a refunded booking
    /// must not contribute to any total, chart point, or leaderboard
    /// entry on this page.
    /// </summary>
    private const string RefundedPaymentStatus = "Refunded";

    private readonly IApplicationDbContext _context;
    private readonly ILogger<SupplierEarningsService> _logger;

    public SupplierEarningsService(
        IApplicationDbContext context,
        ILogger<SupplierEarningsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<SupplierEarningsStatsDto> GetStatsAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Computing supplier earnings stats for {SupplierId}", supplierId);

        // Bucket boundaries (UTC, half-open [start, end)) so a booking that
        // recognises revenue exactly at midnight on the first of the month
        // always falls into the *new* month.
        var now = DateTime.UtcNow;
        var thisMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextMonthStart = thisMonthStart.AddMonths(1);
        var lastMonthStart = thisMonthStart.AddMonths(-1);

        // Base query: completed *and not refunded* bookings on vehicles
        // owned by this supplier. Reused as the starting point for all
        // four aggregates below — keeps ownership + status + refund
        // filtering in one place.
        var completedQuery = EarningsEligibleBookings(supplierId);

        // Null-coalesce in the selector so SUM never returns NULL.
        var totalEarnings = await completedQuery
            .SumAsync(b => b.SupplierAmount ?? b.TotalPrice ?? 0m, cancellationToken);

        // ── Completed bookings count (lifetime) ──────────────────────────
        var completedBookingsCount = await completedQuery.CountAsync(cancellationToken);

        // ── This-month revenue ───────────────────────────────────────────
        // RevenueDate = ReturnDate ?? CreatedAt. EF Core translates the
        // null-coalesce to COALESCE in SQL.
        var thisMonthRevenue = await completedQuery
            .Where(b => (b.ReturnDate ?? b.CreatedAt) >= thisMonthStart
                        && (b.ReturnDate ?? b.CreatedAt) < nextMonthStart)
            .SumAsync(b => b.SupplierAmount ?? b.TotalPrice ?? 0m, cancellationToken);

        // ── Last-month revenue ───────────────────────────────────────────
        var lastMonthRevenue = await completedQuery
            .Where(b => (b.ReturnDate ?? b.CreatedAt) >= lastMonthStart
                        && (b.ReturnDate ?? b.CreatedAt) < thisMonthStart)
            .SumAsync(b => b.SupplierAmount ?? b.TotalPrice ?? 0m, cancellationToken);

        return new SupplierEarningsStatsDto(
            TotalEarnings: totalEarnings,
            ThisMonthRevenue: thisMonthRevenue,
            LastMonthRevenue: lastMonthRevenue,
            CompletedBookingsCount: completedBookingsCount
        );
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<MonthlyRevenuePointDto>> GetMonthlyChartAsync(
        Guid supplierId,
        int? year = null,
        CancellationToken cancellationToken = default)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        var yearStart = new DateTime(targetYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var yearEnd = yearStart.AddYears(1);

        _logger.LogInformation(
            "Building supplier earnings chart for {SupplierId} (year {Year})",
            supplierId, targetYear);

        // Single aggregate query: bucket earnings-eligible bookings by
        // month and sum their TotalPrice. We do the grouping in SQL so we
        // never pull individual booking rows back to the application.
        var monthlySums = await EarningsEligibleBookings(supplierId)
            .Where(b => (b.ReturnDate ?? b.CreatedAt) >= yearStart
                        && (b.ReturnDate ?? b.CreatedAt) < yearEnd)
            .GroupBy(b => (b.ReturnDate ?? b.CreatedAt).Month)
            .Select(g => new
            {
                Month = g.Key,
                Revenue = g.Sum(b => b.SupplierAmount ?? b.TotalPrice ?? 0m),
            })
            .ToListAsync(cancellationToken);

        // Build the dictionary in memory so we can fill in missing months
        // with zero — frontend bar charts render best with a stable axis.
        var sumByMonth = monthlySums.ToDictionary(x => x.Month, x => x.Revenue);

        var points = new List<MonthlyRevenuePointDto>(12);
        for (int month = 1; month <= 12; month++)
        {
            sumByMonth.TryGetValue(month, out var revenue);
            points.Add(new MonthlyRevenuePointDto(
                Month: CultureInfo.InvariantCulture.DateTimeFormat.GetAbbreviatedMonthName(month),
                MonthNumber: month,
                Year: targetYear,
                Revenue: revenue
            ));
        }

        return points;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<SupplierTopVehicleDto>> GetTopVehiclesAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Building supplier top vehicles for {SupplierId}", supplierId);

        // Step 1: aggregate earnings-eligible booking earnings per vehicle
        // in a single GroupBy query, ordered by revenue desc and capped at
        // the top N. Ownership + status + refund filters are all baked
        // into EarningsEligibleBookings(), so this query stays simple.
        var aggregates = await EarningsEligibleBookings(supplierId)
            .GroupBy(b => b.VehicleId)
            .Select(g => new
            {
                VehicleId = g.Key,
                TotalEarnings = g.Sum(b => b.SupplierAmount ?? b.TotalPrice ?? 0m),
                CompletedBookingsCount = g.Count(),
            })
            .OrderByDescending(x => x.TotalEarnings)
            .Take(TopVehiclesLimit)
            .ToListAsync(cancellationToken);

        if (aggregates.Count == 0)
        {
            return new List<SupplierTopVehicleDto>().AsReadOnly();
        }

        // Step 2: pull only the columns we need for the top N vehicles in
        // one round-trip. We re-assert ownership here so even if step 1's
        // grouping behaviour ever changes, this query can't surface a
        // vehicle that doesn't belong to the supplier.
        var topIds = aggregates.Select(a => a.VehicleId).ToList();
        var vehicleInfos = await _context.Vehicles
            .AsNoTracking()
            .Where(v => topIds.Contains(v.Id) && v.UserId == supplierId)
            .Select(v => new
            {
                v.Id,
                v.Make,
                v.Model,
                PrimaryImage = v.Images
                    .Where(i => i.IsPrimary)
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault()
                    ?? v.Images
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault(),
            })
            .ToDictionaryAsync(v => v.Id, cancellationToken);

        // Step 3: stitch the two together preserving the descending-revenue
        // ordering from step 1.
        var results = aggregates
            .Select(a =>
            {
                vehicleInfos.TryGetValue(a.VehicleId, out var info);
                return new SupplierTopVehicleDto(
                    VehicleId: a.VehicleId,
                    Make: info?.Make ?? string.Empty,
                    Model: info?.Model ?? string.Empty,
                    ImageUrl: info?.PrimaryImage ?? string.Empty,
                    TotalEarnings: a.TotalEarnings,
                    CompletedBookingsCount: a.CompletedBookingsCount
                );
            })
            .ToList();

        return results.AsReadOnly();
    }

    /// <summary>
    /// Returns the base IQueryable of "earnings-eligible" bookings for
    /// the given supplier:
    /// <list type="bullet">
    ///   <item><c>Vehicle.UserId == supplierId</c> (ownership scope).</item>
    ///   <item><c>Status == Completed</c> (no pending / cancelled / in-flight bookings).</item>
    ///   <item>No <see cref="BookingPayment"/> row in <see cref="RefundedPaymentStatus"/>
    ///         for the booking (a refunded booking must not contribute to earnings).</item>
    /// </list>
    /// <para>
    /// Centralising the filter here keeps the three aggregate methods
    /// consistent — every figure on the earnings page (totals, monthly
    /// chart, top vehicles) honours the same business rules without
    /// duplication.
    /// </para>
    /// <para>
    /// The <c>Any()</c> sub-query translates to a SQL <c>NOT EXISTS</c>
    /// in EF Core, so it composes cleanly with downstream <c>SUM</c> /
    /// <c>GROUP BY</c> operators and stays cheap even at scale.
    /// </para>
    /// </summary>
    private IQueryable<Booking> EarningsEligibleBookings(Guid supplierId)
    {
        return _context.Bookings
            .AsNoTracking()
            .Where(b => b.Vehicle != null
                        && b.Vehicle.UserId == supplierId
                        && b.Status == BookingStatus.Completed
                        && !_context.Payments.Any(p =>
                            p.BookingId == b.Id
                            && p.Status == RefundedPaymentStatus));
    }
}
