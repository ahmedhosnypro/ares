namespace Backend.Application.DTOs.Review;

/// <summary>
/// Body payload for creating or updating the supplier reply on a
/// review (<c>PUT /api/supplier/reviews/{reviewId}/reply</c>).
/// One reply per review — calling this endpoint again overwrites
/// the previous reply (this IS the edit operation).
/// </summary>
/// <param name="Reply">Reply text (1–2000 characters).</param>
public record SupplierReplyRequest(string Reply);
