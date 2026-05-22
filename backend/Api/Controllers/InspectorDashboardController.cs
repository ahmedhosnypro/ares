using Backend.Application.DTOs.Inspection;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Inspector-only endpoints powering the inspector dashboard:
/// see assigned tasks, open one, upload images, fill in the report and
/// submit (approve/reject). Once submitted, the inspection is locked.
/// </summary>
[ApiController]
[Route("api/inspector")]
[Authorize(Roles = "Inspector")]
public class InspectorDashboardController : ControllerBase
{
    private readonly IInspectionService _inspectionService;
    private readonly ILogger<InspectorDashboardController> _logger;

    public InspectorDashboardController(
        IInspectionService inspectionService,
        ILogger<InspectorDashboardController> logger)
    {
        _inspectionService = inspectionService;
        _logger = logger;
    }

    /// <summary>Open inspections currently assigned to me.</summary>
    [HttpGet("inspections")]
    [ProducesResponseType(typeof(IReadOnlyList<InspectionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<InspectionDto>>> GetAssigned(
        [FromQuery] bool includeSubmitted = false,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var inspections = await _inspectionService.GetAssignedAsync(userId, includeSubmitted, cancellationToken);
        return Ok(inspections);
    }

    /// <summary>Full details for one of my inspections.</summary>
    [HttpGet("inspections/{inspectionId:guid}")]
    [ProducesResponseType(typeof(InspectionDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InspectionDetailsDto>> GetById(
        Guid inspectionId,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var details = await _inspectionService.GetByIdAsync(inspectionId, userId, isAdmin: false, cancellationToken);
        return details is null ? NotFound() : Ok(details);
    }

    /// <summary>Update notes / odometer / fuel / condition on the draft.</summary>
    [HttpPatch("inspections/{inspectionId:guid}")]
    [ProducesResponseType(typeof(InspectionDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<InspectionDetailsDto>> UpdateDraft(
        Guid inspectionId,
        [FromBody] UpdateInspectionDraftRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var result = await _inspectionService.UpdateDraftAsync(inspectionId, userId, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>Attach an already-hosted image URL to the inspection.</summary>
    [HttpPost("inspections/{inspectionId:guid}/images")]
    [ProducesResponseType(typeof(InspectionImageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<InspectionImageDto>> AddImage(
        Guid inspectionId,
        [FromBody] AddInspectionImageRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var image = await _inspectionService.AddImageAsync(inspectionId, userId, request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { inspectionId }, image);
    }

    /// <summary>
    /// Upload one or more raw image files for this inspection.
    /// Files are saved to <c>wwwroot/uploads/inspections/{inspectionId}</c>
    /// and registered as InspectionImage records.
    /// </summary>
    [HttpPost("inspections/{inspectionId:guid}/images/upload")]
    [ProducesResponseType(typeof(IReadOnlyList<InspectionImageDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<ActionResult<IReadOnlyList<InspectionImageDto>>> UploadImages(
        Guid inspectionId,
        [FromForm] List<IFormFile> files,
        [FromServices] IWebHostEnvironment env,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        if (files == null || files.Count == 0)
        {
            return BadRequest(new { Message = "At least one file is required." });
        }

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var webRoot = env.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }
        var targetDir = Path.Combine(webRoot, "uploads", "inspections", inspectionId.ToString());
        Directory.CreateDirectory(targetDir);

        var results = new List<InspectionImageDto>();
        foreach (var file in files)
        {
            if (file.Length == 0) continue;
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowed.Contains(ext))
            {
                return BadRequest(new { Message = $"Unsupported file type: {ext}" });
            }
            var safeName = $"{Guid.NewGuid()}{ext}";
            var fullPath = Path.Combine(targetDir, safeName);
            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }
            var publicUrl = $"/uploads/inspections/{inspectionId}/{safeName}";
            var dto = await _inspectionService.AddImageAsync(
                inspectionId,
                userId,
                new AddInspectionImageRequest(publicUrl),
                cancellationToken);
            results.Add(dto);
        }

        _logger.LogInformation(
            "Inspector {UserId} uploaded {Count} image(s) to inspection {InspectionId}",
            userId, results.Count, inspectionId);

        return StatusCode(StatusCodes.Status201Created, results);
    }

    /// <summary>Submit the inspection (Approve = true → ready for delivery,
    /// false → inspection failed). Locks the inspection.</summary>
    [HttpPost("inspections/{inspectionId:guid}/submit")]
    [ProducesResponseType(typeof(InspectionDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<InspectionDetailsDto>> Submit(
        Guid inspectionId,
        [FromBody] SubmitInspectionRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var result = await _inspectionService.SubmitAsync(inspectionId, userId, request, cancellationToken);
        _logger.LogInformation(
            "Inspector {UserId} submitted inspection {InspectionId} as {Decision}",
            userId, inspectionId, result.Status);
        return Ok(result);
    }

    /// <summary>My submitted inspection history.</summary>
    [HttpGet("inspections/history")]
    [ProducesResponseType(typeof(IReadOnlyList<InspectionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<InspectionDto>>> GetHistory(
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        var history = await _inspectionService.GetHistoryAsync(userId, cancellationToken);
        return Ok(history);
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (claim == null) return false;
        return Guid.TryParse(claim.Value, out userId);
    }
}
