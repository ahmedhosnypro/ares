namespace Backend.Application.DTOs.Notification;

/// <summary>
/// Filter for the Supplier Notifications list endpoint.
///
/// Maps to the <c>filter</c> query string on <c>GET /api/supplier/notifications</c>.
/// Defaults to <see cref="All"/> when no value (or an unrecognised value) is
/// supplied — the service treats unknown filter values as "all" rather than
/// returning a 400, so an out-of-date client never gets stuck.
/// </summary>
public enum SupplierNotificationReadFilter
{
    /// <summary>Both read and unread notifications.</summary>
    All = 0,
    /// <summary>Only notifications where <c>IsRead == true</c>.</summary>
    Read = 1,
    /// <summary>Only notifications where <c>IsRead == false</c>.</summary>
    Unread = 2,
}
