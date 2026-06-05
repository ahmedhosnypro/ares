using Backend.Application.DTOs.Driver;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Api.Controllers
{
    /// <summary>
    /// Separate driver review system (Plan §7, Phase 16). Public read of a
    /// driver's reviews; authenticated customers post a review for a booking
    /// whose assigned driver they had.
    /// </summary>
    [ApiController]
    [Route("api")]
    public class DriverReviewsController : ControllerBase
    {
        private readonly IDriverReviewService _service;

        public DriverReviewsController(IDriverReviewService service)
        {
            _service = service;
        }

        [HttpGet("drivers/{driverProfileId:guid}/reviews")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(IEnumerable<DriverReviewDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetForDriver(Guid driverProfileId, CancellationToken ct)
        {
            return Ok(await _service.GetReviewsForDriverAsync(driverProfileId, ct));
        }

        [HttpPost("bookings/{bookingId:guid}/driver-review")]
        [Authorize(Roles = "Customer")]
        [ProducesResponseType(typeof(DriverReviewDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create(Guid bookingId, [FromBody] CreateDriverReviewRequest request, CancellationToken ct)
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null || !Guid.TryParse(claim.Value, out var userId)) return Unauthorized();
            return Ok(await _service.CreateReviewAsync(bookingId, request, userId, ct));
        }
    }
}
