namespace Backend.Application.DTOs.Review;

/// <summary>
/// Aggregate statistics returned by
/// <c>GET /api/supplier/reviews/statistics</c>. All numbers are
/// scoped to vehicles owned by the authenticated supplier.
/// </summary>
public record SupplierReviewStatisticsDto(
    /// <summary>Average rating across all reviews for the supplier's vehicles (0 when there are no reviews). Rounded to 2 decimal places.</summary>
    double AverageRating,
    /// <summary>Total number of reviews across the supplier's vehicles.</summary>
    int TotalReviews,
    /// <summary>Number of 5-star reviews.</summary>
    int FiveStarReviews,
    /// <summary>Number of reviews the supplier has not replied to yet.</summary>
    int PendingReplies);
