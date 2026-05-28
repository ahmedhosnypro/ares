using System.Security.Claims;
using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Vehicle;
using Backend.Application.Interfaces;
using Backend.Application.Validators;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Vehicle management endpoints for the Supplier portal.
///
/// Every endpoint:
///   * Requires authentication.
///   * Is gated to the <c>Supplier</c> role via <see cref="AuthorizeAttribute"/>.
///   * Filters by the authenticated supplier's id — suppliers cannot see
///     or modify vehicles owned by others.
///
/// The existing <see cref="VehiclesController"/> is intentionally left
/// untouched so admin and customer flows keep working exactly as before.
/// </summary>
[ApiController]
[Route("api/supplier/vehicles")]
[Authorize(Roles = "Supplier")]
public class SupplierVehiclesController : ControllerBase
{
    private readonly ISupplierVehicleService _supplierVehicleService;
    private readonly ILogger<SupplierVehiclesController> _logger;

    public SupplierVehiclesController(
        ISupplierVehicleService supplierVehicleService,
        ILogger<SupplierVehiclesController> logger)
    {
        _supplierVehicleService = supplierVehicleService;
        _logger = logger;
    }

    /// <summary>
    /// Returns the supplier's own vehicles, paginated, with optional
    /// search and status / availability filters.
    /// </summary>
    /// <param name="search">Free-text search across make, model, license plate.</param>
    /// <param name="status">Optional admin-status filter (Pending / Approved / Rejected …).</param>
    /// <param name="availabilityStatus">Optional availability filter (Available / Unavailable).</param>
    /// <param name="page">Page number (default 1).</param>
    /// <param name="pageSize">Page size (default 10, capped at 100).</param>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<SupplierVehicleListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<SupplierVehicleListItemDto>>> GetVehicles(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? availabilityStatus,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var filter = new SupplierVehicleListFilterRequest(search, status, availabilityStatus);

        var result = await _supplierVehicleService.GetVehiclesAsync(
            supplierId, page, pageSize, filter, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Returns the details of a single vehicle owned by the supplier.
    /// Returns <c>404</c> if the vehicle does not exist or is owned by
    /// another supplier (we do not differentiate to avoid leaking ids).
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(SupplierVehicleDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SupplierVehicleDetailsDto>> GetVehicle(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var details = await _supplierVehicleService.GetVehicleByIdAsync(
            supplierId, id, cancellationToken);

        return Ok(details);
    }

    /// <summary>
    /// Creates a new vehicle owned by the authenticated supplier.
    /// Owner is taken from the auth claim; <c>Status</c> defaults to
    /// <c>"Pending"</c> and <c>AvailabilityStatus</c> to <c>"Unavailable"</c>.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(VehicleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<VehicleResponse>> CreateVehicle(
        [FromBody] CreateSupplierVehicleRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var validator = new CreateSupplierVehicleRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(new
            {
                StatusCode = 400,
                Message = "Validation failed",
                ValidationErrors = validationResult.Errors.Select(e => new
                {
                    Field = e.PropertyName,
                    Message = e.ErrorMessage,
                }),
            });
        }

        var result = await _supplierVehicleService.CreateVehicleAsync(
            supplierId, request, cancellationToken);

        return CreatedAtAction(nameof(GetVehicle), new { id = result.VehicleId }, result);
    }

    /// <summary>
    /// Updates an existing supplier-owned vehicle. Rejected vehicles are
    /// read-only; the service returns <c>409</c> in that case.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(VehicleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<VehicleResponse>> UpdateVehicle(
        Guid id,
        [FromBody] UpdateSupplierVehicleRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var validator = new UpdateSupplierVehicleRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(new
            {
                StatusCode = 400,
                Message = "Validation failed",
                ValidationErrors = validationResult.Errors.Select(e => new
                {
                    Field = e.PropertyName,
                    Message = e.ErrorMessage,
                }),
            });
        }

        var result = await _supplierVehicleService.UpdateVehicleAsync(
            supplierId, id, request, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Soft-deletes a vehicle owned by the supplier. The row stays in the
    /// database (with <c>IsActive=false</c>) so related bookings,
    /// payments, and history are preserved.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(VehicleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<VehicleResponse>> DeleteVehicle(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var result = await _supplierVehicleService.DeleteVehicleAsync(
            supplierId, id, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Quick toggle for vehicle availability. Only changes
    /// <c>AvailabilityStatus</c>; the admin-managed <c>Status</c> is left
    /// alone. Pending or Rejected vehicles cannot be made available.
    /// </summary>
    [HttpPatch("{id:guid}/availability")]
    [ProducesResponseType(typeof(VehicleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<VehicleResponse>> SetAvailability(
        Guid id,
        [FromBody] SupplierAvailabilityToggleRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var result = await _supplierVehicleService.SetAvailabilityAsync(
            supplierId, id, request.Available, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Upload an image for a vehicle (Supplier only)
    /// </summary>
    /// <param name="id">Vehicle ID</param>
    /// <param name="file">Image file (max 10MB)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Image information</returns>
    [HttpPost("{id}/images/upload")]
    [ProducesResponseType(typeof(VehicleImageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehicleImageDto>> UploadImage(
        Guid id,
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var result = await _supplierVehicleService.UploadImageAsync(supplierId, id, file, cancellationToken);
        return Created($"/api/vehicles/{id}/images", result);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Resolves the supplier id from the authentication claim. Returns
    /// <c>false</c> with a populated <paramref name="unauthorized"/> result
    /// if the claim is missing or malformed (defensive — the
    /// <c>[Authorize]</c> attribute should already prevent that case).
    /// </summary>
    private bool TryGetSupplierId(out Guid supplierId, out ActionResult? unauthorized)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out supplierId))
        {
            unauthorized = Unauthorized(new { Message = "User not authenticated" });
            supplierId = Guid.Empty;
            return false;
        }

        unauthorized = null;
        return true;
    }
}
