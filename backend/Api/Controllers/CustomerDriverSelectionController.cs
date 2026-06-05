using Backend.Application.DTOs.Driver;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Api.Controllers
{
    /// <summary>
    /// Customer-owned driver selection for a booking: view interested drivers
    /// (PII-safe), select one, change (≥24h), cancel (≥24h), and retry search.
    /// (Plan §7, Phases 8–12.)
    /// </summary>
    [ApiController]
    [Route("api/bookings/{bookingId:guid}/drivers")]
    [Authorize(Roles = "Customer")]
    public class CustomerDriverSelectionController : ControllerBase
    {
        private readonly IDriverRequestService _requestService;
        private readonly IDriverAssignmentService _assignmentService;

        public CustomerDriverSelectionController(
            IDriverRequestService requestService,
            IDriverAssignmentService assignmentService)
        {
            _requestService = requestService;
            _assignmentService = assignmentService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<PublicDriverDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> Interested(Guid bookingId, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            return Ok(await _requestService.GetInterestedDriversAsync(bookingId, userId.Value, ct));
        }

        [HttpPost("{driverProfileId:guid}/select")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Select(Guid bookingId, Guid driverProfileId, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            await _assignmentService.SelectDriverAsync(bookingId, driverProfileId, userId.Value, ct);
            return NoContent();
        }

        [HttpPost("change")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Change(Guid bookingId, [FromBody] ChangeDriverRequest request, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            await _assignmentService.ChangeDriverAsync(bookingId, request, userId.Value, ct);
            return NoContent();
        }

        [HttpPost("cancel")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Cancel(Guid bookingId, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            await _assignmentService.CancelDriverAsync(bookingId, userId.Value, ct);
            return NoContent();
        }

        [HttpPost("retry")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Retry(Guid bookingId, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            await _requestService.RetryRequestAsync(bookingId, userId.Value, ct);
            return NoContent();
        }

        private Guid? TryGetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null) return null;
            return Guid.TryParse(claim.Value, out var id) ? id : null;
        }
    }
}
