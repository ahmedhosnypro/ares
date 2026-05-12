using Backend.Application.DTOs.Verification;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Api.Controllers
{
    [ApiController]
    [Route("api/verifications")]
    [Authorize]
    public class VerificationsController : ControllerBase
    {
        private readonly IVerificationService _verificationService;
        private readonly ILogger<VerificationsController> _logger;

        public VerificationsController(
            IVerificationService verificationService,
            ILogger<VerificationsController> logger)
        {
            _verificationService = verificationService;
            _logger = logger;
        }

        /// <summary>
        /// Submit identity verification documents
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(UserVerificationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<UserVerificationDto>> SubmitVerification([FromForm] SubmitVerificationRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized();
            }

            var userId = Guid.Parse(userIdClaim.Value);
            
            _logger.LogInformation("User {UserId} submitting verification request", userId);

            var result = await _verificationService.SubmitVerificationAsync(userId, request);
            
            return Ok(result);
        }

        /// <summary>
        /// Get current user verification status
        /// </summary>
        [HttpGet("me")]
        [ProducesResponseType(typeof(UserVerificationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<UserVerificationDto>> GetMyVerification()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized();
            }

            var userId = Guid.Parse(userIdClaim.Value);

            var result = await _verificationService.GetMyVerificationAsync(userId);
            
            if (result == null)
            {
                return NotFound(new { Message = "No verification request found for this user." });
            }

            return Ok(result);
        }
    }
}
