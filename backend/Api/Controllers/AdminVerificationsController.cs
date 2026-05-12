using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Verification;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Api.Controllers
{
    /// <summary>
    /// Admin-only endpoints for reviewing and managing user identity verification requests.
    /// All routes require the "Admin" role.
    /// </summary>
    [ApiController]
    [Route("api/admin/verifications")]
    [Authorize(Roles = "Admin")]
    public class AdminVerificationsController : ControllerBase
    {
        private readonly IVerificationService _verificationService;
        private readonly ILogger<AdminVerificationsController> _logger;

        public AdminVerificationsController(
            IVerificationService verificationService,
            ILogger<AdminVerificationsController> logger)
        {
            _verificationService = verificationService;
            _logger = logger;
        }

        /// <summary>
        /// List verification requests for admin review.
        /// Supports paging via `page`/`pageSize` and optional status filter
        /// (`Pending` | `Approved` | `Rejected`).
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<AdminVerificationDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<PagedResult<AdminVerificationDto>>> GetVerifications(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation(
                "Admin listing verifications - Page: {Page}, Size: {Size}, Status: {Status}",
                page, pageSize, status ?? "<all>");

            var result = await _verificationService.GetVerificationsForAdminAsync(
                page, pageSize, status, cancellationToken);

            return Ok(result);
        }

        /// <summary>
        /// Approve a pending verification request.
        /// </summary>
        [HttpPatch("{id}/approve")]
        [ProducesResponseType(typeof(AdminVerificationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<AdminVerificationDto>> ApproveVerification(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            var adminId = TryGetAdminId();
            if (adminId == null)
            {
                return Unauthorized();
            }

            _logger.LogInformation(
                "Admin {AdminId} approving verification {VerificationId}", adminId, id);

            var result = await _verificationService.ApproveVerificationAsync(
                id, adminId.Value, cancellationToken);

            return Ok(result);
        }

        /// <summary>
        /// Reject a pending verification request. Requires a rejection reason.
        /// </summary>
        [HttpPatch("{id}/reject")]
        [ProducesResponseType(typeof(AdminVerificationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<AdminVerificationDto>> RejectVerification(
            Guid id,
            [FromBody] RejectVerificationRequest request,
            CancellationToken cancellationToken = default)
        {
            var adminId = TryGetAdminId();
            if (adminId == null)
            {
                return Unauthorized();
            }

            if (request == null)
            {
                return BadRequest(new { Message = "Rejection reason is required." });
            }

            _logger.LogInformation(
                "Admin {AdminId} rejecting verification {VerificationId}", adminId, id);

            var result = await _verificationService.RejectVerificationAsync(
                id, adminId.Value, request.RejectionReason, cancellationToken);

            return Ok(result);
        }

        private Guid? TryGetAdminId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (idClaim == null) return null;
            return Guid.TryParse(idClaim.Value, out var id) ? id : null;
        }
    }
}
