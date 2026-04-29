using Backend.Application.DTOs.Notification;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Controller for notification-related operations
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
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Collection of user notifications</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetUserNotifications(
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            _logger.LogWarning("Unauthorized notification access attempt - no user ID claim found");
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var userId = Guid.Parse(userIdClaim.Value);

        _logger.LogInformation("Getting notifications for user {UserId}", userId);

        var notifications = await _notificationService.GetUserNotificationsAsync(
            userId,
            cancellationToken);

        return Ok(notifications);
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    /// <param name="id">Notification ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Success response</returns>
    [HttpPut("{id}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            _logger.LogWarning("Unauthorized notification mark as read attempt - no user ID claim found");
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var userId = Guid.Parse(userIdClaim.Value);

        _logger.LogInformation("User {UserId} marking notification {NotificationId} as read", userId, id);

        await _notificationService.MarkAsReadAsync(id, cancellationToken);

        return Ok(new { Message = "Notification marked as read successfully" });
    }

    /// <summary>
    /// Get the count of unread notifications for a user
    /// </summary>
    /// <param name="userId">User ID from route parameter</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Count of unread notifications</returns>
    [HttpGet("/api/notification-counter/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetNotificationCounter(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var authenticatedUserIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (authenticatedUserIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var authenticatedUserId = Guid.Parse(authenticatedUserIdClaim.Value);
        
        // Ensure user can only check their own notifications unless they are an admin
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
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var userId = Guid.Parse(userIdClaim.Value);

        await _notificationService.CreateNotificationAsync(
            userId,
            "Welcome to Ares Rental!",
            "Thank you for joining our platform. Check out our latest vehicles.",
            cancellationToken);

        await _notificationService.CreateNotificationAsync(
            userId,
            "Booking Confirmed",
            "Your recent booking request has been confirmed. Enjoy your ride!",
            cancellationToken);

        await _notificationService.CreateNotificationAsync(
            userId,
            "Special Offer",
            "Get 20% off on your next rental. Offer valid until the end of the month.",
            cancellationToken);

        return Ok(new { Message = "Dummy notifications created successfully" });
    }
}