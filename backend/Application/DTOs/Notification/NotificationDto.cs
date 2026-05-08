namespace Backend.Application.DTOs.Notification;

/// <summary>
/// DTO for notification information
/// Validates: Requirements 9.1, 9.4
/// </summary>
public record NotificationDto(
    Guid Id,
    Guid UserId,
    string Title,
    string Message,
    bool IsRead,
    DateTime CreatedAt,
    string? Type = null);
