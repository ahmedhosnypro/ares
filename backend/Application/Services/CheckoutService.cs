using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Booking;
using Backend.Application.DTOs.Checkout;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Backend.Application.Services
{
    /// <summary>
    /// Implements the staged booking/checkout flow. See <see cref="ICheckoutService"/>.
    /// All repositories injected here resolve to the same scoped DbContext, so a
    /// single SaveChanges commits the booking, payment and driver-assignment
    /// changes atomically.
    /// </summary>
    public class CheckoutService : ICheckoutService
    {
        private static readonly ConcurrentDictionary<Guid, SemaphoreSlim> _userLocks = new();

        private readonly IBookingRepository _bookingRepository;
        private readonly IVehicleRepository _vehicleRepository;
        private readonly IPaymentRepository _paymentRepository;
        private readonly IDriverProfileRepository _driverProfileRepository;
        private readonly IDriverReviewRepository _driverReviewRepository;
        private readonly IDriverPricingService _driverPricingService;
        private readonly IVerificationService _verificationService;
        private readonly INotificationService? _notificationService;
        private readonly IApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        /// <summary>Default vehicle-hold duration if none is configured.</summary>
        public const int DefaultHoldMinutes = 10;

        public CheckoutService(
            IBookingRepository bookingRepository,
            IVehicleRepository vehicleRepository,
            IPaymentRepository paymentRepository,
            IDriverProfileRepository driverProfileRepository,
            IDriverReviewRepository driverReviewRepository,
            IDriverPricingService driverPricingService,
            IVerificationService verificationService,
            IApplicationDbContext context,
            IConfiguration configuration,
            INotificationService? notificationService = null)
        {
            _bookingRepository = bookingRepository;
            _vehicleRepository = vehicleRepository;
            _paymentRepository = paymentRepository;
            _driverProfileRepository = driverProfileRepository;
            _driverReviewRepository = driverReviewRepository;
            _driverPricingService = driverPricingService;
            _verificationService = verificationService;
            _context = context;
            _configuration = configuration;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Configurable hold duration (minutes). Read from
        /// <c>Booking:HoldMinutes</c>; defaults to <see cref="DefaultHoldMinutes"/>.
        /// </summary>
        private int HoldMinutes
        {
            get
            {
                var configured = _configuration.GetValue<int?>("Booking:HoldMinutes");
                return configured is > 0 ? configured.Value : DefaultHoldMinutes;
            }
        }

        public async Task<DriveEligibilityDto> GetEligibilityAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var hasApprovedLicense = await HasApprovedLicenseAsync(userId, cancellationToken);
            var identityVerified = await _verificationService.IsApprovedAsync(userId, cancellationToken);
            return new DriveEligibilityDto(
                HasApprovedLicense: hasApprovedLicense,
                IdentityVerified: identityVerified,
                DriverRequired: !hasApprovedLicense);
        }

        public async Task<IEnumerable<AvailableDriverDto>> GetAvailableDriversAsync(
            DateTime pickupDate,
            DateTime returnDate,
            CancellationToken cancellationToken = default)
        {
            if (pickupDate >= returnDate)
            {
                throw new ValidationException("DateRange", "Pickup date must be before return date");
            }

            var totalDays = CalculateDays(pickupDate, returnDate);
            var dailyRate = await _driverPricingService.GetDailyRateAsync(cancellationToken);
            var driverFee = dailyRate * totalDays;

            var profiles = await _driverProfileRepository.GetAvailableDriversForWindowAsync(pickupDate, returnDate, cancellationToken);

            var result = new List<AvailableDriverDto>();
            foreach (var p in profiles)
            {
                var (avgRating, totalTrips) = await _driverReviewRepository.GetDriverRatingStatsAsync(p.Id, cancellationToken);
                var experienceYears = Math.Max(0, (int)((DateTime.UtcNow - p.CreatedAt).TotalDays / 365));

                result.Add(new AvailableDriverDto
                {
                    DriverProfileId = p.Id,
                    FirstName = p.User?.FirstName,
                    LastName = p.User?.LastName,
                    ProfilePictureUrl = p.User?.ProfileImage,
                    AverageRating = avgRating,
                    TotalTrips = totalTrips,
                    ExperienceYears = experienceYears,
                    DriverFee = driverFee
                });
            }

            return result;
        }

        public async Task<BookingResponse> CheckoutAsync(
            CheckoutRequest request,
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            // ── Identity-verification gate (same rule as booking creation) ───
            var isApproved = await _verificationService.IsApprovedAsync(userId, cancellationToken);
            if (!isApproved)
            {
                throw new ForbiddenException(BookingService.IdentityVerificationRequiredMessage);
            }

            // ── Reservation validation ───────────────────────────────────────
            if (request.PickupDate >= request.ReturnDate)
            {
                throw new ValidationException("DateRange", "Pickup date must be before return date");
            }

            var isAvailable = await _vehicleRepository.IsAvailableAsync(
                request.VehicleId, request.PickupDate, request.ReturnDate, cancellationToken);
            if (!isAvailable)
            {
                throw new ConflictException("Vehicle is not available for the selected dates");
            }

            var vehicle = await _vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);
            if (vehicle == null)
            {
                throw new NotFoundException($"Vehicle with ID {request.VehicleId} not found");
            }
            if (!vehicle.IsActive)
            {
                throw new ConflictException("Vehicle is not available for booking");
            }
            if (vehicle.UserId == userId)
            {
                throw new ForbiddenException("Suppliers are not allowed to book their own vehicles.");
            }

            var totalDays = CalculateDays(request.PickupDate, request.ReturnDate);
            var vehicleFee = (vehicle.PricePerDay ?? 0) * totalDays;

            // ── Mandatory-driver rule (business rule 13) ─────────────────────
            var hasApprovedLicense = await HasApprovedLicenseAsync(userId, cancellationToken);
            var effectiveNeedDriver = request.NeedDriver;
            if (!hasApprovedLicense)
            {
                if (!request.NeedDriver)
                {
                    throw new BadRequestException(
                        "A driver is required: you do not have an approved driving license, so you cannot self-drive.");
                }
                effectiveNeedDriver = true;
            }

            // ── Driver resolution / eligibility / overlap ────────────────────
            DriverProfile? driverProfile = null;
            decimal driverFee = 0m;
            if (effectiveNeedDriver)
            {
                if (!request.DriverProfileId.HasValue)
                {
                    throw new BadRequestException("Please select a driver before completing payment.");
                }

                driverProfile = await _driverProfileRepository.GetByIdWithUserAsync(request.DriverProfileId.Value, cancellationToken);
                if (driverProfile == null)
                {
                    throw new NotFoundException("Selected driver was not found.");
                }
                if (driverProfile.Status != DriverProfileStatus.Verified
                    || !driverProfile.IsActive
                    || driverProfile.Availability != DriverAvailability.Available)
                {
                    throw new BadRequestException("The selected driver is no longer available. Please choose another driver.");
                }

                var overlaps = await _driverProfileRepository.HasOverlappingAssignmentAsync(
                    driverProfile.Id, request.PickupDate, request.ReturnDate, null, cancellationToken);
                if (overlaps)
                {
                    throw new BadRequestException("The selected driver is already booked for an overlapping period. Please choose another driver.");
                }

                var dailyRate = await _driverPricingService.GetDailyRateAsync(cancellationToken);
                driverFee = dailyRate * totalDays;
            }

            var grandTotal = vehicleFee + driverFee;

            // ── Resolve pickup / dropoff labels (free-text wins over the id) ──
            var pickupLabel = !string.IsNullOrWhiteSpace(request.PickupLocation)
                ? request.PickupLocation!.Trim()
                : (request.PickupLocationId != Guid.Empty ? request.PickupLocationId.ToString() : null);
            var dropoffLabel = !string.IsNullOrWhiteSpace(request.DropOffLocation)
                ? request.DropOffLocation!.Trim()
                : (request.DropOffLocationId != Guid.Empty ? request.DropOffLocationId.ToString() : null);

            // ── Process payment (simulated gateway — mirrors PaymentService) ──
            var paymentSuccessful = await SimulatePaymentAsync(cancellationToken);
            if (!paymentSuccessful)
            {
                throw new BadRequestException("Payment processing failed. Please try again.");
            }

            // ── Create booking (Confirmed — payment captured) ────────────────
            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                BookingNumber = GenerateUniqueBookingNumber(),
                UserId = userId,
                VehicleId = vehicle.Id,
                PickupDate = request.PickupDate,
                ReturnDate = request.ReturnDate,
                PickupLocation = pickupLabel,
                DropoffLocation = dropoffLabel,
                TotalDays = totalDays,
                VehicleFee = vehicleFee,
                DriverFee = effectiveNeedDriver ? driverFee : (decimal?)null,
                GrandTotal = grandTotal,
                TotalPrice = grandTotal,
                RequiresDriver = effectiveNeedDriver,
                AssignedDriverProfileId = effectiveNeedDriver ? driverProfile!.Id : (Guid?)null,
                DriverLockedUntil = effectiveNeedDriver ? request.ReturnDate : (DateTime?)null,
                // Legacy customer-license Driver FK is never set here.
                Status = BookingStatus.Confirmed
            };
            await _bookingRepository.AddAsync(booking, cancellationToken);

            // ── Create payment record (Captured) ─────────────────────────────
            var payment = new BookingPayment
            {
                PaymentId = Guid.NewGuid(),
                BookingId = booking.Id,
                TransactionId = Guid.NewGuid(),
                PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? "credit_card" : request.PaymentMethod,
                Amount = grandTotal,
                Currency = "USD",
                Status = "Captured",
                AuthorizationCode = GenerateAuthorizationCode(),
                ProcessedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            await _paymentRepository.AddAsync(payment, cancellationToken);

            // ── Lock the driver for the rental window ────────────────────────
            if (effectiveNeedDriver && driverProfile != null)
            {
                driverProfile.Availability = DriverAvailability.Reserved;
                driverProfile.LockedUntil = request.ReturnDate;
                await _driverProfileRepository.UpdateAsync(driverProfile, cancellationToken);
            }

            // ── Race-safe commit ─────────────────────────────────────────────
            // The booking, payment and driver-profile changes are staged on the
            // shared DbContext. ReserveVehicleAtomicAsync re-checks for an
            // overlapping reservation under a SERIALIZABLE / UPDLOCK+HOLDLOCK
            // lock and then commits them all in one transaction, so two
            // simultaneous checkouts can never both confirm the same vehicle —
            // the loser receives a 409 ("just been reserved by another customer").
            await _bookingRepository.ReserveVehicleAtomicAsync(
                booking, BookingStatus.Confirmed, null, null, cancellationToken);

            await SendBestEffortNotificationsAsync(booking, vehicle, driverProfile, cancellationToken);

            return new BookingResponse(
                booking.Id,
                booking.BookingNumber!,
                BookingStatus.Confirmed.ToString(),
                grandTotal,
                "Booking confirmed and payment captured successfully.");
        }

        // ── Staged checkout lifecycle ─────────────────────────────────────────

        public async Task<CheckoutStateDto> CreateDraftAsync(
            CreateDraftRequest request, Guid userId, CancellationToken cancellationToken = default)
        {
            var userLock = _userLocks.GetOrAdd(userId, _ => new SemaphoreSlim(1, 1));
            await userLock.WaitAsync(cancellationToken);
            try
            {
                if (request.PickupDate >= request.ReturnDate)
                {
                    throw new ValidationException("DateRange", "Pickup date must be before return date");
                }

                var vehicle = await _vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken)
                    ?? throw new NotFoundException($"Vehicle with ID {request.VehicleId} not found");
                if (!vehicle.IsActive)
                {
                    throw new ConflictException("Vehicle is not available for booking");
                }
                if (vehicle.UserId == userId)
                {
                    throw new ForbiddenException("Suppliers are not allowed to book their own vehicles.");
                }

                // Idempotent: if the customer already has a DRAFT for the very same
                // vehicle + window, resume it instead of piling up duplicate drafts.
                var existing = await FindResumableBookingAsync(userId, cancellationToken);
                if (existing != null
                    && existing.Status == BookingStatus.Draft
                    && existing.VehicleId == request.VehicleId
                    && existing.PickupDate == request.PickupDate
                    && existing.ReturnDate == request.ReturnDate)
                {
                    return await BuildStateAsync(existing, cancellationToken);
                }

                var totalDays = CalculateDays(request.PickupDate, request.ReturnDate);
                var vehicleFee = (vehicle.PricePerDay ?? 0) * totalDays;

                var pickupLabel = !string.IsNullOrWhiteSpace(request.PickupLocation)
                    ? request.PickupLocation!.Trim()
                    : (request.PickupLocationId != Guid.Empty ? request.PickupLocationId.ToString() : null);
                var dropoffLabel = !string.IsNullOrWhiteSpace(request.DropOffLocation)
                    ? request.DropOffLocation!.Trim()
                    : (request.DropOffLocationId != Guid.Empty ? request.DropOffLocationId.ToString() : null);

                var booking = new Booking
                {
                    Id = Guid.NewGuid(),
                    BookingNumber = GenerateUniqueBookingNumber(),
                    UserId = userId,
                    VehicleId = vehicle.Id,
                    PickupDate = request.PickupDate,
                    ReturnDate = request.ReturnDate,
                    PickupLocation = pickupLabel,
                    DropoffLocation = dropoffLabel,
                    TotalDays = totalDays,
                    VehicleFee = vehicleFee,
                    GrandTotal = vehicleFee,
                    TotalPrice = vehicleFee,
                    RequiresDriver = false,
                    Status = BookingStatus.Draft // DRAFT does NOT reserve the vehicle
                };
                await _bookingRepository.AddAsync(booking, cancellationToken);
                await _bookingRepository.SaveChangesAsync(cancellationToken);

                booking.Vehicle = vehicle; // for state projection
                return await BuildStateAsync(booking, cancellationToken);
            }
            finally
            {
                userLock.Release();
            }
        }


        public async Task<CheckoutStateDto> SelectDriverAsync(
            Guid bookingId, SelectCheckoutDriverRequest request, Guid userId, CancellationToken cancellationToken = default)
        {
            var booking = await LoadOwnedResumableAsync(bookingId, userId, cancellationToken);
            if (booking.Status == BookingStatus.PaymentPending)
            {
                throw new ConflictException("The vehicle is already held for payment. Cancel the hold to change the driver.");
            }

            var totalDays = booking.TotalDays ?? CalculateDays(booking.PickupDate!.Value, booking.ReturnDate!.Value);
            var vehicleFee = booking.VehicleFee
                ?? ((booking.Vehicle?.PricePerDay ?? (await _vehicleRepository.GetByIdAsync(booking.VehicleId, cancellationToken))?.PricePerDay ?? 0) * totalDays);

            var hasApprovedLicense = await HasApprovedLicenseAsync(userId, cancellationToken);
            var effectiveNeedDriver = request.NeedDriver;
            if (!hasApprovedLicense)
            {
                if (!request.NeedDriver)
                {
                    throw new BadRequestException(
                        "A driver is required: you do not have an approved driving license, so you cannot self-drive.");
                }
                effectiveNeedDriver = true;
            }

            DriverProfile? driverProfile = null;
            decimal driverFee = 0m;
            if (effectiveNeedDriver)
            {
                if (!request.DriverProfileId.HasValue)
                {
                    throw new BadRequestException("Please select a driver before continuing.");
                }

                driverProfile = await _driverProfileRepository.GetByIdWithUserAsync(request.DriverProfileId.Value, cancellationToken)
                    ?? throw new NotFoundException("Selected driver was not found.");
                if (driverProfile.Status != DriverProfileStatus.Verified
                    || !driverProfile.IsActive
                    || driverProfile.Availability != DriverAvailability.Available)
                {
                    throw new BadRequestException("The selected driver is no longer available. Please choose another driver.");
                }

                var overlaps = await _driverProfileRepository.HasOverlappingAssignmentAsync(
                    driverProfile.Id, booking.PickupDate!.Value, booking.ReturnDate!.Value, booking.Id, cancellationToken);
                if (overlaps)
                {
                    throw new BadRequestException("The selected driver is already booked for an overlapping period. Please choose another driver.");
                }

                var dailyRate = await _driverPricingService.GetDailyRateAsync(cancellationToken);
                driverFee = dailyRate * totalDays;
            }

            booking.RequiresDriver = effectiveNeedDriver;
            booking.AssignedDriverProfileId = effectiveNeedDriver ? driverProfile!.Id : (Guid?)null;
            booking.DriverFee = effectiveNeedDriver ? driverFee : (decimal?)null;
            booking.GrandTotal = vehicleFee + (effectiveNeedDriver ? driverFee : 0m);
            booking.TotalPrice = booking.GrandTotal;
            booking.Status = BookingStatus.Draft; // still does NOT reserve the vehicle
            await _bookingRepository.SaveChangesAsync(cancellationToken);

            return await BuildStateAsync(booking, cancellationToken);
        }

        public async Task<CheckoutStateDto> BeginPaymentAsync(
            Guid bookingId, Guid userId, CancellationToken cancellationToken = default)
        {
            var booking = await LoadOwnedResumableAsync(bookingId, userId, cancellationToken);

            var nowUtc = DateTime.UtcNow;
            // Idempotent refresh: an unexpired hold just returns its current state.
            if (booking.Status == BookingStatus.PaymentPending
                && booking.HoldExpiresAt.HasValue && booking.HoldExpiresAt.Value > nowUtc)
            {
                return await BuildStateAsync(booking, cancellationToken);
            }

            // Identity-verification gate (same rule as express checkout) — applied
            // before we reserve the vehicle.
            if (!await _verificationService.IsApprovedAsync(userId, cancellationToken))
            {
                throw new ForbiddenException(BookingService.IdentityVerificationRequiredMessage);
            }

            var vehicle = booking.Vehicle ?? await _vehicleRepository.GetByIdAsync(booking.VehicleId, cancellationToken);
            if (vehicle == null || !vehicle.IsActive)
            {
                throw new ConflictException("Vehicle is not available for booking");
            }

            // Re-validate the chosen driver (it may have become unavailable).
            if (booking.RequiresDriver)
            {
                if (!booking.AssignedDriverProfileId.HasValue)
                {
                    throw new BadRequestException("Please select a driver before continuing to payment.");
                }
                var dp = await _driverProfileRepository.GetByIdWithUserAsync(booking.AssignedDriverProfileId.Value, cancellationToken);
                if (dp == null || dp.Status != DriverProfileStatus.Verified || !dp.IsActive
                    || (dp.Availability != DriverAvailability.Available && dp.Availability != DriverAvailability.Reserved))
                {
                    throw new BadRequestException("The selected driver is no longer available. Please choose another driver.");
                }
            }

            // Atomically reserve the vehicle for the hold window. Two customers
            // reaching this point for the same vehicle/window are serialised —
            // the loser gets a ConflictException (409).
            await _bookingRepository.ReserveVehicleAtomicAsync(
                booking, BookingStatus.PaymentPending, nowUtc, nowUtc.AddMinutes(HoldMinutes), cancellationToken);

            return await BuildStateAsync(booking, cancellationToken);
        }

        public async Task<BookingResponse> ConfirmAsync(
            Guid bookingId, ConfirmCheckoutRequest request, Guid userId, CancellationToken cancellationToken = default)
        {
            var booking = await LoadOwnedAsync(bookingId, userId, cancellationToken);

            // Idempotent: already confirmed.
            if (booking.Status == BookingStatus.Confirmed)
            {
                return new BookingResponse(
                    booking.Id, booking.BookingNumber!, BookingStatus.Confirmed.ToString(),
                    booking.GrandTotal ?? booking.TotalPrice ?? 0m, "Booking already confirmed.");
            }

            if (booking.Status != BookingStatus.PaymentPending)
            {
                throw new ConflictException("Start the payment step before confirming the booking.");
            }

            var nowUtc = DateTime.UtcNow;
            if (!booking.HoldExpiresAt.HasValue || booking.HoldExpiresAt.Value <= nowUtc)
            {
                throw new ConflictException(
                    "Your reservation hold has expired. Please start again — the vehicle may have been taken by another customer.");
            }

            var paymentSuccessful = await SimulatePaymentAsync(cancellationToken);
            if (!paymentSuccessful)
            {
                throw new BadRequestException("Payment processing failed. Please try again.");
            }

            var grandTotal = booking.GrandTotal ?? booking.TotalPrice ?? 0m;

            // Stage the payment row…
            var payment = new BookingPayment
            {
                PaymentId = Guid.NewGuid(),
                BookingId = booking.Id,
                TransactionId = Guid.NewGuid(),
                PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? "credit_card" : request.PaymentMethod,
                Amount = grandTotal,
                Currency = "USD",
                Status = "Captured",
                AuthorizationCode = GenerateAuthorizationCode(),
                ProcessedAt = nowUtc,
                CreatedAt = nowUtc
            };
            await _paymentRepository.AddAsync(payment, cancellationToken);

            // …and the driver lock.
            DriverProfile? driverProfile = null;
            if (booking.RequiresDriver && booking.AssignedDriverProfileId.HasValue)
            {
                driverProfile = await _driverProfileRepository.GetByIdWithUserAsync(booking.AssignedDriverProfileId.Value, cancellationToken);
                if (driverProfile != null)
                {
                    driverProfile.Availability = DriverAvailability.Reserved;
                    driverProfile.LockedUntil = booking.ReturnDate;
                    await _driverProfileRepository.UpdateAsync(driverProfile, cancellationToken);
                }
            }

            // Finalise under the lock (re-checks overlap as defence-in-depth) and
            // commit booking + payment + driver lock atomically. Clears the hold.
            await _bookingRepository.ReserveVehicleAtomicAsync(
                booking, BookingStatus.Confirmed, booking.HoldStartedAt, null, cancellationToken);

            await SendBestEffortNotificationsAsync(booking, booking.Vehicle!, driverProfile, cancellationToken);

            return new BookingResponse(
                booking.Id, booking.BookingNumber!, BookingStatus.Confirmed.ToString(),
                grandTotal, "Booking confirmed and payment captured successfully.");
        }

        public async Task<CheckoutStateDto> CancelAsync(
            Guid bookingId, Guid userId, CancellationToken cancellationToken = default)
        {
            var booking = await LoadOwnedAsync(bookingId, userId, cancellationToken);
            if (booking.Status == BookingStatus.Cancelled)
            {
                return await BuildStateAsync(booking, cancellationToken);
            }
            if (!BookingStatusPolicy.ResumableStatuses.Contains(booking.Status))
            {
                throw new ConflictException("This booking can no longer be cancelled from checkout.");
            }

            booking.Status = BookingStatus.Cancelled;
            booking.CancelledAt = DateTime.UtcNow;
            booking.CancellationReason = "Cancelled by customer during checkout.";
            booking.HoldStartedAt = null;
            booking.HoldExpiresAt = null; // release the hold immediately
            await _bookingRepository.SaveChangesAsync(cancellationToken);

            return await BuildStateAsync(booking, cancellationToken);
        }

        public async Task<CheckoutStateDto?> GetActiveAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var booking = await FindResumableBookingAsync(userId, cancellationToken);
            return booking == null ? null : await BuildStateAsync(booking, cancellationToken);
        }

        public async Task<CheckoutStateDto?> GetStateAsync(Guid bookingId, Guid userId, CancellationToken cancellationToken = default)
        {
            var booking = await _bookingRepository.GetBookingWithDetailsAsync(bookingId, cancellationToken);
            if (booking == null || booking.UserId != userId)
            {
                return null;
            }
            return await BuildStateAsync(booking, cancellationToken);
        }

        // ── Staged-flow helpers ────────────────────────────────────────────────

        private async Task<Booking> LoadOwnedAsync(Guid bookingId, Guid userId, CancellationToken cancellationToken)
        {
            var booking = await _bookingRepository.GetBookingWithDetailsAsync(bookingId, cancellationToken)
                ?? throw new NotFoundException("Booking", bookingId);
            if (booking.UserId != userId)
            {
                throw new ForbiddenException("This booking does not belong to you.");
            }
            return booking;
        }

        private async Task<Booking> LoadOwnedResumableAsync(Guid bookingId, Guid userId, CancellationToken cancellationToken)
        {
            var booking = await LoadOwnedAsync(bookingId, userId, cancellationToken);
            if (!BookingStatusPolicy.ResumableStatuses.Contains(booking.Status))
            {
                throw new ConflictException("This booking is no longer in progress and cannot be modified.");
            }
            return booking;
        }

        private async Task<Booking?> FindResumableBookingAsync(Guid userId, CancellationToken cancellationToken)
        {
            var nowUtc = DateTime.UtcNow;
            var resumable = BookingStatusPolicy.ResumableStatuses;
            return await _context.Bookings
                .Include(b => b.Vehicle)
                    .ThenInclude(v => v!.Images)
                .Where(b => b.UserId == userId
                    && resumable.Contains(b.Status)
                    && !(b.Status == BookingStatus.PaymentPending
                         && b.HoldExpiresAt != null
                         && b.HoldExpiresAt <= nowUtc))
                .OrderByDescending(b => b.UpdatedAt)
                .FirstOrDefaultAsync(cancellationToken);
        }

        private async Task<CheckoutStateDto> BuildStateAsync(Booking booking, CancellationToken cancellationToken)
        {
            var vehicle = booking.Vehicle ?? await _vehicleRepository.GetByIdAsync(booking.VehicleId, cancellationToken);
            var vehicleLabel = vehicle != null
                ? $"{vehicle.Make} {vehicle.Model}".Trim()
                : "Vehicle";
            var imageUrl = vehicle?.Images?
                .OrderByDescending(i => i.IsPrimary)
                .ThenBy(i => i.DisplayOrder)
                .FirstOrDefault()?.ImageUrl;

            string? driverName = null;
            if (booking.AssignedDriverProfileId.HasValue)
            {
                var dp = await _driverProfileRepository.GetByIdWithUserAsync(booking.AssignedDriverProfileId.Value, cancellationToken);
                if (dp?.User != null)
                {
                    driverName = $"{dp.User.FirstName} {dp.User.LastName}".Trim();
                }
            }

            var nowUtc = DateTime.UtcNow;
            int? secondsRemaining = null;
            if (booking.Status == BookingStatus.PaymentPending && booking.HoldExpiresAt.HasValue)
            {
                var remaining = (int)Math.Floor((booking.HoldExpiresAt.Value - nowUtc).TotalSeconds);
                secondsRemaining = remaining > 0 ? remaining : 0;
            }

            var step = booking.Status switch
            {
                BookingStatus.Draft => (booking.RequiresDriver && !booking.AssignedDriverProfileId.HasValue) ? "driver" : "payment",
                BookingStatus.PaymentPending => "payment",
                BookingStatus.Confirmed => "confirmed",
                _ => "vehicle"
            };

            return new CheckoutStateDto(
                BookingId: booking.Id,
                BookingNumber: booking.BookingNumber,
                Status: booking.Status.ToString(),
                Step: step,
                VehicleId: booking.VehicleId,
                VehicleLabel: vehicleLabel,
                VehicleImageUrl: imageUrl,
                PickupDate: booking.PickupDate ?? default,
                ReturnDate: booking.ReturnDate ?? default,
                PickupLocation: booking.PickupLocation,
                DropoffLocation: booking.DropoffLocation,
                TotalDays: booking.TotalDays ?? 0,
                VehicleFee: booking.VehicleFee ?? 0m,
                RequiresDriver: booking.RequiresDriver,
                DriverProfileId: booking.AssignedDriverProfileId,
                DriverName: driverName,
                DriverFee: booking.DriverFee,
                GrandTotal: booking.GrandTotal ?? booking.TotalPrice ?? 0m,
                HoldExpiresAt: booking.HoldExpiresAt,
                HoldSecondsRemaining: secondsRemaining);
        }

        // ── Helpers ──────────────────────────────────────────────────────────

        private async Task<bool> HasApprovedLicenseAsync(Guid userId, CancellationToken cancellationToken)
        {
            return await _context.Drivers.AnyAsync(
                d => d.UserId == userId
                     && (d.IsVerified || (d.VerificationStatus != null && d.VerificationStatus == "Verified")),
                cancellationToken);
        }

        private static int CalculateDays(DateTime pickup, DateTime ret)
        {
            var days = (ret - pickup).Days;
            return days < 1 ? 1 : days;
        }

        /// <summary>
        /// Simulated payment processing. Mirrors <see cref="PaymentService"/> —
        /// always succeeds in this environment. A real gateway integration would
        /// replace only this method.
        /// </summary>
        private static async Task<bool> SimulatePaymentAsync(CancellationToken cancellationToken)
        {
            await Task.Delay(50, cancellationToken);
            return true;
        }

        private static string GenerateUniqueBookingNumber()
        {
            var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
            var randomPart = Guid.NewGuid().ToString("N").Substring(0, 5).ToUpper();
            return $"BK-{datePart}-{randomPart}";
        }

        private static string GenerateAuthorizationCode()
        {
            return $"AUTH-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}";
        }

        private async Task SendBestEffortNotificationsAsync(
            Booking booking,
            Vehicle vehicle,
            DriverProfile? driverProfile,
            CancellationToken cancellationToken)
        {
            if (_notificationService is null) return;

            var bookingLabel = string.IsNullOrWhiteSpace(booking.BookingNumber)
                ? booking.Id.ToString()
                : booking.BookingNumber!;

            try
            {
                await _notificationService.CreateNotificationAsync(
                    booking.UserId,
                    "Booking Confirmed",
                    $"Your booking {bookingLabel} is confirmed and payment was received.",
                    $"BookingConfirmed:{booking.Id}",
                    cancellationToken);
            }
            catch { /* best-effort */ }

            try
            {
                if (vehicle.UserId != Guid.Empty)
                {
                    await _notificationService.CreateNotificationAsync(
                        vehicle.UserId,
                        "New booking received",
                        $"You received a new booking ({bookingLabel}).",
                        SupplierNotificationTypes.Format(SupplierNotificationTypes.BookingReceived, booking.Id),
                        cancellationToken);
                }
            }
            catch { /* best-effort */ }

            try
            {
                if (driverProfile != null)
                {
                    await _notificationService.CreateNotificationAsync(
                        driverProfile.UserId,
                        "You have been assigned a booking",
                        $"You have been selected as the driver for booking {bookingLabel}.",
                        $"DriverAssigned:{booking.Id}",
                        cancellationToken);
                }
            }
            catch { /* best-effort */ }

            try
            {
                await _notificationService.NotifyAdminsAsync(
                    "New booking confirmed",
                    $"Booking {bookingLabel} was created and paid.",
                    $"BookingConfirmed:{booking.Id}",
                    cancellationToken);
            }
            catch { /* best-effort */ }
        }
    }
}
