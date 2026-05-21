using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Review;

namespace Backend.Application.Services;

/// <summary>
/// Supplier-scoped reviews service for the
/// <c>/supplier/reviews</c> dashboard.
///
/// Every method takes the authenticated supplier id explicitly and
/// guarantees the caller can only see / mutate reviews whose related
/// vehicle is owned by that supplier
/// (<c>review.Vehicle.UserId == supplierId</c>).
///
/// Kept separate from <see cref="IReviewService"/> so the existing
/// customer review create / edit / read flow stays untouched.
/// Suppliers can never delete reviews and cannot modify the
/// customer-authored <c>Rating</c> / <c>Comment</c> fields — those
/// rules are enforced by NOT exposing the corresponding operations
/// on this interface.
/// </summary>
public interface ISupplierReviewService
{
    /// <summary>
    /// Returns a paginated, filtered, sorted list of reviews for the
    /// supplier's own vehicles.
    /// </summary>
    Task<PagedResult<SupplierReviewListItemDto>> GetReviewsAsync(
        Guid supplierId,
        int page,
        int pageSize,
        SupplierReviewListFilterRequest filter,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Aggregate review statistics for the authenticated supplier.
    /// All numbers are computed in a single SQL round-trip.
    /// </summary>
    Task<SupplierReviewStatisticsDto> GetStatisticsAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates or updates the supplier reply on a single review.
    /// Idempotent — calling this twice with the same payload is fine,
    /// the second call simply overwrites the existing reply and
    /// refreshes <c>RepliedAt</c>. Throws
    /// <see cref="Backend.Application.Exceptions.NotFoundException"/>
    /// if the review does not exist or is not owned by the supplier
    /// (we don't differentiate to avoid leaking review ids belonging
    /// to other suppliers).
    /// </summary>
    Task<SupplierReviewListItemDto> SaveReplyAsync(
        Guid supplierId,
        Guid reviewId,
        SupplierReplyRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Reports a review as inappropriate. Reporting an already-reported
    /// review overwrites the reason and timestamp — there is no
    /// moderation pipeline yet, so re-reporting is a harmless update.
    /// </summary>
    Task<SupplierReviewListItemDto> ReportReviewAsync(
        Guid supplierId,
        Guid reviewId,
        SupplierReportReviewRequest request,
        CancellationToken cancellationToken = default);
}
