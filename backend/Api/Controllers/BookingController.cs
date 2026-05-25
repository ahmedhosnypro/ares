using Backend.Application.DTOs.Booking;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Controller for individual booking operations
/// Validates: Requirements 5.8, 5.9, 5.10, 5.11, 5.12, 5.13
/// </summary>
[ApiController]
[Route("api/booking")]
[Authorize]
public class BookingController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly ILogger<BookingController> _logger;

    public BookingController(
        IBookingService bookingService,
        ILogger<BookingController> logger)
    {
        _bookingService = bookingService;
        _logger = logger;
    }

    /// <summary>
    /// Get detailed information about a specific booking
    /// Validates: Requirements 5.8, 5.9, 5.10
    /// </summary>
    /// <param name="id">Booking ID</param>
    /// <param name="language">Language code</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Complete booking details</returns>
    [HttpGet("{id}/{language}")]
    [ProducesResponseType(typeof(BookingDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookingDetailsDto>> GetBookingDetails(
        Guid id,
        string language,
        CancellationToken cancellationToken = default)
    {
        // Get authenticated user ID
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var userId = Guid.Parse(userIdClaim.Value);
        var isAdmin = User.IsInRole("Admin");

        var result = await _bookingService.GetBookingDetailsAsync(id, userId, isAdmin, cancellationToken);

        _logger.LogInformation(
            "Retrieved booking details for booking {BookingId}, user {UserId}, isAdmin: {IsAdmin}",
            id,
            userId,
            isAdmin);

        return Ok(result);
    }

    /// <summary>
    /// Cancel a booking
    /// Validates: Requirements 5.11, 5.12, 5.13
    /// </summary>
    /// <param name="id">Booking ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Success response</returns>
    [HttpPost("/api/cancel-booking/{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelBooking(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        // Get authenticated user ID
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var userId = Guid.Parse(userIdClaim.Value);

        var result = await _bookingService.CancelBookingAsync(id, userId, cancellationToken);

        _logger.LogInformation(
            "Booking {BookingId} cancelled by user {UserId}",
            id,
            userId);

        return Ok(new
        {
            Success = result,
            Message = "Booking cancelled successfully"
        });
    }
}
