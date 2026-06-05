using Backend.Application.DTOs.Driver;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Api.Controllers
{
    /// <summary>
    /// Admin driver management: list/filter, pending queue, details, and the
    /// verification + enable/disable actions (Plan §7, Phase 3 + Admin).
    /// </summary>
    [ApiController]
    [Route("api/admin/drivers")]
    [Authorize(Roles = "Admin")]
    public class AdminDriversController : ControllerBase
    {
        private readonly IAdminDriverService _service;

        public AdminDriversController(IAdminDriverService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? status, CancellationToken ct)
            => Ok(await _service.GetDriversAsync(status, ct));

        [HttpGet("pending")]
        public async Task<IActionResult> Pending(CancellationToken ct)
            => Ok(await _service.GetPendingDriversAsync(ct));

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Details(Guid id, CancellationToken ct)
            => Ok(await _service.GetDriverDetailsAsync(id, ct));

        [HttpPost("{id:guid}/approve")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
        {
            await _service.ApproveDriverAsync(id, CurrentAdminId(), ct);
            return NoContent();
        }

        [HttpPost("{id:guid}/reject")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Reject(Guid id, [FromBody] AdminRejectDriverRequest request, CancellationToken ct)
        {
            await _service.RejectDriverAsync(id, request, CurrentAdminId(), ct);
            return NoContent();
        }

        [HttpPost("{id:guid}/enable")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Enable(Guid id, CancellationToken ct)
        {
            await _service.EnableDriverAsync(id, CurrentAdminId(), ct);
            return NoContent();
        }

        [HttpPost("{id:guid}/disable")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Disable(Guid id, CancellationToken ct)
        {
            await _service.DisableDriverAsync(id, CurrentAdminId(), ct);
            return NoContent();
        }

        private Guid CurrentAdminId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }
    }
}
