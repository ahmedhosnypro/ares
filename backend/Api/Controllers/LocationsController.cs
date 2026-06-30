using Backend.Application.DTOs.Location;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

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

    /// <summary>
    /// Get location by ID (Admin only)
    /// </summary>
    [HttpGet("/api/admin/locations/{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLocationById(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            var location = await _locationService.GetLocationByIdAsync(id, cancellationToken);
            return Ok(location);
        }
        catch (ArgumentException ex) when (ex.Message.Contains("not found"))
        {
            return NotFound(new { message = $"Location with ID {id} not found" });
        }
    }

    /// <summary>
    /// Delete a location (Admin only)
    /// </summary>
    [HttpDelete("/api/admin/locations/{id:guid}/delete")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteLocation(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _locationService.DeleteLocationAsync(id, cancellationToken);
        if (!result)
        {
            return NotFound(new { message = $"Location with ID {id} not found" });
        }
        return Ok(new { message = "Location deleted successfully" });
    }

    /// <summary>
    /// Upload an image for a location (Admin only)
    /// </summary>
    [HttpPost("/api/admin/locations/{id:guid}/image")]
    [Authorize(Roles = "Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadLocationImage(
        Guid id,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file.Length == 0)
        {
            return BadRequest(new { message = "File is empty." });
        }

        const long maxFileSize = 10 * 1024 * 1024;
        if (file.Length > maxFileSize)
        {
            return BadRequest(new { message = "File size exceeds the maximum limit of 10MB." });
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(extension) || !allowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = $"Invalid file type. Allowed types: {string.Join(", ", allowedExtensions)}" });
        }

        var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
        {
            return BadRequest(new { message = "Invalid content type. Only image/jpeg, image/png, and image/webp are allowed." });
        }

        string? oldImageUrl = null;
        try
        {
            var existingLocation = await _locationService.GetLocationByIdAsync(id, cancellationToken);
            oldImageUrl = existingLocation.ImageUrl;
        }
        catch (ArgumentException ex) when (ex.Message.Contains("not found"))
        {
            return NotFound(new { message = $"Location with ID {id} not found" });
        }

        var fileName = $"{id}_{Guid.NewGuid():N}{extension}";
        var uploadsFolder = Path.Combine("wwwroot", "uploads", "locations");
        Directory.CreateDirectory(uploadsFolder);

        var filePath = Path.Combine(uploadsFolder, fileName);
        try
        {
            await using (var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            var updateRequest = new UpdateLocationImageRequest($"/uploads/locations/{fileName}");
            var location = await _locationService.UpdateLocationImageUrlAsync(id, updateRequest, cancellationToken);
        }
        catch
        {
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
            throw;
        }

        if (!string.IsNullOrEmpty(oldImageUrl))
        {
            var oldFilePath = Path.Combine("wwwroot", oldImageUrl.TrimStart('/'));
            if (System.IO.File.Exists(oldFilePath))
            {
                System.IO.File.Delete(oldFilePath);
            }
        }

        var updatedLocation = await _locationService.GetLocationByIdAsync(id, cancellationToken);
        return Ok(updatedLocation);
    }
}
