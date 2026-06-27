using System.Security.Claims;
using Backend.Application.DTOs.Dashboard;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Read-only analytics endpoints for the supplier-facing dashboard.
///
/// Locked down to the <c>Supplier</c> role so admins reading the same
/// numbers must continue to use <see cref="DashboardController"/> — that
/// keeps the existing admin contract untouched and avoids accidental
/// supplier-id spoofing from the frontend.
/// </summary>
[ApiController]
[Route("api/supplier/dashboard")]
[Authorize(Roles = "Supplier")]
public class SupplierDashboardController : ControllerBase
{
    private readonly ISupplierDashboardService _supplierDashboardService;
    private readonly ILogger<SupplierDashboardController> _logger;

    public SupplierDashboardController(
        ISupplierDashboardService supplierDashboardService,
        ILogger<SupplierDashboardController> logger)
    {
        _supplierDashboardService = supplierDashboardService;
        _logger = logger;
    }

    /// <summary>
    /// Returns the headline stats for the authenticated supplier.
    /// All counts are scoped to vehicles where <c>UserId</c> matches
    /// the caller — suppliers cannot see another supplier's numbers.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>
    /// <see cref="SupplierDashboardStatsDto"/> with totalVehicles,
    /// pendingVehicles, activeBookings and totalEarnings.
    /// </returns>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(SupplierDashboardStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<SupplierDashboardStatsDto>> GetStats(CancellationToken cancellationToken = default)
    {
        // The [Authorize(Roles="Supplier")] attribute already rejects
        // anonymous and non-supplier callers; the manual claim check below
        // is just to convert the user id into a Guid we can pass downstream.
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out var supplierId))
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        _logger.LogInformation("Fetching supplier dashboard stats for supplier {SupplierId}", supplierId);

        var stats = await _supplierDashboardService.GetStatsAsync(supplierId, cancellationToken);
        return Ok(stats);
    }

    /// <summary>
    /// Returns booking counts grouped by business-friendly categories for the
    /// authenticated supplier. All counts are scoped to vehicles where
    /// <c>UserId</c> matches the caller.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>
    /// <see cref="BookingsByStatusDto"/> with counts for pending, confirmed,
    /// active, completed, and cancelled bookings.
    /// </returns>
    [HttpGet("bookings-by-status")]
    [ProducesResponseType(typeof(BookingsByStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<BookingsByStatusDto>> GetBookingsByStatus(CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out var supplierId))
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        _logger.LogInformation("Fetching supplier dashboard bookings by status for supplier {SupplierId}", supplierId);

        var counts = await _supplierDashboardService.GetBookingsByStatusAsync(supplierId, cancellationToken);
        return Ok(counts);
    }

    /// <summary>
    /// Returns vehicle counts grouped by status for the
    /// authenticated supplier. All counts are scoped to vehicles where
    /// <c>UserId</c> matches the caller.
    /// </summary>
    [HttpGet("vehicle-status-distribution")]
    [ProducesResponseType(typeof(Dictionary<string, int>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Dictionary<string, int>>> GetVehicleStatusDistribution(CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out var supplierId))
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        _logger.LogInformation("Fetching supplier dashboard vehicle status distribution for supplier {SupplierId}", supplierId);

        var counts = await _supplierDashboardService.GetVehicleStatusDistributionAsync(supplierId, cancellationToken);
        return Ok(counts);
    }
}
