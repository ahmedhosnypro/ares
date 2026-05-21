namespace Backend.Application.DTOs.Review;

/// <summary>
/// Filter / search payload for <c>GET /api/supplier/reviews</c>.
///
/// All fields are optional. Filters compose with each other.
///
/// <list type="bullet">
/// <item><description><c>VehicleId</c> — limit to a specific vehicle owned by the supplier.</description></item>
/// <item><description><c>Rating</c> — exact rating filter (1–5); other values are ignored.</description></item>
/// <item><description><c>ReplyStatus</c> — "replied" / "unreplied" / null. Case-insensitive.</description></item>
/// <item><description><c>FromDate</c> / <c>ToDate</c> — UTC review-creation date range (inclusive lower bound, exclusive upper bound + 1 day so callers can pass plain dates).</description></item>
/// <item><description><c>SortBy</c> — "newest" (default) / "oldest" / "highest" / "lowest". Case-insensitive.</description></item>
/// </list>
/// </summary>
public record SupplierReviewListFilterRequest(
    Guid? VehicleId,
    int? Rating,
    string? ReplyStatus,
    DateTime? FromDate,
    DateTime? ToDate,
    string? SortBy);
