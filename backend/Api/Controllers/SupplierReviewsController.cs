using System.Security.Claims;
using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Review;
using Backend.Application.Services;
using Backend.Application.Validators;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Review-management endpoints for the Supplier portal
/// (<c>/supplier/reviews</c> dashboard page).
///
/// Every endpoint:
///   * Requires authentication.
///   * Is gated to the <c>Supplier</c> role via <see cref="AuthorizeAttribute"/>.
///   * Resolves the supplier id from the JWT claim — suppliers cannot
///     see or mutate reviews belonging to vehicles owned by other
///     suppliers. The ownership filter is enforced inside the service
///     so the controller never trusts a client-supplied id.
///
/// The existing <see cref="ReviewsController"/> (public read +
/// customer create / edit) is intentionally left untouched.
/// Suppliers cannot delete reviews and cannot modify the
/// customer-authored fields — those operations are simply not
/// exposed on this controller.
/// </summary>
[ApiController]
[Route("api/supplier/reviews")]
[Authorize(Roles = "Supplier")]
public class SupplierReviewsController : ControllerBase
{
    private readonly ISupplierReviewService _supplierReviewService;
    private readonly ILogger<SupplierReviewsController> _logger;

    public SupplierReviewsController(
        ISupplierReviewService supplierReviewService,
        ILogger<SupplierReviewsController> logger)
    {
        _supplierReviewService = supplierReviewService;
        _logger = logger;
    }

    /// <summary>
    /// Returns a paginated, filtered, sorted list of reviews for the
    /// supplier's own vehicles.
    /// </summary>
    /// <param name="vehicleId">Optional vehicle filter — must be owned by the supplier; rows for other vehicles are silently excluded.</param>
    /// <param name="rating">Optional rating filter (1–5). Other values are ignored.</param>
    /// <param name="replyStatus">"replied" / "unreplied" (case-insensitive). null = no filter.</param>
    /// <param name="fromDate">Inclusive lower bound on review <c>CreatedAt</c> (UTC).</param>
    /// <param name="toDate">Inclusive upper bound on review <c>CreatedAt</c> (date-only; widened to end-of-day internally).</param>
    /// <param name="sortBy">"newest" (default) / "oldest" / "highest" / "lowest".</param>
    /// <param name="page">1-based page index (default 1).</param>
    /// <param name="pageSize">Page size (default 10, capped at 100).</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<SupplierReviewListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<SupplierReviewListItemDto>>> GetReviews(
        [FromQuery] Guid? vehicleId,
        [FromQuery] int? rating,
        [FromQuery] string? replyStatus,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? sortBy,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var filter = new SupplierReviewListFilterRequest(
            vehicleId,
            rating,
            replyStatus,
            fromDate,
            toDate,
            sortBy);

        var result = await _supplierReviewService.GetReviewsAsync(
            supplierId,
            page,
            pageSize,
            filter,
            cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Aggregate review statistics across all of the supplier's
    /// vehicles: average rating, total reviews, 5-star count and
    /// number of reviews still pending a supplier reply.
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(SupplierReviewStatisticsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<SupplierReviewStatisticsDto>> GetStatistics(
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var stats = await _supplierReviewService.GetStatisticsAsync(supplierId, cancellationToken);
        return Ok(stats);
    }

    /// <summary>
    /// Creates or updates the supplier reply on a single review.
    /// One reply per review — calling this again overwrites the
    /// existing reply (this IS the edit operation).
    /// Returns the updated review row in the same shape as the list
    /// endpoint so the UI can replace its local state without an
    /// extra fetch.
    /// </summary>
    [HttpPut("{reviewId:guid}/reply")]
    [ProducesResponseType(typeof(SupplierReviewListItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SupplierReviewListItemDto>> SaveReply(
        Guid reviewId,
        [FromBody] SupplierReplyRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var validator = new SupplierReplyRequestValidator();
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

        var result = await _supplierReviewService.SaveReplyAsync(
            supplierId, reviewId, request, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Flags a review as inappropriate (basic reporting only — no
    /// moderation pipeline yet). Calling this again on an
    /// already-reported review overwrites the reason and timestamp.
    /// </summary>
    [HttpPost("{reviewId:guid}/report")]
    [ProducesResponseType(typeof(SupplierReviewListItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SupplierReviewListItemDto>> ReportReview(
        Guid reviewId,
        [FromBody] SupplierReportReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var validator = new SupplierReportReviewRequestValidator();
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

        var result = await _supplierReviewService.ReportReviewAsync(
            supplierId, reviewId, request, cancellationToken);

        return Ok(result);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Resolves the supplier id from the authentication claim. Returns
    /// <c>false</c> with a populated <paramref name="unauthorized"/> result
    /// if the claim is missing or malformed — defensive — the
    /// <c>[Authorize]</c> attribute should already prevent that case.
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
