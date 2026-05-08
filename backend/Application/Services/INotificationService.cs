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
}
