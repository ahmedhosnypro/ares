using Backend.Application.DTOs.Promotions;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/public/promotions")]
[Authorize]
public class PublicPromotionsController : ControllerBase
{
    private readonly IDiscountValidationService _validationService;
    private readonly ILogger<PublicPromotionsController> _logger;

    public PublicPromotionsController(
        IDiscountValidationService validationService,
        ILogger<PublicPromotionsController> logger)
    {
        _validationService = validationService;
        _logger = logger;
    }

    [HttpPost("validate")]
    [ProducesResponseType(typeof(DiscountValidationResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DiscountValidationResponse>> ValidateDiscountCode(
        [FromBody] DiscountValidationRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null || !Guid.TryParse(userId, out var authenticatedCustomerId))
            return Unauthorized();

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

        var result = await _validationService.ValidateDiscountCodeAsync(
            request.Code, request.VehicleId, authenticatedCustomerId,
            request.StartDate, request.EndDate, request.Subtotal,
            ipAddress, userAgent, cancellationToken);

        var response = new DiscountValidationResponse(
            result.IsValid,
            result.DiscountId,
            result.Code,
            result.DiscountType,
            result.DiscountValue,
            result.DiscountAmount,
            result.FinalPrice,
            result.SavingsPercentage,
            result.Errors.Select(e => new DiscountValidationErrorDto(e.Code, e.Message)).ToList()
        );

        return Ok(response);
    }
}
