using Backend.Application.DTOs.Inspection;
using Backend.Application.Features.VehicleInspections.Queries.GetPendingAssignments;
using Backend.Application.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Admin-side inspection workflow endpoints: assigning an inspector to a
/// booking and viewing the resulting inspection record.
/// </summary>
[ApiController]
[Route("api/admin/bookings")]
[Authorize(Roles = "Admin")]
public class AdminBookingInspectionsController : ControllerBase
{
    private readonly IInspectionService _inspectionService;
    private readonly IMediator _mediator;
    private readonly ILogger<AdminBookingInspectionsController> _logger;

    public AdminBookingInspectionsController(
        IInspectionService inspectionService,
        IMediator mediator,
        ILogger<AdminBookingInspectionsController> logger)
    {
        _inspectionService = inspectionService;
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Assign an inspector to the given booking. Creates a Pending
    /// inspection if none exists, otherwise reassigns. The inspector
    /// receives an in-app notification.
    /// </summary>
    [HttpPost("{bookingId:guid}/inspection/assign")]
    [ProducesResponseType(typeof(InspectionDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<InspectionDetailsDto>> Assign(
        Guid bookingId,
        [FromBody] AssignInspectorRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var adminUserId))
        {
            return Unauthorized();
        }

        var result = await _inspectionService.AssignInspectorToBookingAsync(
            bookingId, request, adminUserId, cancellationToken);

        _logger.LogInformation(
            "Inspector {InspectorUserId} assigned to booking {BookingId} by admin {AdminId}",
            request.InspectorUserId, bookingId, adminUserId);

        return Ok(result);
    }

    [HttpGet("pending-assignments")]
    [ProducesResponseType(typeof(IReadOnlyList<PendingAssignmentDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PendingAssignmentDto>>> GetPendingAssignments(
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetPendingAssignmentsQuery(), cancellationToken);
        return Ok(result);
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (claim == null) return false;
        return Guid.TryParse(claim.Value, out userId);
    }
}
