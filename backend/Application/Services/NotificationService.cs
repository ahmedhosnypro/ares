using Backend.Application.DTOs.Notification;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;

namespace Backend.Application.Services;

/// <summary>
/// Service implementation for notification-related operations
/// Validates: Requirements 9.1, 9.2, 9.3, 9.4
/// </summary>
public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;

    public NotificationService(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var notifications = await _notificationRepository.GetUserNotificationsAsync(
            userId,
            cancellationToken);

        return notifications.Select(n => new NotificationDto(
            n.Id,
            n.UserId,
            n.Title,
            n.Message,
            n.IsRead,
            n.CreatedAt));
    }

    public async Task MarkAsReadAsync(
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        await _notificationRepository.MarkAsReadAsync(notificationId, cancellationToken);
    }

    public async Task CreateNotificationAsync(
        Guid userId,
        string title,
        string message,
        CancellationToken cancellationToken = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _notificationRepository.AddAsync(notification, cancellationToken);
        await _notificationRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> GetUnreadCountAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _notificationRepository.GetUnreadCountAsync(userId, cancellationToken);
    }
}