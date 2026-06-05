using Backend.Application.DTOs.Notification;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Identity;


namespace Backend.Application.Services;

/// <summary>
/// Service implementation for notification-related operations
/// Validates: Requirements 9.1, 9.2, 9.3, 9.4
/// </summary>
public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly UserManager<ApplicationUser>? _userManager;

    // Kept for backwards compatibility with existing unit tests that only mock
    // the repository. DI will prefer the richer constructor below at runtime.
    public NotificationService(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
        _userManager = null;
    }

    public NotificationService(
        INotificationRepository notificationRepository,
        UserManager<ApplicationUser> userManager)
    {
        _notificationRepository = notificationRepository;
        _userManager = userManager;
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
            n.CreatedAt,
            n.Type));
    }

    public async Task MarkAsReadAsync(
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        await _notificationRepository.MarkAsReadAsync(notificationId, cancellationToken);
    }

    public async Task MarkAsReadForUserAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await _notificationRepository.MarkAsReadForUserAsync(notificationId, userId, cancellationToken);
    }

    public async Task<int> MarkAllAsReadAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _notificationRepository.MarkAllAsReadAsync(userId, cancellationToken);
    }

    public Task CreateNotificationAsync(
        Guid userId,
        string title,
        string message,
        CancellationToken cancellationToken = default)
    {
        return CreateNotificationAsync(userId, title, message, null, cancellationToken);
    }

    public async Task CreateNotificationAsync(
        Guid userId,
        string title,
        string message,
        string? type,
        CancellationToken cancellationToken = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
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

    /// <summary>
    /// Fan-out helper: writes the same notification for every user in the
    /// "Admin" role. Best-effort — silently no-ops if the role lookup is
    /// unavailable (e.g. tests that use the legacy single-arg constructor)
    /// or if no admins are configured. Per-admin failures are swallowed so
    /// one bad row never aborts the rest.
    /// </summary>
    public async Task NotifyAdminsAsync(
        string title,
        string message,
        string? type,
        CancellationToken cancellationToken = default)
    {
        if (_userManager is null) return;

        IList<ApplicationUser> admins;
        try
        {
            admins = await _userManager.GetUsersInRoleAsync("Admin");
        }
        catch
        {
            // Identity store unavailable — best-effort, swallow.
            return;
        }

        if (admins.Count == 0) return;

        foreach (var admin in admins)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = admin.Id,
                    Title = title,
                    Message = message,
                    Type = type,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationRepository.AddAsync(notification, cancellationToken);
            }
            catch
            {
                // Skip this admin and continue with the rest.
            }
        }

        try
        {
            await _notificationRepository.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            // Best-effort save — swallow so the calling business operation
            // (booking creation, vehicle submission, …) never rolls back.
        }
    }

    public async Task<bool> DeleteNotificationForUserAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var notification = await _notificationRepository.GetByIdAsync(notificationId, cancellationToken);
        if (notification == null || notification.UserId != userId)
        {
            return false;
        }

        await _notificationRepository.DeleteAsync(notification, cancellationToken);
        await _notificationRepository.SaveChangesAsync(cancellationToken);
        return true;
    }
}
