using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Review;
using Backend.Application.Services;
using Backend.Application.Validators;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Controller for review-related operations
/// Validates: Requirements 8.1, 8.2, 8.3, 8.4
/// </summary>
[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;
    private readonly ILogger<ReviewsController> _logger;

    public ReviewsController(IReviewService reviewService, ILogger<ReviewsController> logger)
    {
        _reviewService = reviewService;
        _logger = logger;
    }

    /// <summary>
    /// Get reviews for a specific vehicle (public endpoint)
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 10)</param>
    /// <param name="sortBy">Sort field (date, rating, helpfulness)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of reviews</returns>
    [HttpGet("{vehicleId}")]
    [ProducesResponseType(typeof(PagedResult<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PagedResult<ReviewDto>>> GetVehicleReviews(
        Guid vehicleId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string sortBy = "date",
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting reviews for vehicle {VehicleId}, page {Page}, pageSize {PageSize}, sortBy {SortBy}",
            vehicleId, page, pageSize, sortBy);

        var result = await _reviewService.GetVehicleReviewsAsync(
            vehicleId,
            page,
            pageSize,
            sortBy,
            cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Create a new review for a vehicle (authenticated endpoint)
    /// </summary>
    /// <param name="request">Review creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Review creation response</returns>
    [HttpPost("create")]
    [Authorize]
    [ProducesResponseType(typeof(ReviewResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReviewResponse>> CreateReview(
        [FromBody] CreateReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            _logger.LogWarning("Unauthorized review creation attempt - no user ID claim found");
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var userId = Guid.Parse(userIdClaim.Value);

        _logger.LogInformation("User {UserId} creating review for vehicle {VehicleId}, booking {BookingId}",
            userId, request.VehicleId, request.BookingId);

        var validator = new CreateReviewRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);

        if (!validationResult.IsValid)
        {
            _logger.LogWarning("Review creation validation failed for user {UserId}: {Errors}",
                userId, string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage)));

            return BadRequest(new
            {
                StatusCode = 400,
                Message = "Validation failed",
                ValidationErrors = validationResult.Errors.Select(e => new
                {
                    Field = e.PropertyName,
                    Message = e.ErrorMessage
                })
            });
        }

        var result = await _reviewService.CreateReviewAsync(request, userId, cancellationToken);

        _logger.LogInformation("Review {ReviewId} created successfully by user {UserId} for vehicle {VehicleId}",
            result.ReviewId, userId, result.VehicleId);

        return CreatedAtAction(
            nameof(GetVehicleReviews),
            new { vehicleId = result.VehicleId },
            result);
    }

    /// <summary>
    /// Get the review attached to a specific booking (authenticated, owner only).
    /// Returns 204 No Content when no review exists yet.
    /// Used exclusively by the customer Booking Details page.
    /// </summary>
    [HttpGet("booking/{bookingId}")]
    [Authorize]
    [ProducesResponseType(typeof(BookingReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReviewByBooking(
        Guid bookingId,
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var userId = Guid.Parse(userIdClaim.Value);

        var review = await _reviewService.GetReviewByBookingAsync(bookingId, userId, cancellationToken);
        if (review == null)
        {
            return NoContent();
        }

        return Ok(review);
    }

    /// <summary>
    /// Update an existing review within the 24h edit window (owner only).
    /// </summary>
    [HttpPut("{reviewId}")]
    [Authorize]
    [ProducesResponseType(typeof(BookingReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateReview(
        Guid reviewId,
        [FromBody] UpdateReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var userId = Guid.Parse(userIdClaim.Value);

        var validator = new UpdateReviewRequestValidator();
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
                    Message = e.ErrorMessage
                })
            });
        }

        var updated = await _reviewService.UpdateReviewAsync(reviewId, request, userId, cancellationToken);

        _logger.LogInformation("Review {ReviewId} updated by user {UserId}", reviewId, userId);

        return Ok(updated);
    }
}
