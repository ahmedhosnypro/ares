namespace Backend.Application.DTOs.Booking;

/// <summary>
/// Detailed booking view returned by <c>GET /api/supplier/bookings/{id}</c>.
///
/// Read-only by design — the supplier portal does not yet allow
/// approve / reject / edit operations on bookings. Anything not
/// needed for the view-only screen is intentionally omitted to keep
/// the payload small.
/// </summary>
public record SupplierBookingDetailsDto(
    // ── Booking ──────────────────────────────────────────────────
    Guid BookingId,
    string BookingNumber,
    DateTime CreatedAt,
    DateTime PickupDate,
    DateTime ReturnDate,
    int? TotalDays,
    decimal TotalPrice,
    string BookingStatus,
    string? PickupLocation,
    string? DropoffLocation,

    // ── Customer ─────────────────────────────────────────────────
    Guid CustomerId,
    string CustomerName,
    string? CustomerEmail,
    string? CustomerPhone,

    // ── Vehicle ──────────────────────────────────────────────────
    Guid VehicleId,
    string VehicleMake,
    string VehicleModel,
    int? VehicleYear,
    string? VehicleLicensePlate,
    string VehicleImageUrl,

    // ── Payment (best-known snapshot from latest BookingPayment) ─
    string PaymentStatus,
    string? PaymentMethod,
    decimal? PaymentAmount,
    string? PaymentCurrency,
    DateTime? PaymentProcessedAt,
    Guid? ApprovedBy = null,
    DateTime? ApprovedAt = null,
    string? RejectionReason = null);
