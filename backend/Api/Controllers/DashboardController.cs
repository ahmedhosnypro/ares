using Backend.Application.DTOs.Dashboard;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Controller for Admin Dashboard analytics and statistics
/// </summary>
[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = "Admin,Supplier")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(
        IDashboardService dashboardService,
        ILogger<DashboardController> logger)
    {
        _dashboardService = dashboardService;
        _logger = logger;
    }

    /// <summary>
    /// Gets dashboard summary statistics based on user role
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Dashboard summary statistics</returns>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(DashboardSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary(CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var userId = Guid.Parse(userIdClaim.Value);

        _logger.LogInformation("Getting dashboard summary for user {UserId}", userId);

        var summary = await _dashboardService.GetSummaryAsync(cancellationToken);

        return Ok(summary);
    }

    /// <summary>
    /// Returns at most one latest real event per category (booking, payment, user, vehicle, verification).
    /// Sorted by most recent first. No fake or mock data — every item comes directly from the database.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of up to 5 recent activity items</returns>
    [HttpGet("recent-summary")]
    [ProducesResponseType(typeof(IReadOnlyList<RecentActivityItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<RecentActivityItemDto>>> GetRecentSummary(CancellationToken cancellationToken = default)
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized(new { Message = "User not authenticated" });
            }

            var userId = Guid.Parse(userIdClaim.Value);
            var isSupplier = User.IsInRole("Supplier");
            var isAdmin = User.IsInRole("Admin");

            Guid? targetSupplierId = isSupplier && !isAdmin ? userId : null;

            _logger.LogInformation("Getting recent activity summary for user {UserId}, targetSupplierId: {TargetSupplierId}", userId, targetSupplierId);

            var items = await _dashboardService.GetRecentSummaryAsync(targetSupplierId, cancellationToken);

            return Ok(items);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = ex.ToString() });
        }
    }

    [HttpGet("recent-bookings")]
    [ProducesResponseType(typeof(IReadOnlyList<RecentBookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<RecentBookingDto>>> GetRecentBookings([FromQuery] int limit = 5, CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized(new { Message = "User not authenticated" });

        var userId = Guid.Parse(userIdClaim.Value);
        var isSupplier = User.IsInRole("Supplier");
        var isAdmin = User.IsInRole("Admin");

        Guid? targetSupplierId = isSupplier && !isAdmin ? userId : null;

        var items = await _dashboardService.GetRecentBookingsAsync(targetSupplierId, limit, cancellationToken);
        return Ok(items);
    }

    [HttpGet("upcoming-bookings")]
    [ProducesResponseType(typeof(IReadOnlyList<UpcomingBookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<UpcomingBookingDto>>> GetUpcomingBookings([FromQuery] int days = 7, CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized(new { Message = "User not authenticated" });

        var userId = Guid.Parse(userIdClaim.Value);
        var isSupplier = User.IsInRole("Supplier");
        var isAdmin = User.IsInRole("Admin");

        Guid? targetSupplierId = isSupplier && !isAdmin ? userId : null;

        var items = await _dashboardService.GetUpcomingBookingsAsync(targetSupplierId, days, cancellationToken);
        return Ok(items);
    }

    [HttpGet("revenue-week")]
    [ProducesResponseType(typeof(IReadOnlyList<RevenueDataPointDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<RevenueDataPointDto>>> GetRevenueWeek(CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized(new { Message = "User not authenticated" });

        var userId = Guid.Parse(userIdClaim.Value);
        var isSupplier = User.IsInRole("Supplier");
        var isAdmin = User.IsInRole("Admin");

        Guid? targetSupplierId = isSupplier && !isAdmin ? userId : null;

        var items = await _dashboardService.GetRevenueWeekAsync(targetSupplierId, cancellationToken);
        return Ok(items);
    }

    [HttpGet("live-tracking")]
    [ProducesResponseType(typeof(LiveTrackingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LiveTrackingDto>> GetLiveTracking(CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized(new { Message = "User not authenticated" });

        var userId = Guid.Parse(userIdClaim.Value);
        var isSupplier = User.IsInRole("Supplier");
        var isAdmin = User.IsInRole("Admin");

        Guid? targetSupplierId = isSupplier && !isAdmin ? userId : null;

        var result = await _dashboardService.GetLiveTrackingAsync(targetSupplierId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("system-status")]
    [ProducesResponseType(typeof(SystemStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<SystemStatusDto>> GetSystemStatus(CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized(new { Message = "User not authenticated" });

        var result = await _dashboardService.GetSystemStatusAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("top-vehicles")]
    [ProducesResponseType(typeof(IReadOnlyList<TopVehicleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<TopVehicleDto>>> GetTopVehicles([FromQuery] int limit = 5, CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized(new { Message = "User not authenticated" });

        var userId = Guid.Parse(userIdClaim.Value);
        var isAdmin = User.IsInRole("Admin");
        var isSupplier = User.IsInRole("Supplier");

        Guid? targetSupplierId = isSupplier && !isAdmin ? userId : null;

        var result = await _dashboardService.GetTopVehiclesAsync(targetSupplierId, limit, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Gets revenue overview for the Admin Dashboard
    /// </summary>
    [HttpGet("revenue-overview")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(RevenueOverviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<RevenueOverviewDto>> GetRevenueOverview([FromQuery] string filter = "ThisMonth", CancellationToken cancellationToken = default)
    {
        var result = await _dashboardService.GetRevenueOverviewAsync(filter, cancellationToken);
        return Ok(result);
    }
}
