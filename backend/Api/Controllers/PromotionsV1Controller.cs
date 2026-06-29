using Backend.Application.DTOs.Promotions;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/v1/promotions")]
[Authorize]
public class PromotionsV1Controller : ControllerBase
{
    private readonly IDiscountApplicationService _applicationService;
    private readonly IAutomaticDiscountService _automaticService;
    private readonly ILogger<PromotionsV1Controller> _logger;

    public PromotionsV1Controller(
        IDiscountApplicationService applicationService,
        IAutomaticDiscountService automaticService,
        ILogger<PromotionsV1Controller> logger)
    {
        _applicationService = applicationService;
        _automaticService = automaticService;
        _logger = logger;
    }

    [HttpPost("apply")]
    [ProducesResponseType(typeof(BookingDiscountResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<BookingDiscountResult>> ApplyDiscount(
        [FromBody] DiscountApplyRequest request, CancellationToken cancellationToken)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null || !Guid.TryParse(userId, out var customerId))
            return Unauthorized();

        var result = await _applicationService.ApplyDiscountToBookingAsync(
            request.BookingId, request.Code, customerId, cancellationToken);

        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });

        return Ok(result);
    }

    [HttpGet("automatic")]
    [ProducesResponseType(typeof(List<AutomaticDiscountDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AutomaticDiscountDto>>> GetAutomaticDiscounts(
        [FromQuery] Guid? vehicleId, CancellationToken cancellationToken)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null || !Guid.TryParse(userId, out var customerId))
            return Unauthorized();

        var result = await _automaticService.GetAutomaticDiscountsAsync(customerId, vehicleId, cancellationToken: cancellationToken);
        return Ok(result);
    }
}
