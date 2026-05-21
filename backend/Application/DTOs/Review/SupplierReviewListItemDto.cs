namespace Backend.Application.DTOs.Review;

/// <summary>
/// Row item returned by the Supplier Reviews list endpoint
/// (<c>GET /api/supplier/reviews</c>).
///
/// Supplier-scoped — every row belongs to a vehicle owned by the
/// authenticated supplier (<c>vehicle.UserId == supplierId</c>).
/// Mirrors the columns rendered on the supplier reviews table:
/// customer name, vehicle, rating, comment, review date, reply
/// status, and the existing supplier reply (so the table row can
/// be expanded inline without an extra fetch). Kept separate from
/// <see cref="ReviewDto"/> so the public reviews contract stays
/// untouched.
/// </summary>
public record SupplierReviewListItemDto(
    /// <summary>Primary key of the review row.</summary>
    Guid ReviewId,
    /// <summary>Booking the review is attached to.</summary>
    Guid BookingId,
    /// <summary>Customer id who wrote the review (for deep links).</summary>
    Guid CustomerId,
    /// <summary>Concatenated customer first/last name; empty string when unknown.</summary>
    string CustomerName,
    /// <summary>Reviewed vehicle id.</summary>
    Guid VehicleId,
    /// <summary>Vehicle make (e.g. "Toyota").</summary>
    string VehicleMake,
    /// <summary>Vehicle model (e.g. "Corolla").</summary>
    string VehicleModel,
    /// <summary>Vehicle model year (nullable when the underlying row has no year).</summary>
    int? VehicleYear,
    /// <summary>Primary vehicle image url, or empty string when none.</summary>
    string VehicleImageUrl,
    /// <summary>1–5 rating given by the customer; 0 when the customer left no rating.</summary>
    int Rating,
    /// <summary>Customer comment; null when the customer left no comment.</summary>
    string? Comment,
    /// <summary>UTC timestamp the customer submitted the review.</summary>
    DateTime CreatedAt,
    /// <summary>Reply written by the supplier, or null when not replied yet.</summary>
    string? SupplierReply,
    /// <summary>UTC timestamp the supplier reply was last saved; null when not replied.</summary>
    DateTime? RepliedAt,
    /// <summary>Convenience flag — true when <see cref="SupplierReply"/> is non-empty.</summary>
    bool HasReply,
    /// <summary>True when the supplier flagged this review as inappropriate.</summary>
    bool IsReported,
    /// <summary>Reason the supplier supplied when reporting; null when not reported.</summary>
    string? ReportReason,
    /// <summary>UTC timestamp the supplier reported the review; null when not reported.</summary>
    DateTime? ReportedAt);
