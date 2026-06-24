namespace Backend.Application.DTOs.Booking;

/// <summary>
/// Request DTO for creating a new booking.
///
/// Positional parameter order is preserved from the original contract so
/// existing callers (including unit/property tests) continue to compile.
/// New optional fields are appended at the end.
///
/// PickupLocation / DropOffLocation are free-text labels that persist
/// directly onto the Booking entity (which stores locations as strings,
/// not FKs). When provided they take precedence over the legacy
/// *LocationId Guid fields.
///
/// CustomerUserId is optional and only honoured for admin-driven creation —
/// when present (and the caller is an Admin/Supplier) the booking is
/// created on behalf of the specified customer; otherwise the booking is
/// owned by the authenticated user.
/// </summary>
public record CreateBookingRequest(
    Guid VehicleId,
    Guid PickupLocationId,
    Guid DropOffLocationId,
    DateTime PickupDate,
    DateTime ReturnDate,
    Guid? DriverId,
    bool PayLater,
    string? PickupLocation = null,
    string? DropOffLocation = null,
    Guid? CustomerUserId = null,
    bool? NeedDriver = null,
    string? PaymentMethod = null);
