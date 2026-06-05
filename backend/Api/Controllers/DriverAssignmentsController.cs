using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Api.Controllers
{
    /// <summary>
    /// Bookings assigned to the authenticated driver, plus the driver-initiated
    /// cancellation (allowed only ≥24h before pickup — Plan §8 rule 4).
    /// </summary>
    [ApiController]
    [Route("api/driver/assignments")]
    [Authorize(Roles = "Driver")]
    public class DriverAssignmentsController : ControllerBase
    {
        private readonly IDriverAssignmentService _service;
        private readonly IDriverProfileRepository _profiles;

        public DriverAssignmentsController(IDriverAssignmentService service, IDriverProfileRepository profiles)
        {
            _service = service;
            _profiles = profiles;
        }

        [HttpGet]
        public async Task<IActionResult> Get(CancellationToken ct)
        {
            var profileId = await ResolveProfileIdAsync(ct);
            if (profileId is null) return Unauthorized();
            return Ok(await _service.GetDriverAssignmentsAsync(profileId.Value, ct));
        }

        [HttpPost("{bookingId:guid}/cancel")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Cancel(Guid bookingId, CancellationToken ct)
        {
            var profileId = await ResolveProfileIdAsync(ct);
            if (profileId is null) return Unauthorized();
            await _service.DriverCancelAssignmentAsync(bookingId, profileId.Value, ct);
            return NoContent();
        }

        private async Task<Guid?> ResolveProfileIdAsync(CancellationToken ct)
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null || !Guid.TryParse(claim.Value, out var userId)) return null;
            var profile = await _profiles.GetByUserIdAsync(userId, ct);
            return profile?.Id;
        }
    }
}
