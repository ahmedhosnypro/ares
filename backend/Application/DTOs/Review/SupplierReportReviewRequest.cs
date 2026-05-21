namespace Backend.Application.DTOs.Review;

/// <summary>
/// Body payload for flagging a review as inappropriate
/// (<c>POST /api/supplier/reviews/{reviewId}/report</c>).
///
/// No moderation pipeline yet — the request only sets the report
/// flag, reason and timestamp on the review row. Admins can act on
/// the data later through a separate moderation UI.
/// </summary>
/// <param name="Reason">Free-text reason supplied by the supplier (1–1000 characters).</param>
public record SupplierReportReviewRequest(string Reason);
