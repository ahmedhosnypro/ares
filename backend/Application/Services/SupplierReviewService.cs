using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Review;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services;

/// <summary>
/// Default implementation of <see cref="ISupplierReviewService"/>.
///
/// Design notes (mirrors the conventions used by
/// <see cref="SupplierVehicleService"/> and
/// <see cref="SupplierBookingService"/>):
///   * Every query filters by <c>r.Vehicle.UserId == supplierId</c>
///     at the SQL level — ownership is never relaxed later in code.
///   * Reads are <c>AsNoTracking</c>; writes re-fetch the row via the
///     tracked context so EF can detect property changes.
///   * On a not-found-or-wrong-owner lookup we throw
///     <see cref="NotFoundException"/> rather than 403 to avoid
///     leaking the existence of reviews belonging to other suppliers.
///   * Statistics are computed server-side in a single round-trip so
///     suppliers with thousands of reviews don't pull the whole table
///     into memory.
/// </summary>
public class SupplierReviewService : ISupplierReviewService
{
    private const string SortNewest = "newest";
    private const string SortOldest = "oldest";
    private const string SortHighest = "highest";
    private const string SortLowest = "lowest";

    private const string ReplyStatusReplied = "replied";
    private const string ReplyStatusUnreplied = "unreplied";

    private readonly IApplicationDbContext _context;
    private readonly IReviewRepository _reviewRepository;
    private readonly ILogger<SupplierReviewService> _logger;
    private readonly INotificationService? _notificationService;

    public SupplierReviewService(
        IApplicationDbContext context,
        IReviewRepository reviewRepository,
        ILogger<SupplierReviewService> logger,
        INotificationService? notificationService = null)
    {
        _context = context;
        _reviewRepository = reviewRepository;
        _logger = logger;
        _notificationService = notificationService;
    }

    /// <inheritdoc />
    public async Task<PagedResult<SupplierReviewListItemDto>> GetReviewsAsync(
        Guid supplierId,
        int page,
        int pageSize,
        SupplierReviewListFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        // ── Defensive paging bounds (same conventions as sibling services) ───
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        // ── Base query — ownership enforced here, never relaxed below ────────
        var query = _context.Reviews
            .AsNoTracking()
            .Where(r => r.Vehicle != null && r.Vehicle.UserId == supplierId);

        // ── Vehicle filter ───────────────────────────────────────────────────
        if (filter.VehicleId.HasValue && filter.VehicleId.Value != Guid.Empty)
        {
            var vehicleId = filter.VehicleId.Value;
            query = query.Where(r => r.VehicleId == vehicleId);
        }

        // ── Rating filter (1–5; out-of-range values silently ignored) ────────
        if (filter.Rating.HasValue && filter.Rating.Value >= 1 && filter.Rating.Value <= 5)
        {
            var rating = filter.Rating.Value;
            query = query.Where(r => r.Rating == rating);
        }

        // ── Reply status filter (case-insensitive) ───────────────────────────
        if (!string.IsNullOrWhiteSpace(filter.ReplyStatus))
        {
            var status = filter.ReplyStatus.Trim().ToLowerInvariant();
            if (status == ReplyStatusReplied)
            {
                query = query.Where(r => r.SupplierReply != null && r.SupplierReply != "");
            }
            else if (status == ReplyStatusUnreplied)
            {
                query = query.Where(r => r.SupplierReply == null || r.SupplierReply == "");
            }
        }

        // ── Date range filter (CreatedAt — UTC) ──────────────────────────────
        if (filter.FromDate.HasValue)
        {
            var from = filter.FromDate.Value;
            query = query.Where(r => r.CreatedAt >= from);
        }

        if (filter.ToDate.HasValue)
        {
            // Inclusive upper-bound: callers typically pass a plain date,
            // so we widen by one day to include reviews created on that day.
            var toExclusive = filter.ToDate.Value.Date.AddDays(1);
            query = query.Where(r => r.CreatedAt < toExclusive);
        }

        // ── Sorting ──────────────────────────────────────────────────────────
        var sortKey = string.IsNullOrWhiteSpace(filter.SortBy)
            ? SortNewest
            : filter.SortBy.Trim().ToLowerInvariant();

        query = sortKey switch
        {
            SortOldest => query.OrderBy(r => r.CreatedAt),
            SortHighest => query.OrderByDescending(r => r.Rating).ThenByDescending(r => r.CreatedAt),
            SortLowest => query.OrderBy(r => r.Rating).ThenByDescending(r => r.CreatedAt),
            _ => query.OrderByDescending(r => r.CreatedAt),
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        var skip = (page - 1) * pageSize;

        var rawRows = await query
            .Skip(skip)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id,
                r.BookingId,
                r.UserId,
                UserFirstName = r.User != null ? r.User.FirstName : null,
                UserLastName = r.User != null ? r.User.LastName : null,
                r.VehicleId,
                VehicleMake = r.Vehicle != null ? r.Vehicle.Make : null,
                VehicleModel = r.Vehicle != null ? r.Vehicle.Model : null,
                VehicleYear = r.Vehicle != null ? (int?)r.Vehicle.Year : null,
                VehicleImageUrl = r.Vehicle != null
                    ? (r.Vehicle.Images.Where(i => i.IsPrimary).Select(i => i.ImageUrl).FirstOrDefault()
                        ?? r.Vehicle.Images.Select(i => i.ImageUrl).FirstOrDefault()
                        ?? string.Empty)
                    : string.Empty,
                Rating = r.Rating ?? 0,
                r.Comment,
                r.CreatedAt,
                r.SupplierReply,
                r.RepliedAt,
                r.IsReported,
                r.ReportReason,
                r.ReportedAt
            })
            .ToListAsync(cancellationToken);

