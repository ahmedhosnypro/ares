using Backend.Application.DTOs.Public;
using Backend.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/public/destinations")]
public class PublicDestinationsController : ControllerBase
{
    private readonly IPublicDestinationService _publicDestinationService;

    public PublicDestinationsController(IPublicDestinationService publicDestinationService)
    {
        _publicDestinationService = publicDestinationService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PublicDestinationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PublicDestinationDto>>> GetPopularDestinations(
        [FromQuery] int limit = 4,
        CancellationToken cancellationToken = default)
    {
        var destinations = await _publicDestinationService.GetPopularDestinationsAsync(limit, cancellationToken);
        return Ok(destinations);
    }
}
