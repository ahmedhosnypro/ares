using System;

namespace Backend.Application.DTOs.Checkout
{
    /// <summary>
    /// Drive-eligibility snapshot for the authenticated customer, consumed by
    /// the Driver Selection step. <see cref="DriverRequired"/> is the canonical
    /// signal the UI uses to disable the "Self Drive" option.
    /// </summary>
    public record DriveEligibilityDto(
        bool HasApprovedLicense,
        bool IdentityVerified,
        bool DriverRequired);

    /// <summary>
    /// A selectable driver in the checkout catalog (direct-pick model).
    /// PII-safe: exposes only public profile data plus the computed fee for
    /// the requested rental window. Mirrors <c>PublicDriverDto</c> and adds the
    /// experience + fee fields the selection card needs.
    /// </summary>
    public class AvailableDriverDto
    {
        public Guid DriverProfileId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public double AverageRating { get; set; }
        public int TotalTrips { get; set; }
        public int ExperienceYears { get; set; }
        public decimal DriverFee { get; set; }
    }

    /// <summary>
    /// Single-call checkout payload: reservation details + driver choice +
    /// payment method. The booking and payment records are created together
    /// only after payment succeeds, so a booking can never appear paid without
    /// a real payment row. All money is recomputed server-side — the client
    /// never supplies the amount.
    /// </summary>
    public record CheckoutRequest(
        Guid VehicleId,
        Guid PickupLocationId,
        Guid DropOffLocationId,
        DateTime PickupDate,
        DateTime ReturnDate,
        bool NeedDriver,
        Guid? DriverProfileId,
        string PaymentMethod,
        Guid? PaymentMethodId = null,
        string? PickupLocation = null,
        string? DropOffLocation = null);

    // ─── Staged checkout lifecycle (double-booking prevention) ───────────
    // The staged flow persists progress server-side so it survives refreshes,
    // lost connections and errors:
    //   Draft → DriverSelected → PaymentPending (vehicle held) → Confirmed.

    /// <summary>Step 1 — create a DRAFT booking from the selected vehicle + window.</summary>
    public record CreateDraftRequest(
        Guid VehicleId,
        DateTime PickupDate,
        DateTime ReturnDate,
        Guid PickupLocationId = default,
        Guid DropOffLocationId = default,
        string? PickupLocation = null,
        string? DropOffLocation = null);

    /// <summary>Step 2 — choose a driver (or self-drive). Does not reserve the vehicle.</summary>
    public record SelectCheckoutDriverRequest(
        bool NeedDriver,
        Guid? DriverProfileId = null);

    /// <summary>Step 4 — confirm: capture payment and finalise the booking.</summary>
    public record ConfirmCheckoutRequest(
        string PaymentMethod = "credit_card",
        Guid? PaymentMethodId = null);

    /// <summary>
    /// Server-authoritative snapshot of an in-flight (or completed) checkout.
    /// Returned by the staged endpoints and by the recovery endpoints so the UI
    /// can restore the funnel exactly where the customer left off — including a
    /// live hold countdown (<see cref="HoldSecondsRemaining"/>).
    /// </summary>
    public record CheckoutStateDto(
        Guid BookingId,
        string? BookingNumber,
        string Status,
        string Step,
        Guid VehicleId,
        string VehicleLabel,
        string? VehicleImageUrl,
        DateTime PickupDate,
        DateTime ReturnDate,
        string? PickupLocation,
        string? DropoffLocation,
        int TotalDays,
        decimal VehicleFee,
        bool RequiresDriver,
        Guid? DriverProfileId,
        string? DriverName,
        decimal? DriverFee,
        decimal GrandTotal,
        DateTime? HoldExpiresAt,
        int? HoldSecondsRemaining);
}