        var pageRows = rawRows.Select(r =>
        {
            var firstName = r.UserFirstName ?? string.Empty;
            var lastName = r.UserLastName ?? string.Empty;
            var fullName = $"{firstName} {lastName}".Trim();

            return new SupplierReviewListItemDto(
                r.Id,
                r.BookingId,
                r.UserId,
                fullName,
                r.VehicleId,
                r.VehicleMake ?? string.Empty,
                r.VehicleModel ?? string.Empty,
                r.VehicleYear,
                r.VehicleImageUrl,
                r.Rating,
                r.Comment,
                r.CreatedAt,
                r.SupplierReply,
                r.RepliedAt,
                !string.IsNullOrEmpty(r.SupplierReply),
                r.IsReported,
                r.ReportReason,
                r.ReportedAt);
        }).ToList();

        return new PagedResult<SupplierReviewListItemDto>(
            pageRows,
            page,
            pageSize,
            totalCount,
            totalPages);
    }

    /// <inheritdoc />
    public async Task<SupplierReviewStatisticsDto> GetStatisticsAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default)
    {
        // ── Owned-reviews base query (ownership enforced once) ───────────────
        // Re-used for every aggregate below — server-side counted, not
        // materialised, so the supplier's whole review history is never
        // pulled into memory regardless of how many rows exist.
        var owned = _context.Reviews
            .AsNoTracking()
            .Where(r => r.Vehicle != null && r.Vehicle.UserId == supplierId);

        var totalReviews = await owned.CountAsync(cancellationToken);

        if (totalReviews == 0)
        {
            return new SupplierReviewStatisticsDto(0d, 0, 0, 0);
        }

        // Cast to double? so EF emits AVG(CAST(Rating AS float)) and we can
        // ??-coalesce a null result (happens when every Rating is null —
        // theoretically possible since Rating is nullable on the entity).
        var average = await owned
            .Where(r => r.Rating.HasValue)
            .AverageAsync(r => (double?)r.Rating, cancellationToken) ?? 0d;

        var fiveStar = await owned.CountAsync(r => r.Rating == 5, cancellationToken);

        var pending = await owned
            .CountAsync(r => r.SupplierReply == null || r.SupplierReply == "", cancellationToken);

        var averageRounded = Math.Round(average, 2, MidpointRounding.AwayFromZero);

        return new SupplierReviewStatisticsDto(
            averageRounded,
            totalReviews,
            fiveStar,
            pending);
    }

    /// <inheritdoc />
    public async Task<SupplierReviewListItemDto> SaveReplyAsync(
        Guid supplierId,
        Guid reviewId,
        SupplierReplyRequest request,
        CancellationToken cancellationToken = default)
    {
        var review = await LoadOwnedReviewAsync(supplierId, reviewId, cancellationToken);

        review.SupplierReply = request.Reply?.Trim();
        review.RepliedAt = DateTime.UtcNow;
        review.UpdatedAt = DateTime.UtcNow;

        await _reviewRepository.UpdateAsync(review, cancellationToken);
        await _reviewRepository.SaveChangesAsync(cancellationToken);

        // Notify the customer that the supplier has replied to their review
        if (_notificationService is not null)
        {
            try
            {
                var vehicleLabel = string.IsNullOrWhiteSpace(review.Vehicle?.Make) && string.IsNullOrWhiteSpace(review.Vehicle?.Model)
                    ? "a vehicle"
                    : $"{review.Vehicle?.Make} {review.Vehicle?.Model}".Trim();

                await _notificationService.CreateNotificationAsync(
                    review.UserId,
                    "Supplier replied to your review",
                    $"The supplier has replied to your review for {vehicleLabel}.",
                    $"SupplierReply:{review.BookingId}",
                    cancellationToken);
            }
            catch
            {
                // Best-effort only
            }
        }

        _logger.LogInformation(
            "Supplier {SupplierId} saved reply on review {ReviewId}",
            supplierId,
            reviewId);

        return await ProjectReviewAsync(supplierId, reviewId, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<SupplierReviewListItemDto> ReportReviewAsync(
        Guid supplierId,
        Guid reviewId,
        SupplierReportReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        var review = await LoadOwnedReviewAsync(supplierId, reviewId, cancellationToken);

        review.IsReported = true;
        review.ReportReason = request.Reason?.Trim();
        review.ReportedAt = DateTime.UtcNow;
        review.UpdatedAt = DateTime.UtcNow;

        await _reviewRepository.UpdateAsync(review, cancellationToken);
        await _reviewRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Supplier {SupplierId} reported review {ReviewId}",
            supplierId,
            reviewId);

        return await ProjectReviewAsync(supplierId, reviewId, cancellationToken);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Loads a single tracked review but only if its related vehicle is
    /// owned by <paramref name="supplierId"/>. Throws
    /// <see cref="NotFoundException"/> otherwise — never 403, to avoid
    /// leaking other suppliers' review ids.
    ///
    /// Uses <see cref="IApplicationDbContext.Reviews"/> (which is backed by
    /// the EF <c>DbSet&lt;Review&gt;</c>) so the returned entity is tracked
    /// and a subsequent <c>SaveChangesAsync</c> picks up property changes.
    /// </summary>
    private async Task<Review> LoadOwnedReviewAsync(
        Guid supplierId,
        Guid reviewId,
        CancellationToken cancellationToken)
    {
        var review = await _context.Reviews
            .FirstOrDefaultAsync(
                r => r.Id == reviewId && r.Vehicle != null && r.Vehicle.UserId == supplierId,
                cancellationToken);

        if (review is null)
        {
            throw new NotFoundException($"Review with ID {reviewId} not found");
        }

        return review;
    }

    /// <summary>
    /// Re-projects a single review row through the same shape used by the
    /// list endpoint so the supplier UI can update its local state with
    /// the canonical server response after a write.
    /// </summary>
    private async Task<SupplierReviewListItemDto> ProjectReviewAsync(
        Guid supplierId,
        Guid reviewId,
        CancellationToken cancellationToken)
    {
        var rawRow = await _context.Reviews
            .AsNoTracking()
            .Where(r => r.Id == reviewId && r.Vehicle != null && r.Vehicle.UserId == supplierId)
            .Select(r => new
            {
                r.Id,
                r.BookingId,
                r.UserId,
                UserFirstName = r.User != null ? r.User.FirstName : null,
                UserLastName = r.User != null ? r.User.LastName : null,
                r.VehicleId,
                VehicleMake = r.Vehicle != null ? r.Vehicle.Make : null,
                VehicleModel = r.Vehicle != null ? r.Vehicle.Model : null,
                VehicleYear = r.Vehicle != null ? (int?)r.Vehicle.Year : null,
                VehicleImageUrl = r.Vehicle != null
                    ? (r.Vehicle.Images.Where(i => i.IsPrimary).Select(i => i.ImageUrl).FirstOrDefault()
                        ?? r.Vehicle.Images.Select(i => i.ImageUrl).FirstOrDefault()
                        ?? string.Empty)
                    : string.Empty,
                Rating = r.Rating ?? 0,
                r.Comment,
                r.CreatedAt,
                r.SupplierReply,
                r.RepliedAt,
                r.IsReported,
                r.ReportReason,
                r.ReportedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        // Should be impossible — we just saved the row — but defend against
        // a concurrent delete just in case.
        if (rawRow is null)
        {
            throw new NotFoundException($"Review with ID {reviewId} not found");
        }

        var firstName = rawRow.UserFirstName ?? string.Empty;
        var lastName = rawRow.UserLastName ?? string.Empty;
        var fullName = $"{firstName} {lastName}".Trim();

        return new SupplierReviewListItemDto(
            rawRow.Id,
            rawRow.BookingId,
            rawRow.UserId,
            fullName,
            rawRow.VehicleId,
            rawRow.VehicleMake ?? string.Empty,
            rawRow.VehicleModel ?? string.Empty,
            rawRow.VehicleYear,
            rawRow.VehicleImageUrl,
            rawRow.Rating,
            rawRow.Comment,
            rawRow.CreatedAt,
            rawRow.SupplierReply,
            rawRow.RepliedAt,
            !string.IsNullOrEmpty(rawRow.SupplierReply),
            rawRow.IsReported,
            rawRow.ReportReason,
            rawRow.ReportedAt);
    }
}
