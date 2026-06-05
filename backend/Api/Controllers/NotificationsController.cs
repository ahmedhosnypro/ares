using Backend.Application.DTOs.Notification;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Controller for notification-related operations.
/// All endpoints are scoped to the authenticated user.
/// Validates: Requirements 9.1, 9.2
/// </summary>
[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        INotificationService notificationService,
        ILogger<NotificationsController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <summary>
    /// Get all notifications for the authenticated user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetUserNotifications(
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            _logger.LogWarning("Unauthorized notification access attempt - no user ID claim found");
            return Unauthorized(new { Message = "User not authenticated" });
        }

        _logger.LogInformation("Getting notifications for user {UserId}", userId);

        var notifications = await _notificationService.GetUserNotificationsAsync(
            userId,
            cancellationToken);

        return Ok(notifications);
    }

    /// <summary>
    /// Mark a notification as read.
    /// Both PATCH (preferred) and PUT are accepted for backwards compatibility.
    /// </summary>
    [HttpPatch("{id}/read")]
    [HttpPut("{id}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            _logger.LogWarning("Unauthorized notification mark as read attempt - no user ID claim found");
            return Unauthorized(new { Message = "User not authenticated" });
        }

        _logger.LogInformation("User {UserId} marking notification {NotificationId} as read", userId, id);

        // Scoped to current user — silently ignored if notification belongs to someone else.
        await _notificationService.MarkAsReadForUserAsync(id, userId, cancellationToken);

        return Ok(new { Message = "Notification marked as read successfully" });
    }

    /// <summary>
    /// Mark all notifications for the authenticated user as read.
    /// </summary>
    [HttpPatch("read-all")]
    [HttpPut("read-all")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var updated = await _notificationService.MarkAllAsReadAsync(userId, cancellationToken);

        return Ok(new { Message = "All notifications marked as read", updated });
    }

    /// <summary>
    /// Get the count of unread notifications for a user.
    /// Users may only query their own counter unless they are an Admin.
    /// </summary>
    [HttpGet("/api/notification-counter/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetNotificationCounter(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var authenticatedUserId))
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (authenticatedUserId != userId && userRole != "Admin")
        {
            _logger.LogWarning("User {AuthenticatedUserId} attempted to access notification counter for {TargetUserId}", authenticatedUserId, userId);
            return Forbid();
        }

        var count = await _notificationService.GetUnreadCountAsync(userId, cancellationToken);

        return Ok(new { count });
    }

    /// <summary>
    /// Seed dummy notifications for testing purposes
    /// </summary>
    [HttpPost("seed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SeedNotifications(CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        await _notificationService.CreateNotificationAsync(
            userId,
            "Welcome to Ares Rental!",
            "Thank you for joining our platform. Check out our latest vehicles.",
            "Welcome",
            cancellationToken);

        await _notificationService.CreateNotificationAsync(
            userId,
            "Booking Confirmed",
            "Your recent booking request has been confirmed. Enjoy your ride!",
            "BookingApproved",
            cancellationToken);

        await _notificationService.CreateNotificationAsync(
            userId,
            "Special Offer",
            "Get 20% off on your next rental. Offer valid until the end of the month.",
            "Promotion",
            cancellationToken);

        return Ok(new { Message = "Dummy notifications created successfully" });
    }

    /// <summary>
    /// Delete a notification owned by the authenticated user.
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteNotification(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            _logger.LogWarning("Unauthorized notification deletion attempt - no user ID claim found");
            return Unauthorized(new { Message = "User not authenticated" });
        }

        _logger.LogInformation("User {UserId} deleting notification {NotificationId}", userId, id);

        var success = await _notificationService.DeleteNotificationForUserAsync(id, userId, cancellationToken);
        if (!success)
        {
            _logger.LogWarning("Notification {NotificationId} not found or not owned by user {UserId}", id, userId);
            return NotFound();
        }

        return Ok(new { Message = "Notification deleted successfully" });
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (claim == null)
        {
            return false;
        }

        return Guid.TryParse(claim.Value, out userId);
    }
}
