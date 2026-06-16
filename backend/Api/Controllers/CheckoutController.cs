using Backend.Application.DTOs.Booking;
using Backend.Application.DTOs.Checkout;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Api.Controllers
{
    /// <summary>
    /// Staged customer checkout flow:
    /// Vehicle → Reservation → Driver Selection → Payment → Confirmation.
    ///
    /// The booking + payment records are created together by <c>POST /api/checkout</c>
    /// only after payment succeeds. The legacy <c>POST /api/bookings/create</c>
    /// endpoint is left untouched for the admin create-on-behalf flow.
    /// </summary>
    [ApiController]
    [Route("api/checkout")]
    [Authorize]
    public class CheckoutController : ControllerBase
    {
        private readonly ICheckoutService _checkoutService;
        private readonly IPaymentService _paymentService;
        private readonly ILogger<CheckoutController> _logger;

        public CheckoutController(
            ICheckoutService checkoutService,
            IPaymentService paymentService,
            ILogger<CheckoutController> logger)
        {
            _checkoutService = checkoutService;
            _paymentService = paymentService;
            _logger = logger;
        }

        /// <summary>
        /// Whether the customer may self-drive (has an approved driving license)
        /// and whether selecting a driver is therefore mandatory.
        /// </summary>
        [HttpGet("eligibility")]
        [ProducesResponseType(typeof(DriveEligibilityDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<DriveEligibilityDto>> GetEligibility(CancellationToken cancellationToken)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            return Ok(await _checkoutService.GetEligibilityAsync(userId.Value, cancellationToken));
        }

        /// <summary>
        /// Verified, available, active drivers for the supplied rental window,
        /// including the per-booking driver fee and nearby availability stats.
        /// </summary>
        [HttpGet("drivers")]
        [ProducesResponseType(typeof(AvailableDriversResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AvailableDriversResponse>> GetAvailableDrivers(
            [FromQuery] DateTime pickupDate,
            [FromQuery] DateTime returnDate,
            [FromQuery] Guid? bookingId,
            CancellationToken cancellationToken)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            var response = await _checkoutService.GetAvailableDriversAsync(pickupDate, returnDate, bookingId, cancellationToken);
            return Ok(response);
        }

        /// <summary>
        /// Completes checkout: validates the reservation + driver choice,
        /// processes payment, and atomically creates the booking + payment
        /// records. Returns the new booking reference.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(BookingResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<BookingResponse>> Checkout(
            [FromBody] CheckoutRequest request,
            CancellationToken cancellationToken)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();

            // Admins use the dedicated admin create-on-behalf flow, not customer checkout.
            if (User.IsInRole("Admin"))
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { Message = "Administrators cannot complete a customer checkout." });
            }

            var result = await _checkoutService.CheckoutAsync(request, userId.Value, cancellationToken);

            _logger.LogInformation(
                "Checkout completed. BookingId: {BookingId}, BookingNumber: {BookingNumber}, UserId: {UserId}",
                result.BookingId, result.BookingNumber, userId.Value);

            return CreatedAtAction(nameof(Checkout), new { id = result.BookingId }, result);
        }

        // ─── Staged checkout lifecycle (double-booking prevention) ───────────
        // Vehicle → Draft → DriverSelected → PaymentPending (held) → Confirmed.
        // Every step is persisted server-side so the funnel survives refreshes,
        // lost connections and errors (see the recovery endpoints below).

        /// <summary>Step 1 — create (or resume) a DRAFT booking. Does not reserve the vehicle.</summary>
        [HttpPost("draft")]
        [ProducesResponseType(typeof(CheckoutStateDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<CheckoutStateDto>> CreateDraft(
            [FromBody] CreateDraftRequest request, CancellationToken cancellationToken)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            return Ok(await _checkoutService.CreateDraftAsync(request, userId.Value, cancellationToken));
        }

        /// <summary>Step 2 — record the driver choice (DRIVER_SELECTED). Does not reserve the vehicle.</summary>
        [HttpPut("{bookingId:guid}/driver")]
        [ProducesResponseType(typeof(CheckoutStateDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<CheckoutStateDto>> SelectDriver(
            Guid bookingId, [FromBody] SelectCheckoutDriverRequest request, CancellationToken cancellationToken)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            return Ok(await _checkoutService.SelectDriverAsync(bookingId, request, userId.Value, cancellationToken));
        }

        /// <summary>
        /// Step 3 — enter payment: places a time-boxed hold on the vehicle
        /// (PAYMENT_PENDING). Returns 409 if another customer just reserved it.
        /// </summary>
        [HttpPost("{bookingId:guid}/payment")]
        [ProducesResponseType(typeof(CheckoutStateDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<CheckoutStateDto>> BeginPayment(
            Guid bookingId, CancellationToken cancellationToken)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            return Ok(await _checkoutService.BeginPaymentAsync(bookingId, userId.Value, cancellationToken));
        }

        /// <summary>Step 4 — confirm: capture payment and finalise (CONFIRMED).</summary>
        [HttpPost("{bookingId:guid}/confirm")]
        [ProducesResponseType(typeof(BookingResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<BookingResponse>> Confirm(
            Guid bookingId, [FromBody] ConfirmCheckoutRequest request, CancellationToken cancellationToken)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            var result = await _checkoutService.ConfirmAsync(bookingId, request, userId.Value, cancellationToken);
            _logger.LogInformation(
                "Checkout confirmed. BookingId: {BookingId}, BookingNumber: {BookingNumber}, UserId: {UserId}",
                result.BookingId, result.BookingNumber, userId.Value);
            return Ok(result);
        }

        /// <summary>Cancel an in-flight checkout (CANCELLED) and release any hold.</summary>
        [HttpPost("{bookingId:guid}/cancel")]
        [ProducesResponseType(typeof(CheckoutStateDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<CheckoutStateDto>> Cancel(
            Guid bookingId, CancellationToken cancellationToken)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            return Ok(await _checkoutService.CancelAsync(bookingId, userId.Value, cancellationToken));
        }

        /// <summary>
        /// Booking recovery — returns the caller's current resumable checkout
        /// (Draft / DriverSelected / non-expired PaymentPending) or 204 if none.
        /// </summary>
        [HttpGet("active")]
        [ProducesResponseType(typeof(CheckoutStateDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<CheckoutStateDto>> GetActive(CancellationToken cancellationToken)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();
            var state = await _checkoutService.GetActiveAsync(userId.Value, cancellationToken);
            if (state != null && state.Status == "PaymentPending")
            {
                var synced = await _paymentService.SyncPaymentStatusAsync(state.BookingId, userId.Value, cancellationToken);
                if (synced)
                    state = await _checkoutService.GetActiveAsync(userId.Value, cancellationToken);
            }
            return state is null ? NoContent() : Ok(state);
        }

        /// <summary>Booking recovery — checkout state for a specific booking the caller owns.</summary>
        [HttpGet("{bookingId:guid}")]
        [ProducesResponseType(typeof(CheckoutStateDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CheckoutStateDto>> GetState(Guid bookingId, CancellationToken cancellationToken)
        {
            var userId = TryGetUserId();
            if (userId is null) return Unauthorized();

            // Sync payment status with Paymob in case a webhook was missed
            await _paymentService.SyncPaymentStatusAsync(bookingId, userId.Value, cancellationToken);

            var state = await _checkoutService.GetStateAsync(bookingId, userId.Value, cancellationToken);
            return state is null ? NotFound() : Ok(state);
        }

        private Guid? TryGetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null) return null;
            return Guid.TryParse(claim.Value, out var id) ? id : null;
        }
    }
}
