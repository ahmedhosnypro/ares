using Backend.Application.DTOs.Notification;

namespace Backend.Application.Services;

/// <summary>
/// Service interface for notification-related operations
/// Validates: Requirements 9.1, 9.2, 9.3, 9.4
/// </summary>
public interface INotificationService
{
    Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<int> GetUnreadCountAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task MarkAsReadAsync(
        Guid notificationId,
        CancellationToken cancellationToken = default);

    Task MarkAsReadForUserAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<int> MarkAllAsReadAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task CreateNotificationAsync(
        Guid userId,
        string title,
        string message,
        CancellationToken cancellationToken = default);

    Task CreateNotificationAsync(
        Guid userId,
        string title,
        string message,
        string? type,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates the same notification for every user in the "Admin" role.
    /// Used to fan-out real system events (new booking, booking status change,
    /// vehicle submitted, etc.) so admins see them in the admin notification
    /// bell / page. Implementation is best-effort and must not throw if no
    /// admins are configured or if user-role lookup is unavailable.
    /// </summary>
    Task NotifyAdminsAsync(
        string title,
        string message,
        string? type,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteNotificationForUserAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default);
}
