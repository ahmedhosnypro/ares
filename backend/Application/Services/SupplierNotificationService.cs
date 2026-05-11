using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Notification;
using Backend.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services;

/// <summary>
/// Default implementation of <see cref="ISupplierNotificationService"/>.
///
/// Design notes (mirrors the style used by other Supplier services):
///   * Reads are <c>AsNoTracking</c>. Ownership (<c>n.UserId == supplierId</c>)
///     is enforced inside the SQL <c>WHERE</c> clause so a forged
///     <c>supplierId</c> can only ever return zero rows.
///   * Pagination, filtering, ordering and the total count come from
///     the same composed query — filter changes apply to both the page
///     and the count consistently.
///   * The <see cref="Backend.Domain.Entities.Notification"/> entity is
///     reused as-is; no migration is required. <c>EntityType</c> /
///     <c>EntityId</c> / <c>RedirectUrl</c> are derived from the
///     existing <c>Type</c> column via
///     <see cref="SupplierNotificationTypes.Parse"/>.
///   * The mark-as-read endpoints reuse the existing
///     <see cref="INotificationRepository"/> methods — those already
///     filter by user id, so we don't duplicate that logic here.
/// </summary>
public class SupplierNotificationService : ISupplierNotificationService
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationRepository _notificationRepository;
    private readonly ILogger<SupplierNotificationService> _logger;

    public SupplierNotificationService(
        IApplicationDbContext context,
        INotificationRepository notificationRepository,
        ILogger<SupplierNotificationService> logger)
    {
        _context = context;
        _notificationRepository = notificationRepository;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<PagedResult<SupplierNotificationDto>> GetNotificationsAsync(
        Guid supplierId,
        int page,
        int pageSize,
        SupplierNotificationReadFilter filter,
        CancellationToken cancellationToken = default)
    {
        // Defensive paging bounds (same conventions as the other
        // Supplier services).
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == supplierId);

        query = filter switch
        {
            SupplierNotificationReadFilter.Read => query.Where(n => n.IsRead),
            SupplierNotificationReadFilter.Unread => query.Where(n => !n.IsRead),
            _ => query, // All — no extra filter
        };

        // Ordering must be set BEFORE Skip/Take or the SQL provider warns
        // and the page contents become non-deterministic.
        query = query.OrderByDescending(n => n.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        var skip = (page - 1) * pageSize;

        // Projection — we only pull the columns the wire DTO needs.
        var rows = await query
            .Skip(skip)
            .Take(pageSize)
            .Select(n => new
            {
                n.Id,
                n.Title,
                n.Message,
                n.Type,
                n.IsRead,
                n.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        var items = rows.Select(r =>
        {
            // Decode the structured Type tag into (tag, entity_id) and
            // map both to the matching entity type + supplier-portal
            // redirect URL.
            SupplierNotificationTypes.Parse(r.Type, out var tag, out var entityId);
            var entityType = SupplierNotificationTypes.EntityTypeFor(tag);
            var redirectUrl = SupplierNotificationTypes.RedirectUrlFor(tag, entityId);

            return new SupplierNotificationDto(
                Id: r.Id,
                Title: r.Title,
                Message: r.Message,
                // Expose only the tag (e.g. "VehicleApproved") on the wire —
                // the entity id is already surfaced as a separate field.
                Type: tag,
                IsRead: r.IsRead,
                CreatedAt: r.CreatedAt,
                EntityType: entityType,
                EntityId: entityId,
                RedirectUrl: redirectUrl
            );
        }).ToList();

        _logger.LogInformation(
            "Supplier {SupplierId} fetched notifications — page {Page}/{TotalPages}, filter {Filter}, total {TotalCount}",
            supplierId, page, totalPages, filter, totalCount);

        return new PagedResult<SupplierNotificationDto>(
            items, page, pageSize, totalCount, totalPages);
    }

    /// <inheritdoc />
    public async Task<int> GetUnreadCountAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default)
    {
        // Reuse the existing repository method — it already filters by user
        // id and is the same query the admin notifications endpoint uses.
        return await _notificationRepository.GetUnreadCountAsync(supplierId, cancellationToken);
    }

    /// <inheritdoc />
    public async Task MarkAsReadAsync(
        Guid supplierId,
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        // The existing repository helper already enforces ownership:
        // it only updates the row when (Id == notificationId AND UserId ==
        // supplierId). A request for someone else's notification therefore
        // silently no-ops, which is the correct behaviour for IDOR safety.
        await _notificationRepository.MarkAsReadForUserAsync(
            notificationId, supplierId, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<int> MarkAllAsReadAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default)
    {
        return await _notificationRepository.MarkAllAsReadAsync(supplierId, cancellationToken);
    }
}
