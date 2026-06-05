using Backend.Application.DTOs.Driver;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Api.Controllers
{
    /// <summary>
    /// Self-service endpoints for a Driver to view and complete their profile
    /// and toggle availability. (Plan §7, Phases 2 &amp; 4.)
    /// </summary>
    [ApiController]
    [Route("api/driver/profile")]
    [Authorize(Roles = "Driver")]
    public class DriverProfileController : ControllerBase
    {
        private readonly IDriverProfileService _service;

        public DriverProfileController(IDriverProfileService service)
        {
            _service = service;
        }

        [HttpGet("me")]
        [ProducesResponseType(typeof(DriverProfileDetailsDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMe(CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            return Ok(await _service.GetProfileAsync(userId.Value, ct));
        }

        [HttpGet("me/status")]
        [ProducesResponseType(typeof(DriverProfileStatusDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStatus(CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            return Ok(await _service.GetStatusAsync(userId.Value, ct));
        }

        [HttpPost("complete")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(15 * 1024 * 1024)]
        [ProducesResponseType(typeof(DriverProfileDetailsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Complete([FromForm] CompleteDriverProfileRequest request, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            return Ok(await _service.CompleteProfileAsync(userId.Value, request, ct));
        }

        [HttpPut("availability")]
        [ProducesResponseType(typeof(DriverProfileStatusDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateAvailability([FromBody] UpdateDriverAvailabilityRequest request, CancellationToken ct)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            return Ok(await _service.UpdateAvailabilityAsync(userId.Value, request, ct));
        }

        private Guid? TryGetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null) return null;
            return Guid.TryParse(claim.Value, out var id) ? id : null;
        }
    }
}
