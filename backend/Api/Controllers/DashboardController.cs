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
        var isSupplier = User.IsInRole("Supplier");
        var isAdmin = User.IsInRole("Admin");

        // If the user is an Admin, they see system-wide stats (supplierId = null)
        // If the user is just a Supplier, they see their own stats (supplierId = userId)
        Guid? targetSupplierId = isSupplier && !isAdmin ? userId : null;

        _logger.LogInformation("Getting dashboard summary for user {UserId}, targetSupplierId: {TargetSupplierId}", userId, targetSupplierId);

        var summary = await _dashboardService.GetSummaryAsync(targetSupplierId, cancellationToken);

        return Ok(summary);
    }
}
