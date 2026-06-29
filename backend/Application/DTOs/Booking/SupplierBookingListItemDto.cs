namespace Backend.Application.DTOs.Booking;

/// <summary>
/// Row item returned by the Supplier Bookings list endpoint.
///
/// This is supplier-scoped — every row belongs to a vehicle whose
/// <c>UserId</c> matches the authenticated supplier. Field selection
/// mirrors the spec for <c>GET /api/supplier/bookings</c>: booking
/// number, customer name, vehicle info, dates, price, statuses and
/// created timestamp. Kept separate from <see cref="BookingListDto"/>
/// so the supplier portal contract can evolve without touching the
/// existing admin/customer booking list shape.
/// </summary>
public record SupplierBookingListItemDto(
    /// <summary>Primary key of the booking row.</summary>
    Guid BookingId,
    /// <summary>Human-readable booking number (e.g. BK-20260511-A1B2C).</summary>
    string BookingNumber,
    /// <summary>Concatenated customer first/last name; empty string if unknown.</summary>
    string CustomerName,
    /// <summary>Vehicle id (useful for deep links in the future).</summary>
    Guid VehicleId,
    /// <summary>Vehicle make (e.g. "Toyota").</summary>
    string VehicleMake,
    /// <summary>Vehicle model (e.g. "Corolla").</summary>
    string VehicleModel,
    /// <summary>Primary vehicle image url, or empty string if none.</summary>
    string VehicleImageUrl,
    /// <summary>Rental pickup date.</summary>
    DateTime PickupDate,
    /// <summary>Rental return date.</summary>
    DateTime ReturnDate,
    /// <summary>Total price for the booking (currency is project-wide USD).</summary>
    decimal TotalPrice,
    /// <summary>Current booking status (Pending / Confirmed / Active / Completed / Cancelled).</summary>
    string BookingStatus,
    /// <summary>Latest payment status for this booking, or "None" if no payment row exists.</summary>
    string PaymentStatus,
    DateTime CreatedAt,
    Guid? ApprovedBy = null,
    DateTime? ApprovedAt = null,
    string? RejectionReason = null);
