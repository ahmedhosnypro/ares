using Backend.Application.DTOs.Notification;

namespace Backend.Application.Services;

/// <summary>
/// Service interface for notification-related operations
/// Validates: Requirements 9.1, 9.2, 9.3, 9.4
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Gets all notifications for a specific user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Collection of user notifications</returns>
    Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the count of unread notifications for a specific user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Count of unread notifications</returns>
    Task<int> GetUnreadCountAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks a notification as read
    /// </summary>
    /// <param name="notificationId">Notification ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task MarkAsReadAsync(
        Guid notificationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new notification for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="title">Notification title</param>
    /// <param name="message">Notification message</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task CreateNotificationAsync(
        Guid userId,
        string title,
        string message,
        CancellationToken cancellationToken = default);
}