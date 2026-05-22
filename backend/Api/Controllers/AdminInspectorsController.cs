using Backend.Application.DTOs.Inspector;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Admin endpoints for managing the pool of vehicle inspectors.
/// </summary>
[ApiController]
[Route("api/admin/inspectors")]
[Authorize(Roles = "Admin")]
public class AdminInspectorsController : ControllerBase
{
    private readonly IInspectorManagementService _service;
    private readonly ILogger<AdminInspectorsController> _logger;

    public AdminInspectorsController(
        IInspectorManagementService service,
        ILogger<AdminInspectorsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>List all inspectors (optionally filter to active only).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<InspectorDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<InspectorDto>>> GetAll(
        [FromQuery] bool? activeOnly,
        CancellationToken cancellationToken = default)
    {
        var inspectors = await _service.GetAllAsync(activeOnly, cancellationToken);
        return Ok(inspectors);
    }

    /// <summary>Get a single inspector with workload stats and recent inspections.</summary>
    [HttpGet("{inspectorId:guid}")]
    [ProducesResponseType(typeof(InspectorDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InspectorDetailsDto>> GetById(
        Guid inspectorId,
        CancellationToken cancellationToken = default)
    {
        var details = await _service.GetByIdAsync(inspectorId, cancellationToken);
        if (details == null)
        {
            return NotFound(new { Message = "Inspector not found" });
        }
        return Ok(details);
    }

    /// <summary>Provision a new inspector (creates user + assigns Inspector role).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(InspectorDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<InspectorDto>> Create(
        [FromBody] CreateInspectorRequest request,
        CancellationToken cancellationToken = default)
    {
        var inspector = await _service.CreateAsync(request, cancellationToken);
        _logger.LogInformation(
            "Admin {AdminId} created inspector {InspectorId} ({Email})",
            User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value,
            inspector.InspectorId,
            inspector.Email);
        return CreatedAtAction(
            nameof(GetById),
            new { inspectorId = inspector.InspectorId },
            inspector);
    }

    /// <summary>Enable / disable an inspector (also flips their availability).</summary>
    [HttpPatch("{inspectorId:guid}/status")]
    [ProducesResponseType(typeof(InspectorDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InspectorDto>> UpdateStatus(
        Guid inspectorId,
        [FromBody] UpdateInspectorStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var inspector = await _service.UpdateStatusAsync(inspectorId, request, cancellationToken);
        return Ok(inspector);
    }
}
