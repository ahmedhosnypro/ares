using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Notification;

namespace Backend.Application.Services;

/// <summary>
/// Application-layer contract for the Supplier Notifications module.
///
/// Every method takes the authenticated <c>supplierId</c> as its first
/// argument and is responsible for ensuring that the caller can only
/// see / modify notifications whose <c>UserId</c> equals that supplier
/// id. Ownership is enforced inside the SQL <c>WHERE</c> clause — no
/// notification belonging to another user can leak even if a forged id
/// is supplied.
///
/// All write methods (mark-as-read, mark-all-as-read) are idempotent:
/// hitting them multiple times has the same effect as hitting them once.
/// </summary>
public interface ISupplierNotificationService
{
    /// <summary>
    /// Returns a paginated slice of the supplier's notifications, newest
    /// first, optionally filtered by read / unread state. The paging
    /// model is suited to infinite-scroll: clients pass <c>page</c>
    /// (1-based) and <c>pageSize</c>; the response carries the total
    /// count so the client can stop scrolling at the end of the list.
    /// </summary>
    Task<PagedResult<SupplierNotificationDto>> GetNotificationsAsync(
        Guid supplierId,
        int page,
        int pageSize,
        SupplierNotificationReadFilter filter,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns the count of unread notifications for the supplier.
    /// Used by the topbar badge.
    /// </summary>
    Task<int> GetUnreadCountAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks a single notification as read but only if it belongs to
    /// the supplier. Silently no-ops if the notification doesn't exist
    /// or is owned by someone else (we never reveal whether an id
    /// belongs to another user).
    /// </summary>
    Task MarkAsReadAsync(
        Guid supplierId,
        Guid notificationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks every unread notification belonging to the supplier as
    /// read. Returns the number of rows updated.
    /// </summary>
    Task<int> MarkAllAsReadAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a single notification owned by the supplier.
    /// Returns true if found and deleted, false otherwise.
    /// </summary>
    Task<bool> DeleteNotificationAsync(
        Guid supplierId,
        Guid notificationId,
        CancellationToken cancellationToken = default);
}
