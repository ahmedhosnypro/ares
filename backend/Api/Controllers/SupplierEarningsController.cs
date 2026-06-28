using System.Security.Claims;
using Backend.Application.DTOs.Earnings;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Earnings analytics endpoints for the Supplier portal.
///
/// Every endpoint:
///   * Requires authentication.
///   * Is gated to the <c>Supplier</c> role via <see cref="AuthorizeAttribute"/>.
///   * Restricts its underlying query by the authenticated supplier id —
///     suppliers cannot see another supplier's financial data.
///
/// All figures returned by this controller are derived from
/// <c>Completed</c> bookings only. The existing admin dashboard and
/// supplier dashboard endpoints (<see cref="DashboardController"/>,
/// <see cref="SupplierDashboardController"/>) are intentionally left
/// untouched.
/// </summary>
[ApiController]
[Route("api/supplier/earnings")]
[Authorize(Roles = "Supplier")]
public class SupplierEarningsController : ControllerBase
{
    private readonly ISupplierEarningsService _earningsService;
    private readonly ILogger<SupplierEarningsController> _logger;

    public SupplierEarningsController(
        ISupplierEarningsService earningsService,
        ILogger<SupplierEarningsController> logger)
    {
        _earningsService = earningsService;
        _logger = logger;
    }

    /// <summary>
    /// Returns the four headline earnings figures for the authenticated
    /// supplier: total earnings, this-month revenue, last-month revenue
    /// and completed bookings count.
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(SupplierEarningsStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<SupplierEarningsStatsDto>> GetStats(
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var stats = await _earningsService.GetStatsAsync(supplierId, cancellationToken);

        _logger.LogInformation(
            "Supplier {SupplierId} fetched earnings stats (total: {Total}, thisMonth: {ThisMonth})",
            supplierId, stats.TotalEarnings, stats.ThisMonthRevenue);

        return Ok(stats);
    }

    /// <summary>
    /// Returns 12 monthly revenue data points (Jan..Dec) for the
    /// authenticated supplier, suitable for direct rendering in a bar
    /// chart. Months without completed bookings are returned with
    /// <c>revenue = 0</c> so the chart always has a stable axis.
    /// </summary>
    /// <param name="year">Optional calendar year (defaults to the current UTC year).</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("chart")]
    [ProducesResponseType(typeof(IReadOnlyList<MonthlyRevenuePointDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<MonthlyRevenuePointDto>>> GetChart(
        [FromQuery] int? year = null,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var points = await _earningsService.GetMonthlyChartAsync(supplierId, year, cancellationToken);

        _logger.LogInformation(
            "Supplier {SupplierId} fetched earnings chart for year {Year} ({Count} points)",
            supplierId, year ?? DateTime.UtcNow.Year, points.Count);

        return Ok(points);
    }

    /// <summary>
    /// Returns the top 5 vehicles owned by the supplier, ranked by
    /// lifetime completed-booking earnings.
    /// </summary>
    [HttpGet("top-vehicles")]
    [ProducesResponseType(typeof(IReadOnlyList<SupplierTopVehicleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<SupplierTopVehicleDto>>> GetTopVehicles(
        [FromQuery] string sortBy = "earnings",
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var top = await _earningsService.GetTopVehiclesAsync(supplierId, sortBy, cancellationToken);

        _logger.LogInformation(
            "Supplier {SupplierId} fetched top vehicles ({Count} returned)",
            supplierId, top.Count);

        return Ok(top);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Resolves the authenticated supplier id from the JWT claim. Defensive
    /// — the <c>[Authorize]</c> attribute already rejects anonymous and
    /// non-supplier callers, but a malformed claim should still produce a
    /// clean 401 instead of a 500.
    /// </summary>
    private bool TryGetSupplierId(out Guid supplierId, out ActionResult? unauthorized)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out supplierId))
        {
            unauthorized = Unauthorized(new { Message = "User not authenticated" });
            supplierId = Guid.Empty;
            return false;
        }

        unauthorized = null;
        return true;
    }
}
