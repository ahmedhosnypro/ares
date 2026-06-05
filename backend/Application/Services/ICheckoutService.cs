using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Booking;
using Backend.Application.DTOs.Checkout;

namespace Backend.Application.Services
{
    /// <summary>
    /// Orchestrates the new staged booking flow:
    /// Vehicle → Reservation → Driver Selection → Payment → Confirmation.
    ///
    /// Unlike <see cref="IBookingService.CreateBookingAsync"/> (which creates a
    /// booking up-front and is still used by the admin create flow), this
    /// service creates the booking and payment records together, only after a
    /// successful payment. This guarantees a booking never appears
    /// paid/confirmed without a corresponding payment record.
    /// </summary>
    public interface ICheckoutService
    {
        /// <summary>
        /// Whether the authenticated customer may self-drive (holds an approved
        /// driving license) and whether a driver is therefore mandatory.
        /// </summary>
        Task<DriveEligibilityDto> GetEligibilityAsync(Guid userId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Verified, available drivers selectable for the supplied rental
        /// window, with the per-booking driver fee already computed.
        /// </summary>
        Task<IEnumerable<AvailableDriverDto>> GetAvailableDriversAsync(DateTime pickupDate, DateTime returnDate, CancellationToken cancellationToken = default);

        /// <summary>
        /// Validates the reservation + driver choice, processes payment, then
        /// atomically creates the booking + payment (+ driver assignment) and
        /// returns the new booking reference.
        /// </summary>
        Task<BookingResponse> CheckoutAsync(CheckoutRequest request, Guid userId, CancellationToken cancellationToken = default);

        // ─── Staged checkout lifecycle (double-booking prevention) ───────
        // These persist each step server-side so the funnel can be recovered
        // after a refresh / lost connection, and place a time-boxed hold on the
        // vehicle only at the payment step (PaymentPending).

        /// <summary>Step 1 — create (or reuse) a DRAFT booking. Does not reserve the vehicle.</summary>
        Task<CheckoutStateDto> CreateDraftAsync(CreateDraftRequest request, Guid userId, CancellationToken cancellationToken = default);

        /// <summary>Step 2 — record the driver choice (DRIVER_SELECTED). Does not reserve the vehicle.</summary>
        Task<CheckoutStateDto> SelectDriverAsync(Guid bookingId, SelectCheckoutDriverRequest request, Guid userId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Step 3 — enter payment: atomically place a time-boxed hold on the
        /// vehicle (PAYMENT_PENDING). Race-safe — a second customer hitting this
        /// for the same vehicle/window gets a 409 conflict.
        /// </summary>
        Task<CheckoutStateDto> BeginPaymentAsync(Guid bookingId, Guid userId, CancellationToken cancellationToken = default);

        /// <summary>Step 4 — confirm: capture payment and finalise (CONFIRMED). Re-checks the lock.</summary>
        Task<BookingResponse> ConfirmAsync(Guid bookingId, ConfirmCheckoutRequest request, Guid userId, CancellationToken cancellationToken = default);

        /// <summary>Cancel an in-flight checkout (CANCELLED) and release any hold.</summary>
        Task<CheckoutStateDto> CancelAsync(Guid bookingId, Guid userId, CancellationToken cancellationToken = default);

        /// <summary>Recovery — the caller's current resumable checkout (Draft/DriverSelected/active PaymentPending), or null.</summary>
        Task<CheckoutStateDto?> GetActiveAsync(Guid userId, CancellationToken cancellationToken = default);

        /// <summary>Recovery — the checkout state for a specific booking the caller owns, or null.</summary>
        Task<CheckoutStateDto?> GetStateAsync(Guid bookingId, Guid userId, CancellationToken cancellationToken = default);
    }
}
