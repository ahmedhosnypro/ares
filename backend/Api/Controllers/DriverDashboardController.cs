using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Api.Controllers
{
    /// <summary>Driver dashboard summary (status, availability, rating, totals).</summary>
    [ApiController]
    [Route("api/driver/dashboard")]
    [Authorize(Roles = "Driver")]
    public class DriverDashboardController : ControllerBase
    {
        private readonly IDriverDashboardService _service;
        private readonly IDriverProfileRepository _profiles;

        public DriverDashboardController(IDriverDashboardService service, IDriverProfileRepository profiles)
        {
            _service = service;
            _profiles = profiles;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> Summary(CancellationToken ct)
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null || !Guid.TryParse(claim.Value, out var userId)) return Unauthorized();
            var profile = await _profiles.GetByUserIdAsync(userId, ct);
            if (profile == null) return Unauthorized();
            return Ok(await _service.GetSummaryAsync(profile.Id, ct));
        }
    }
}
