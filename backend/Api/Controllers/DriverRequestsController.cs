using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Api.Controllers
{
    /// <summary>
    /// Driver-facing request inbox: open requests matching the driver's work
    /// areas, the driver's own responses, and the "express interest" action.
    /// Accepting only registers interest — it does NOT assign (Plan §7).
    /// </summary>
    [ApiController]
    [Route("api/driver/requests")]
    [Authorize(Roles = "Driver")]
    public class DriverRequestsController : ControllerBase
    {
        private readonly IDriverRequestService _service;
        private readonly IDriverProfileRepository _profiles;

        public DriverRequestsController(IDriverRequestService service, IDriverProfileRepository profiles)
        {
            _service = service;
            _profiles = profiles;
        }

        [HttpGet("available")]
        public async Task<IActionResult> Available(CancellationToken ct)
        {
            var profileId = await ResolveProfileIdAsync(ct);
            if (profileId is null) return Unauthorized();
            return Ok(await _service.GetAvailableRequestsAsync(profileId.Value, ct));
        }

        [HttpGet("mine")]
        public async Task<IActionResult> Mine(CancellationToken ct)
        {
            var profileId = await ResolveProfileIdAsync(ct);
            if (profileId is null) return Unauthorized();
            return Ok(await _service.GetMyRequestsAsync(profileId.Value, ct));
        }

        [HttpPost("{id:guid}/accept")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Accept(Guid id, CancellationToken ct)
        {
            var profileId = await ResolveProfileIdAsync(ct);
            if (profileId is null) return Unauthorized();
            await _service.AcceptRequestAsync(profileId.Value, id, ct);
            return NoContent();
        }

        [HttpPost("{id:guid}/decline")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Decline(Guid id, CancellationToken ct)
        {
            var profileId = await ResolveProfileIdAsync(ct);
            if (profileId is null) return Unauthorized();
            await _service.DeclineRequestAsync(profileId.Value, id, ct);
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
