using Backend.Application.DTOs.Earnings;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/admin/driver-earnings")]
[Authorize(Roles = "Admin")]
public class AdminDriverEarningsController : ControllerBase
{
    private readonly IDriverEarningsAdminService _service;
    private readonly ILogger<AdminDriverEarningsController> _logger;

    public AdminDriverEarningsController(
        IDriverEarningsAdminService service,
        ILogger<AdminDriverEarningsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("overview/{driverProfileId:guid}")]
    [ProducesResponseType(typeof(AdminDriverEarningsOverviewDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminDriverEarningsOverviewDto>> GetOverview(
        Guid driverProfileId, CancellationToken ct)
    {
        var overview = await _service.GetDriverEarningsOverviewAsync(driverProfileId, ct);
        return Ok(overview);
    }

    [HttpGet("payouts/pending")]
    [ProducesResponseType(typeof(IReadOnlyList<AdminDriverPayoutListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdminDriverPayoutListItemDto>>> GetPendingPayouts(
        CancellationToken ct)
    {
        var payouts = await _service.GetPendingPayoutsAsync(ct);
        return Ok(payouts);
    }

    [HttpGet("pending-verification")]
    [ProducesResponseType(typeof(IReadOnlyList<AdminDriverPayoutListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdminDriverPayoutListItemDto>>> GetPendingVerification(
        CancellationToken ct)
    {
        var pending = await _service.GetPendingVerificationAsync(ct);
        return Ok(pending);
    }

    [HttpPost("payouts/{payoutId:guid}/approve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApprovePayout(Guid payoutId, CancellationToken ct)
    {
        await _service.ApprovePayoutAsync(payoutId, CurrentAdminId(), ct);
        return NoContent();
    }

    [HttpPost("payouts/{payoutId:guid}/reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RejectPayout(
        Guid payoutId, [FromBody] RejectPayoutRequest request, CancellationToken ct)
    {
        await _service.RejectPayoutAsync(payoutId, CurrentAdminId(), request.Reason, ct);
        return NoContent();
    }

    [HttpPost("payouts/{payoutId:guid}/retry")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RetryFailedPayout(Guid payoutId, CancellationToken ct)
    {
        await _service.RetryFailedPayoutAsync(payoutId, CurrentAdminId(), ct);
        return NoContent();
    }

    [HttpPost("{driverProfileId:guid}/verify-wallet")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> VerifyWalletInfo(Guid driverProfileId, CancellationToken ct)
    {
        await _service.VerifyWalletInfoAsync(driverProfileId, ct);
        return NoContent();
    }

    [HttpGet("history/{driverProfileId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<DriverEarningRowDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<DriverEarningRowDto>>> GetEarningsHistory(
        Guid driverProfileId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var history = await _service.GetDriverEarningsHistoryAsync(driverProfileId, pageNumber, pageSize, ct);
        return Ok(history);
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(PlatformDriverEarningsSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<PlatformDriverEarningsSummaryDto>> GetPlatformSummary(
        CancellationToken ct)
    {
        var summary = await _service.GetPlatformEarningsSummaryAsync(ct);
        return Ok(summary);
    }

    private Guid CurrentAdminId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}

public record RejectPayoutRequest(string Reason);
