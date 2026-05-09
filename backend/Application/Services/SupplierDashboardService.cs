using Backend.Application.DTOs.Dashboard;
using Backend.Application.Interfaces;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services;

/// <summary>
/// Default implementation of <see cref="ISupplierDashboardService"/>.
///
/// The four queries below are intentionally narrow — each one issues a
/// single aggregate query (Count / Sum) against the database with no
/// projections or eager-loaded navigations, so the dashboard call stays
/// cheap even for suppliers with large fleets and booking histories.
/// </summary>
public class SupplierDashboardService : ISupplierDashboardService
{
    private const string PendingVehicleStatus = "Pending";

    private readonly IApplicationDbContext _context;
    private readonly ILogger<SupplierDashboardService> _logger;

    public SupplierDashboardService(
        IApplicationDbContext context,
        ILogger<SupplierDashboardService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<SupplierDashboardStatsDto> GetStatsAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Computing supplier dashboard stats for {SupplierId}", supplierId);

        // ── 1. Total vehicles owned by this supplier ─────────────────────────
        // Match the rest of the codebase: only count "live" vehicles
        // (IsActive == true filters out soft-deleted rows).
        var totalVehicles = await _context.Vehicles
            .AsNoTracking()
            .Where(v => v.UserId == supplierId && v.IsActive)
            .CountAsync(cancellationToken);

        // ── 2. Pending vehicles (awaiting admin approval) ────────────────────
        // Status is a free-form string field in the schema; compare
        // case-insensitively so "pending" / "Pending" both work.
        var pendingVehicles = await _context.Vehicles
            .AsNoTracking()
            .Where(v => v.UserId == supplierId
                        && v.IsActive
                        && v.Status != null
                        && v.Status.ToLower() == PendingVehicleStatus.ToLower())
            .CountAsync(cancellationToken);

        // ── 3. Active bookings on this supplier's vehicles ───────────────────
        // "Active bookings" = bookings that are currently in flight from the
        // supplier's perspective. We treat both Active (vehicle picked up)
        // and Confirmed (paid, awaiting pickup) as active so suppliers see
        // every booking that still requires their attention. Cancelled,
        // Completed and Pending bookings are deliberately excluded.
        var activeBookings = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.Vehicle != null
                        && b.Vehicle.UserId == supplierId
                        && (b.Status == BookingStatus.Active
                            || b.Status == BookingStatus.Confirmed))
            .CountAsync(cancellationToken);

        // ── 4. Total earnings = sum of TotalPrice on Completed bookings only ─
        // Cancelled and Pending bookings are excluded per spec. We use the
        // null-coalesce on the SQL side via `?? 0m` so a single SUM is
        // returned even when no rows match.
        var totalEarnings = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.Vehicle != null
                        && b.Vehicle.UserId == supplierId
                        && b.Status == BookingStatus.Completed)
            .SumAsync(b => b.TotalPrice ?? 0m, cancellationToken);

        return new SupplierDashboardStatsDto(
            TotalVehicles: totalVehicles,
            PendingVehicles: pendingVehicles,
            ActiveBookings: activeBookings,
            TotalEarnings: totalEarnings
        );
    }
}
