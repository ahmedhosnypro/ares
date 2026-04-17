using Backend.Application.DTOs.Location;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/locations")]
public class LocationsController : ControllerBase
{
    private readonly ILocationService _locationService;

    public LocationsController(ILocationService locationService)
    {
        _locationService = locationService;
    }

    /// <summary>
    /// Get location autocomplete suggestions
    /// </summary>
    /// <param name="query">Search query (minimum 3 characters)</param>
    /// <param name="type">Location type filter (pickup or dropoff)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of location suggestions</returns>
    [HttpGet("autocomplete")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Autocomplete(
        [FromQuery] string query,
        [FromQuery] string? type,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new { message = "Query parameter is required" });
        }

        if (query.Length < 3)
        {
            return BadRequest(new { message = "Query must be at least 3 characters" });
        }

        var suggestions = await _locationService.AutocompleteAsync(query, type, cancellationToken);

        return Ok(new { suggestions });
    }

    /// <summary>
    /// Get paginated locations (for frontend compatibility)
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="size">Page size</param>
    /// <param name="language">Language code (for future i18n support)</param>
    /// <param name="s">Search keyword</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of locations with name field</returns>
    [HttpGet("{page:int}/{size:int}/{language}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetLocationsForFrontend(
        int page,
        int size,
        string language,
        [FromQuery] string? s,
        CancellationToken cancellationToken)
    {
        if (page < 1)
        {
            return BadRequest(new { message = "Page must be greater than 0" });
        }

        if (size < 1 || size > 100)
        {
            return BadRequest(new { message = "Page size must be between 1 and 100" });
        }

        var result = await _locationService.GetLocationsForFrontendAsync(page, size, s ?? string.Empty, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Get paginated locations
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="size">Page size</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of locations</returns>
    [HttpPost("{page:int}/{size:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetLocations(
        int page,
        int size,
        CancellationToken cancellationToken)
    {
        if (page < 1)
        {
            return BadRequest(new { message = "Page must be greater than 0" });
        }

        if (size < 1 || size > 100)
        {
            return BadRequest(new { message = "Page size must be between 1 and 100" });
        }

        var result = await _locationService.GetLocationsAsync(page, size, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Create a new location (Admin only)
    /// </summary>
    /// <param name="request">Create location request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created location</returns>
    [HttpPost("/api/admin/locations/create")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateLocation(
        [FromBody] CreateLocationRequest request,
        CancellationToken cancellationToken)
    {
        var location = await _locationService.CreateLocationAsync(request, cancellationToken);

        return CreatedAtAction(
            nameof(GetLocations),
            new { page = 1, size = 20 },
            location);
    }

    /// <summary>
    /// Update an existing location (Admin only)
    /// </summary>
    /// <param name="id">Location ID</param>
    /// <param name="request">Update location request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Updated location</returns>
    [HttpPut("/api/admin/locations/{id:guid}/edit")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateLocation(
        Guid id,
        [FromBody] UpdateLocationRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var location = await _locationService.UpdateLocationAsync(id, request, cancellationToken);
            return Ok(location);
        }
        catch (ArgumentException ex) when (ex.Message.Contains("not found"))
        {
            return NotFound(new { message = $"Location with ID {id} not found" });
        }
    }
}
