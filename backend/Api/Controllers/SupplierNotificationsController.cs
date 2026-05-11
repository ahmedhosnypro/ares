using System.Security.Claims;
using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Notification;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Notification endpoints scoped to the authenticated supplier.
///
/// Every endpoint:
///   * Requires authentication.
///   * Is gated to the <c>Supplier</c> role.
///   * Acts only on notifications whose <c>UserId</c> equals the
///     authenticated supplier id — there is no way for a supplier to
///     read, mark-as-read, or otherwise touch another user's
///     notifications, even by guessing ids.
///
/// The existing <see cref="NotificationsController"/> remains the
/// generic per-user notification endpoint for the customer-facing app;
/// it is intentionally left untouched so admin / customer flows keep
/// working exactly as before.
/// </summary>
[ApiController]
[Route("api/supplier/notifications")]
[Authorize(Roles = "Supplier")]
public class SupplierNotificationsController : ControllerBase
{
    private readonly ISupplierNotificationService _notificationService;
    private readonly ILogger<SupplierNotificationsController> _logger;

    public SupplierNotificationsController(
        ISupplierNotificationService notificationService,
        ILogger<SupplierNotificationsController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <summary>
    /// Returns a paginated slice of the supplier's notifications, newest
    /// first. Designed for infinite-scroll: the frontend keeps requesting
    /// the next <c>page</c> until <c>data.length &lt; pageSize</c> or
    /// <c>page &gt; totalPages</c>.
    /// </summary>
    /// <param name="filter">Read / unread / all (case-insensitive; unknown values fall back to "all").</param>
    /// <param name="page">1-based page index.</param>
    /// <param name="pageSize">Page size (default 20, capped at 100).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<SupplierNotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<SupplierNotificationDto>>> GetNotifications(
        [FromQuery] string? filter,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var readFilter = ParseFilter(filter);

        var result = await _notificationService.GetNotificationsAsync(
            supplierId, page, pageSize, readFilter, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Returns the unread-notification count for the supplier. Powers the
    /// topbar badge — kept as a separate endpoint so the badge can be
    /// refreshed without re-fetching the whole list.
    /// </summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var unreadCount = await _notificationService.GetUnreadCountAsync(supplierId, cancellationToken);

        // Camel-cased to match the spec ({"unreadCount": number}).
        return Ok(new { unreadCount });
    }

    /// <summary>
    /// Marks a single notification as read. The underlying service
    /// silently no-ops if the notification doesn't exist or is owned by
    /// another user — we never differentiate between "doesn't exist" and
    /// "not yours" to avoid leaking notification ids.
    /// </summary>
    [HttpPut("{id:guid}/read")]
    [HttpPatch("{id:guid}/read")] // PATCH alias mirrors the existing NotificationsController convention.
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> MarkAsRead(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        await _notificationService.MarkAsReadAsync(supplierId, id, cancellationToken);

        return Ok(new { Message = "Notification marked as read" });
    }

    /// <summary>
    /// Marks every unread notification owned by the supplier as read.
    /// Idempotent — calling it twice in a row returns <c>updated = 0</c>
    /// on the second call.
    /// </summary>
    [HttpPut("read-all")]
    [HttpPatch("read-all")] // PATCH alias mirrors the existing NotificationsController convention.
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken = default)
    {
        if (!TryGetSupplierId(out var supplierId, out var unauthorized))
        {
            return unauthorized!;
        }

        var updated = await _notificationService.MarkAllAsReadAsync(supplierId, cancellationToken);

        return Ok(new { Message = "All notifications marked as read", updated });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Resolves the supplier id from the JWT claim. The
    /// <c>[Authorize]</c> attribute already rejects anonymous / wrong-role
    /// callers; this defensive check turns a malformed claim into a clean
    /// 401 rather than a 500.
    /// </summary>
    private bool TryGetSupplierId(out Guid supplierId, out ActionResult? unauthorized)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out supplierId))
        {
            unauthorized = Unauthorized(new { Message = "User not authenticated" });
            supplierId = Guid.Empty;
            return false;
        }

        unauthorized = null;
        return true;
    }

    /// <summary>
    /// Parses the <c>filter</c> query string into the strongly-typed
    /// enum used by the service. Unknown / missing values map to
    /// <see cref="SupplierNotificationReadFilter.All"/> rather than a
    /// 400 so out-of-date clients always get something sensible back.
    /// </summary>
    private static SupplierNotificationReadFilter ParseFilter(string? filter)
    {
        if (string.IsNullOrWhiteSpace(filter)) return SupplierNotificationReadFilter.All;
        return filter.Trim().ToLowerInvariant() switch
        {
            "read" => SupplierNotificationReadFilter.Read,
            "unread" => SupplierNotificationReadFilter.Unread,
            _ => SupplierNotificationReadFilter.All,
        };
    }
}
