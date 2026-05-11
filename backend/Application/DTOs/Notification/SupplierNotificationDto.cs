namespace Backend.Application.DTOs.Notification;

/// <summary>
/// Notification row returned by the Supplier Notifications endpoints.
///
/// Carries the same scalar fields as <see cref="NotificationDto"/> but
/// also exposes the deep-link metadata the frontend uses to navigate
/// from a notification to the entity it refers to (vehicle / booking).
///
/// <c>EntityType</c>, <c>EntityId</c> and <c>RedirectUrl</c> are derived
/// at read time from the structured <see cref="Backend.Domain.Entities.Notification.Type"/>
/// tag (see <see cref="Backend.Application.Services.SupplierNotificationTypes"/>),
/// so no database migration is required to expose them on the wire.
/// </summary>
public record SupplierNotificationDto(
    Guid Id,
    string Title,
    string Message,
    /// <summary>Notification type tag, e.g. "VehicleApproved", "BookingReceived". Maps 1:1 to a frontend display variant.</summary>
    string? Type,
    bool IsRead,
    DateTime CreatedAt,
    /// <summary>Logical entity the notification refers to ("Vehicle", "Booking", or null when there's no deep link).</summary>
    string? EntityType,
    /// <summary>Id of the referenced entity, if any.</summary>
    Guid? EntityId,
    /// <summary>Frontend route the supplier should land on when they click the notification. Always relative.</summary>
    string? RedirectUrl
);
