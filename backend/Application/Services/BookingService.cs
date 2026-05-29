using Backend.Application.DTOs.Booking;
using Backend.Application.DTOs.Common;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services;

/// <summary>
/// Service implementation for booking-related operations
/// Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10
/// </summary>
public class BookingService : IBookingService
{
    /// <summary>
    /// User-facing error message returned when a customer tries to create a
    /// booking without an approved identity verification. Kept as a constant
    /// so the message stays consistent between the backend exception and the
    /// frontend warning copy that QA scripts assert against.
    /// </summary>
    public const string IdentityVerificationRequiredMessage =
        "You must complete identity verification before booking a vehicle.";

    private readonly IBookingRepository _bookingRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IApplicationDbContext _context;
    private readonly INotificationService? _notificationService;
    private readonly UserManager<ApplicationUser> _userManager;
    // Optional + nullable so the existing unit / property test suites that
    // instantiate BookingService with positional args keep compiling without
    // changes. Production DI always provides a real implementation, so the
    // identity-verification gate below is enforced for real customers.
    private readonly IVerificationService? _verificationService;

    public BookingService(
        IBookingRepository bookingRepository,
        IVehicleRepository vehicleRepository,
        IApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        INotificationService? notificationService = null,
        IVerificationService? verificationService = null)
    {
        _bookingRepository = bookingRepository;
        _vehicleRepository = vehicleRepository;
        _context = context;
        _userManager = userManager;
        _notificationService = notificationService;
        _verificationService = verificationService;
    }

    public async Task<BookingResponse> CreateBookingAsync(
        CreateBookingRequest request,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Logic-level guard: admins are not permitted to create bookings
        if (_userManager != null)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user != null && await _userManager.IsInRoleAsync(user, "Admin"))
            {
                throw new ForbiddenException("Administrators are not allowed to create bookings.");
            }
        }

        // ── Identity-verification gate ───────────────────────────────────
        // The customer who will *own* the booking must have an approved
        // identity verification. We resolve that owner here (same logic as
        // below) so admin-driven creation on behalf of a customer also
        // honours the gate — an admin must not be able to side-step the
        // requirement on behalf of an unverified customer.
        //
        // The gate is intentionally the first check in this method so an
        // unverified customer never even probes vehicle availability,
        // pricing, or any other side-effect-free read.
        //
        // The exception is mapped to HTTP 403 by GlobalExceptionHandlerMiddleware.
        if (_verificationService is not null)
        {
            var bookingOwnerId = request.CustomerUserId ?? userId;
            var isApproved = await _verificationService.IsApprovedAsync(bookingOwnerId, cancellationToken);
            if (!isApproved)
            {
                throw new ForbiddenException(IdentityVerificationRequiredMessage);
            }
        }

        // Requirement 4.4: Validate that pickup date is before return date
        if (request.PickupDate >= request.ReturnDate)
        {
            throw new ValidationException("DateRange", "Pickup date must be before return date");
        }

        // Requirement 4.3: Check vehicle availability for date range
        // (ordering preserved to keep existing unit-test expectations stable).
        var isAvailable = await _vehicleRepository.IsAvailableAsync(
            request.VehicleId,
            request.PickupDate,
            request.ReturnDate,
            cancellationToken);

        if (!isAvailable)
        {
            throw new ConflictException("Vehicle is not available for the selected dates");
        }

        // Get vehicle for price calc, the IsActive guard, and the supplier
        // notification. Single round-trip covers all three.
        var vehicle = await _vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);
        if (vehicle == null)
        {
            throw new NotFoundException($"Vehicle with ID {request.VehicleId} not found");
        }

        // Inactive vehicles can never be booked.
        if (!vehicle.IsActive)
        {
            throw new ConflictException("Vehicle is not available for booking");
        }

        // Requirement 4.2: Calculate total price (days * pricePerDay) — always
        // server-side, never trust a client-provided total.
        var totalDays = (request.ReturnDate - request.PickupDate).Days;
        var totalPrice = (vehicle.PricePerDay ?? 0) * totalDays;

        // Requirement 4.5: Generate unique booking number
        var bookingNumber = GenerateUniqueBookingNumber();

        // Determine which user the booking belongs to. For self-service the
        // caller is the customer; for admin-driven creation the request may
        // specify a target customer.
        var ownerUserId = request.CustomerUserId ?? userId;

        // Resolve pickup/dropoff label — prefer the explicit string, fall
        // back to the legacy Id. We will resolve it to a human-readable address if it's a GUID.
        var pickupLabel = !string.IsNullOrWhiteSpace(request.PickupLocation)
            ? request.PickupLocation!.Trim()
            : (request.PickupLocationId != Guid.Empty ? await ResolveDisplayLocationAsync(request.PickupLocationId.ToString(), cancellationToken) : null);
        var dropoffLabel = !string.IsNullOrWhiteSpace(request.DropOffLocation)
            ? request.DropOffLocation!.Trim()
            : (request.DropOffLocationId != Guid.Empty ? await ResolveDisplayLocationAsync(request.DropOffLocationId.ToString(), cancellationToken) : null);

        // Requirement 4.10: Create booking with status "Pending". Payment is
        // a separate flow — booking creation does NOT require payment.
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            BookingNumber = bookingNumber,
            UserId = ownerUserId,
            VehicleId = request.VehicleId,
            PickupDate = request.PickupDate,
            ReturnDate = request.ReturnDate,
            PickupLocation = pickupLabel,
            DropoffLocation = dropoffLabel,
            TotalDays = totalDays,
            TotalPrice = totalPrice,
            Status = BookingStatus.Pending,
            DriverId = request.DriverId,
            RequiresDriver = request.DriverId.HasValue
        };

        // Requirement 4.1: Create booking and mark vehicle as unavailable for those dates
        await _bookingRepository.AddAsync(booking, cancellationToken);
        await _bookingRepository.SaveChangesAsync(cancellationToken);

        // Requirement 4.8: Create notification for the booking owner (customer).
        if (request.CustomerUserId.HasValue && request.CustomerUserId.Value != userId)
        {
            await CreateBookingNotificationForAdminCreatedAsync(ownerUserId, booking.Id, bookingNumber, cancellationToken);
        }
        else
        {
            await CreateBookingNotificationAsync(ownerUserId, booking.Id, bookingNumber, cancellationToken);
        }

        // Supplier-facing notification — "new booking received" — fired
        // best-effort so a notification failure cannot roll back the
        // booking. The vehicle owner (supplier) is `vehicle.UserId`.
        await NotifySupplierBookingReceivedAsync(vehicle, booking, cancellationToken);

        return new BookingResponse(
            booking.Id,
            bookingNumber,
            "Pending",
            totalPrice,
            "Booking created successfully"
        );
    }

    public async Task<PagedResult<BookingListDto>> GetUserBookingsAsync(
        Guid userId,
        BookingListRequest request,
        string? sortBy = null,
        string? sortOrder = null,
        CancellationToken cancellationToken = default)
    {
        var bookings = await _bookingRepository.GetUserBookingsAsync(
            userId,
            request.Suppliers,
            request.Statuses,
            request.CarId,
            request.Filter?.From,
            request.Filter?.To,
            request.Filter?.Keyword,
            request.Filter?.PickupLocation,
            request.Filter?.DropOffLocation,
            cancellationToken);

        var bookingList = bookings.ToList();

        if (!string.IsNullOrEmpty(sortBy))
        {
            var order = string.IsNullOrEmpty(sortOrder) ? "desc" : sortOrder.ToLower();
            bookingList = sortBy.ToLower() switch
            {
                "price" => order == "asc"
                    ? bookingList.OrderBy(b => b.TotalPrice ?? 0).ToList()
                    : bookingList.OrderByDescending(b => b.TotalPrice ?? 0).ToList(),
                "status" => order == "asc"
                    ? bookingList.OrderBy(b => b.Status.ToString()).ToList()
                    : bookingList.OrderByDescending(b => b.Status.ToString()).ToList(),
                _ => order == "asc"
                    ? bookingList.OrderBy(b => b.PickupDate ?? DateTime.MinValue).ToList()
                    : bookingList.OrderByDescending(b => b.PickupDate ?? DateTime.MinValue).ToList()
            };
        }
        else
        {
            bookingList = bookingList.OrderByDescending(b => b.CreatedAt).ToList();
        }

        var totalCount = bookingList.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)request.Size);
        var skip = (request.Page - 1) * request.Size;
        var pagedBookings = bookingList.Skip(skip).Take(request.Size).ToList();

        var bookingIds = pagedBookings.Select(b => b.Id).ToList();
        var payments = bookingIds.Count == 0
            ? new List<BookingPayment>()
            : await _context.Payments
                .Where(p => bookingIds.Contains(p.BookingId))
                .ToListAsync(cancellationToken);

        var bookingDtos = pagedBookings.Select(b =>
        {
            var payment = payments
                .Where(p => p.BookingId == b.Id)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefault();
            return MapToBookingListDto(b, payment);
        }).ToList();

        return new PagedResult<BookingListDto>(
            bookingDtos,
            request.Page,
            request.Size,
            totalCount,
            totalPages
        );
    }

    public async Task<BookingDetailsDto> GetBookingDetailsAsync(
        Guid bookingId,
        Guid userId,
        bool isAdmin = false,
        CancellationToken cancellationToken = default)
    {
        var booking = await _bookingRepository.GetBookingWithDetailsAsync(bookingId, cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException($"Booking with ID {bookingId} not found");
        }

        // Verify booking belongs to authenticated user or user is admin
        if (!isAdmin && booking.UserId != userId)
        {
            throw new ForbiddenException("You do not have permission to view this booking");
        }

        return await BuildBookingDetailsDtoAsync(booking, cancellationToken);
    }

    public async Task<bool> CancelBookingAsync(
        Guid bookingId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Retrieve booking with vehicle details
        var booking = await _context.Bookings
            .Include(b => b.Vehicle)
            .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException($"Booking with ID {bookingId} not found");
        }

        // Requirement 5.11: Verify booking belongs to user
        if (booking.UserId != userId)
        {
            throw new ForbiddenException("You do not have permission to cancel this booking");
        }

        // Requirement 5.12: Verify booking can be cancelled (status check)
        if (booking.Status == Backend.Domain.Entities.Enums.BookingStatus.Cancelled || booking.Status == Backend.Domain.Entities.Enums.BookingStatus.Completed)
        {
            throw new ValidationException("Status", "This booking cannot be cancelled");
        }

        // Requirement 5.13: Update booking status to "Cancelled"
        booking.Status = Backend.Domain.Entities.Enums.BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;

        await _bookingRepository.UpdateAsync(booking, cancellationToken);

        // Requirement 20.3: Make vehicle available again for those dates
        // Note: Vehicle availability is determined by checking active bookings
        // By setting status to "Cancelled", the vehicle becomes available automatically
        // when IsAvailableAsync checks for non-cancelled bookings

        // Requirement 20.1: Create cancellation record
        var cancellation = new BookingCancellation
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            CancelledBy = userId,
            PolicyType = Domain.Entities.Enums.PolicyType.Free, // Default policy
            RefundPercentage = 100, // Full refund by default
            OriginalAmount = booking.TotalPrice ?? 0,
            CancellationFee = 0, // No fee by default
            Currency = "USD",
            RefundStatus = Domain.Entities.Enums.RefundStatus.Pending,
            Reason = "Customer requested cancellation",
            ReasonCategory = Domain.Entities.Enums.ReasonCategory.PlansChanged,
            CreatedAt = DateTime.UtcNow
        };

        _context.AddBookingCancellation(cancellation);

        // Requirement 20.2: Save all changes
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> HasUserBookingsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _bookingRepository.HasUserBookingsAsync(userId, cancellationToken);
    }

    public async Task<PagedResult<BookingListDto>> GetAdminBookingsAsync(
        int page,
        int size,
        BookingListRequest request,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        // If user is a supplier (and not admin), only show their own bookings
        Guid? supplierId = !isAdmin ? currentUserId : request.Suppliers?.FirstOrDefault();

        var bookings = await _bookingRepository.GetAdminBookingsAsync(
            supplierId,
            request.Statuses,
            request.CarId,
            request.Filter?.From,
            request.Filter?.To,
            request.Filter?.Keyword,
            cancellationToken);

        var bookingList = bookings.ToList();
        var totalCount = bookingList.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)size);
        var skip = (page - 1) * size;
        var pagedBookings = bookingList.Skip(skip).Take(size).ToList();

        var bookingIds = pagedBookings.Select(b => b.Id).ToList();
        var payments = bookingIds.Count == 0
            ? new List<BookingPayment>()
            : await _context.Payments
                .Where(p => bookingIds.Contains(p.BookingId))
                .ToListAsync(cancellationToken);

        var bookingDtos = pagedBookings.Select(b =>
        {
            var payment = payments
                .Where(p => p.BookingId == b.Id)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefault();
            return MapToBookingListDto(b, payment);
        }).ToList();

        return new PagedResult<BookingListDto>(
            bookingDtos,
            page,
            size,
            totalCount,
            totalPages
        );
    }

    public async Task<AdminBookingStatsDto> GetAdminBookingStatsAsync(
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings.AsQueryable();

        if (!isAdmin)
        {
            query = query.Where(b => b.Vehicle != null && b.Vehicle.UserId == currentUserId);
        }

        // Operational stats:
        // - Active   = currently active rentals
        // - Pending  = bookings awaiting confirmation
        // - Completed = ALL completed bookings (lifetime), not today only
        var activeBookings = await query.CountAsync(b => b.Status == BookingStatus.Active, cancellationToken);
        var pendingBookings = await query.CountAsync(b => b.Status == BookingStatus.Pending, cancellationToken);
        var totalCompletedBookings = await query.CountAsync(b => b.Status == BookingStatus.Completed, cancellationToken);

        return new AdminBookingStatsDto(activeBookings, pendingBookings, totalCompletedBookings);
    }

    public async Task<BookingDetailsDto> GetAdminBookingByIdAsync(
        Guid bookingId,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var booking = await _bookingRepository.GetBookingWithDetailsAsync(bookingId, cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException($"Booking with ID {bookingId} not found");
        }

        // Verify permission: Admin can see all, Supplier can see their own vehicles' bookings
        if (!isAdmin && booking.Vehicle?.UserId != currentUserId)
        {
            throw new ForbiddenException("You do not have permission to view this booking");
        }

        return await BuildBookingDetailsDtoAsync(booking, cancellationToken);
    }

    public async Task<bool> UpdateBookingStatusAsync(
        Guid bookingId,
        string newStatus,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var booking = await _bookingRepository.GetBookingWithDetailsAsync(bookingId, cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException($"Booking with ID {bookingId} not found");
        }

        // Verify permission: Admin can update all, Supplier can update their own vehicles' bookings
        if (!isAdmin && booking.Vehicle?.UserId != userId)
        {
            throw new ForbiddenException("You do not have permission to update this booking");
        }

        // Terminal-status guard. Completed / Cancelled bookings are frozen.
        if (booking.Status == BookingStatus.Cancelled || booking.Status == BookingStatus.Completed)
        {
            throw new ValidationException("Status", $"Cannot update status from {booking.Status}");
        }

        var parsedStatus = ParseOperationalStatus(newStatus);

        booking.Status = parsedStatus;
        if (parsedStatus == BookingStatus.Cancelled)
        {
            booking.CancelledAt = DateTime.UtcNow;
        }
        booking.UpdatedAt = DateTime.UtcNow;

        await _bookingRepository.UpdateAsync(booking, cancellationToken);
        await _bookingRepository.SaveChangesAsync(cancellationToken);

        // Fire-and-forget notification for the customer (best-effort).
        await NotifyBookingStatusChangeAsync(booking, parsedStatus, cancellationToken);

        return true;
    }

    public async Task<BookingDetailsDto> UpdateBookingAsync(
        Guid bookingId,
        UpdateBookingRequest request,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var booking = await _bookingRepository.GetBookingWithDetailsAsync(bookingId, cancellationToken);
        if (booking is null)
        {
            throw new NotFoundException($"Booking with ID {bookingId} not found");
        }

        // Permission: Admin sees everything; suppliers can only edit bookings
        // for vehicles they own; customers can only edit their own bookings.
        var isOwnerCustomer = booking.UserId == currentUserId;
        var isOwningSupplier = booking.Vehicle?.UserId == currentUserId;
        if (!isAdmin && !isOwnerCustomer && !isOwningSupplier)
        {
            throw new ForbiddenException("You do not have permission to edit this booking");
        }

        // Terminal-state guard. Once a booking is Completed or Cancelled, none
        // of the operational fields may be edited — matches the frontend's
        // disabled-state expectations for those statuses.
        if (booking.Status == BookingStatus.Completed || booking.Status == BookingStatus.Cancelled)
        {
            throw new ValidationException(
                "Status",
                $"Booking is {booking.Status} and can no longer be edited");
        }

        // ── Apply optional updates ───────────────────────────────────────
        var pickupDate = request.PickupDate ?? booking.PickupDate;
        var returnDate = request.ReturnDate ?? booking.ReturnDate;

        if (pickupDate is null || returnDate is null)
        {
            throw new ValidationException("DateRange", "Pickup and return dates are required");
        }
        if (pickupDate >= returnDate)
        {
            throw new ValidationException("DateRange", "Pickup date must be before return date");
        }

        var datesChanged = request.PickupDate.HasValue || request.ReturnDate.HasValue;

        // If dates changed AND moved off the originally booked window, verify
        // the new window doesn't collide with other active bookings.
        if (datesChanged && booking.Vehicle is not null)
        {
            var newWindowOverlapsOthers = await _context.Bookings
                .Where(b => b.Id != booking.Id
                            && b.VehicleId == booking.VehicleId
                            && b.Status != BookingStatus.Cancelled)
                .AnyAsync(b =>
                    b.PickupDate.HasValue && b.ReturnDate.HasValue &&
                    pickupDate < b.ReturnDate && returnDate > b.PickupDate,
                    cancellationToken);
            if (newWindowOverlapsOthers)
            {
                throw new ConflictException("Vehicle is not available for the selected dates");
            }
        }

        booking.PickupDate = pickupDate;
        booking.ReturnDate = returnDate;

        // Locations — free-text labels.
        if (request.PickupLocation is not null)
        {
            booking.PickupLocation = request.PickupLocation.Trim();
        }
        if (request.DropOffLocation is not null)
        {
            booking.DropoffLocation = request.DropOffLocation.Trim();
        }

        // Status — only operational transitions allowed via this endpoint.
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var parsed = ParseOperationalStatus(request.Status);
            booking.Status = parsed;
            if (parsed == BookingStatus.Cancelled)
            {
                booking.CancelledAt = DateTime.UtcNow;
            }
        }

        // Always recalculate days + price from authoritative inputs.
        var totalDays = (returnDate.Value - pickupDate.Value).Days;
        booking.TotalDays = totalDays;
        booking.TotalPrice = (booking.Vehicle?.PricePerDay ?? 0m) * totalDays;
        booking.UpdatedAt = DateTime.UtcNow;

        await _bookingRepository.UpdateAsync(booking, cancellationToken);
        await _bookingRepository.SaveChangesAsync(cancellationToken);

        // Best-effort status-change notification only when the status actually
        // changed via this edit.
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            await NotifyBookingStatusChangeAsync(booking, booking.Status, cancellationToken);
        }

        return await BuildBookingDetailsDtoAsync(booking, cancellationToken);
    }

    /// <summary>
    /// Parses an incoming status string against the four supported operational
    /// statuses. The change-status flow is intentionally limited to these.
    /// </summary>
    private static BookingStatus ParseOperationalStatus(string raw)
    {
        if (!Enum.TryParse<BookingStatus>(raw, ignoreCase: true, out var parsed))
        {
            throw new ValidationException("Status", $"Invalid status value: {raw}");
        }

        // Whitelist the operationally supported statuses — keeps the legacy
        // inspection-workflow statuses out of the simple change-status flow.
        var allowed = parsed is BookingStatus.Pending
                              or BookingStatus.Active
                              or BookingStatus.Completed
                              or BookingStatus.Cancelled;
        if (!allowed)
        {
            throw new ValidationException(
                "Status",
                $"Status '{parsed}' is not allowed via the operational change-status flow. " +
                "Allowed: Pending, Active, Completed, Cancelled.");
        }

        return parsed;
    }

    /// <summary>
    /// Generates a unique booking number in format BK-YYYYMMDD-XXXXX
    /// Requirement 4.5: Generate unique booking number
    /// </summary>
    private string GenerateUniqueBookingNumber()
    {
        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        var randomPart = Guid.NewGuid().ToString("N").Substring(0, 5).ToUpper();
        return $"BK-{datePart}-{randomPart}";
    }

    /// <summary>
    /// Fires the supplier-facing "new booking received" notification.
    /// Best-effort: any failure (notification service missing, DB error,
    /// etc.) is swallowed so the booking creation always succeeds.
    /// </summary>
    private async Task NotifySupplierBookingReceivedAsync(
        Vehicle vehicle,
        Booking booking,
        CancellationToken cancellationToken)
    {
        if (_notificationService is null) return;

        // Defensive: a vehicle without an owner can't be notified.
        if (vehicle.UserId == Guid.Empty) return;

        var vehicleLabel = string.IsNullOrWhiteSpace(vehicle.Make) && string.IsNullOrWhiteSpace(vehicle.Model)
            ? "your vehicle"
            : $"{vehicle.Make} {vehicle.Model}".Trim();
        var bookingLabel = string.IsNullOrWhiteSpace(booking.BookingNumber)
            ? booking.Id.ToString()
            : booking.BookingNumber!;

        try
        {
            await _notificationService.CreateNotificationAsync(
                vehicle.UserId,
                "New booking received",
                $"You received a new booking ({bookingLabel}) for {vehicleLabel}.",
                SupplierNotificationTypes.Format(SupplierNotificationTypes.BookingReceived, booking.Id),
                cancellationToken);
        }
        catch
        {
            // Best-effort only.
        }
    }

    /// <summary>
    /// Creates a notification for the customer after booking creation.
    /// Requirement 4.8: Create notification for customer
    /// Wrapped in try/catch so notification failures never break the booking flow.
    /// </summary>
    private async Task CreateBookingNotificationAsync(
        Guid userId,
        Guid bookingId,
        string bookingNumber,
        CancellationToken cancellationToken)
    {
        if (_notificationService == null)
        {
            return;
        }

        try
        {
            await _notificationService.CreateNotificationAsync(
                userId,
                "Booking Received",
                $"Your booking {bookingNumber} has been created and is pending confirmation.",
                $"BookingPending:{bookingId}",
                cancellationToken);
        }
        catch
        {
            // Swallow — notifications are best-effort and must not break the booking flow.
        }

        try
        {
            await _notificationService.NotifyAdminsAsync(
                "New booking created",
                $"A new booking {bookingNumber} has been created and is awaiting confirmation.",
                $"BookingPending:{bookingId}",
                cancellationToken);
        }
        catch
        {
            // Best-effort only.
        }
    }

    /// <summary>
    /// Creates a payment-pending notification for the customer after admin-driven booking creation.
    /// Wrapped in try/catch so notification failures never break the booking flow.
    /// </summary>
    private async Task CreateBookingNotificationForAdminCreatedAsync(
        Guid userId,
        Guid bookingId,
        string bookingNumber,
        CancellationToken cancellationToken)
    {
        if (_notificationService == null)
        {
            return;
        }

        try
        {
            await _notificationService.CreateNotificationAsync(
                userId,
                "Booking Awaiting Payment",
                $"An admin has created Booking {bookingNumber} on your behalf. Please complete the payment on your end to confirm the booking.",
                $"BookingPendingPayment:{bookingId}",
                cancellationToken);
        }
        catch
        {
            // Swallow — notifications are best-effort and must not break the booking flow.
        }
    }

    /// <summary>
    /// Creates a notification when a booking status changes (approved, rejected, completed).
    /// Best-effort: any failure is swallowed so the status change still succeeds.
    /// </summary>
    private async Task NotifyBookingStatusChangeAsync(
        Booking booking,
        Backend.Domain.Entities.Enums.BookingStatus newStatus,
        CancellationToken cancellationToken)
    {
        if (_notificationService == null)
        {
            return;
        }

        var bookingLabel = string.IsNullOrEmpty(booking.BookingNumber)
            ? booking.Id.ToString()
            : booking.BookingNumber;
        try
        {
            switch (newStatus)
            {
                case Backend.Domain.Entities.Enums.BookingStatus.Confirmed:
                    await _notificationService.CreateNotificationAsync(
                        booking.UserId,
                        "Booking Approved",
                        $"Your booking {bookingLabel} has been approved. Get ready for your trip!",
                        $"BookingApproved:{booking.Id}",
                        cancellationToken);
                    await _notificationService.NotifyAdminsAsync(
                        "Booking approved",
                        $"Booking {bookingLabel} has been approved.",
                        $"BookingApproved:{booking.Id}",
                        cancellationToken);
                    break;

                case Backend.Domain.Entities.Enums.BookingStatus.Cancelled:
                    await _notificationService.CreateNotificationAsync(
                        booking.UserId,
                        "Booking Rejected",
                        $"Your booking {bookingLabel} has been rejected or cancelled. Please review your bookings for details.",
                        $"BookingRejected:{booking.Id}",
                        cancellationToken);
                    await _notificationService.NotifyAdminsAsync(
                        "Booking rejected",
                        $"Booking {bookingLabel} has been rejected or cancelled.",
                        $"BookingRejected:{booking.Id}",
                        cancellationToken);
                    break;

                case Backend.Domain.Entities.Enums.BookingStatus.Completed:
                    await _notificationService.CreateNotificationAsync(
                        booking.UserId,
                        "Booking Completed",
                        $"Your booking {bookingLabel} has been completed. Thank you for choosing us!",
                        $"BookingCompleted:{booking.Id}",
                        cancellationToken);

                    // Review-available notification (Requirement: review available).
                    await _notificationService.CreateNotificationAsync(
                        booking.UserId,
                        "Share your experience",
                        $"You can now leave a review for booking {bookingLabel}.",
                        $"ReviewAvailable:{booking.Id}",
                        cancellationToken);

                    // Supplier-facing "booking completed" notification. Uses
                    // a dedicated tag (BookingCompletedSupplier) so it can't
                    // be confused with the customer-facing "BookingCompleted"
                    // tag above. Skip if the booking has no related vehicle
                    // owner (defensive — shouldn't happen for completed
                    // bookings).
                    if (booking.Vehicle is not null && booking.Vehicle.UserId != Guid.Empty)
                    {
                        await _notificationService.CreateNotificationAsync(
                            booking.Vehicle.UserId,
                            "Booking completed",
                            $"Booking {bookingLabel} has been completed.",
                            SupplierNotificationTypes.Format(
                                SupplierNotificationTypes.BookingCompletedSupplier,
                                booking.Id),
                            cancellationToken);
                    }

                    await _notificationService.NotifyAdminsAsync(
                        "Booking completed",
                        $"Booking {bookingLabel} has been completed.",
                        "BookingCompleted",
                        cancellationToken);
                    break;
            }
        }
        catch
        {
            // Best-effort: never break the booking status update.
        }
    }

    public async Task<bool> DeleteBookingsAsync(
        List<Guid> bookingIds,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        if (bookingIds == null || !bookingIds.Any())
            return true;

        var bookings = await _context.Bookings
            .Include(b => b.Vehicle)
            .Where(b => bookingIds.Contains(b.Id))
            .ToListAsync(cancellationToken);

        if (!bookings.Any())
            return true;

        foreach (var booking in bookings)
        {
            if (!isAdmin && booking.Vehicle?.UserId != userId)
            {
                throw new ForbiddenException("You do not have permission to delete one or more of these bookings");
            }
        }

        foreach (var booking in bookings)
        {
            await _bookingRepository.DeleteAsync(booking, cancellationToken);
        }
        await _bookingRepository.SaveChangesAsync(cancellationToken);

        return true;
    }

    // ─── Internal mapping helpers ──────────────────────────────────────────

    /// <summary>
    /// Resolves a supplier display name. Prefers the company profile name
    /// (suppliers are typically companies), falling back to the user's
    /// first + last name, then to a stable "Unknown Supplier" sentinel.
    /// </summary>
    private static string ResolveSupplierName(ApplicationUser? owner)
    {
        if (owner is null) return "Unknown Supplier";

        var companyName = owner.CompanyProfile?.CompanyName;
        if (!string.IsNullOrWhiteSpace(companyName)) return companyName.Trim();

        var personalName = $"{owner.FirstName} {owner.LastName}".Trim();
        return string.IsNullOrWhiteSpace(personalName) ? "Unknown Supplier" : personalName;
    }

    /// <summary>
    /// Builds the SupplierDto used by both list and details views.
    /// </summary>
    private static SupplierDto BuildSupplierDto(Vehicle? vehicle)
    {
        var owner = vehicle?.User;
        var resolvedName = ResolveSupplierName(owner);
        var companyName = owner?.CompanyProfile?.CompanyName;
        return new SupplierDto(
            owner?.Id ?? Guid.Empty,
            resolvedName,
            resolvedName,
            owner?.Email,
            owner?.PhoneNumber,
            companyName);
    }

    /// <summary>
    /// Builds the VehicleBasicDto for list views.
    /// </summary>
    private static VehicleBasicDto BuildVehicleBasicDto(Vehicle? vehicle)
    {
        return new VehicleBasicDto(
            vehicle?.Id ?? Guid.Empty,
            $"{vehicle?.Make} {vehicle?.Model}".Trim(),
            vehicle?.Images?.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                ?? vehicle?.Images?.FirstOrDefault()?.ImageUrl
                ?? string.Empty,
            vehicle?.LicensePlate);
    }

    /// <summary>
    /// Maps a Booking + its latest payment to a BookingListDto.
    /// </summary>
    private static BookingListDto MapToBookingListDto(Booking b, BookingPayment? payment)
    {
        return new BookingListDto(
            b.Id,
            b.BookingNumber,
            b.User != null ? $"{b.User.FirstName} {b.User.LastName}".Trim() : string.Empty,
            b.TotalDays,
            BuildVehicleBasicDto(b.Vehicle),
            BuildSupplierDto(b.Vehicle),
            b.Driver != null
                ? new DriverDto(
                    b.Driver.Id,
                    $"{b.Driver.User?.FirstName} {b.Driver.User?.LastName}".Trim(),
                    b.Driver.User?.PhoneNumber ?? string.Empty)
                : null,
            new LocationDto(Guid.Empty, b.PickupLocation ?? string.Empty),
            new LocationDto(Guid.Empty, b.DropoffLocation ?? string.Empty),
            b.PickupDate ?? DateTime.MinValue,
            b.ReturnDate ?? DateTime.MinValue,
            b.TotalPrice ?? 0,
            b.Status.ToString(),
            false,
            payment?.Status ?? "Unpaid",
            payment?.PaymentMethod ?? "None",
            b.CreatedAt,
            b.UpdatedAt);
    }

    /// <summary>
    /// Builds the rich BookingDetailsDto. Pulls the latest payment row
    /// and the inspection overview (lightweight) in two extra round-trips.
    /// </summary>
    private async Task<BookingDetailsDto> BuildBookingDetailsDtoAsync(
        Booking booking,
        CancellationToken cancellationToken)
    {
        var latestPayment = await _context.Payments
            .Where(p => p.BookingId == booking.Id)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        var vehicleDto = new VehicleWithSupplierDto(
            booking.Vehicle?.Id ?? Guid.Empty,
            $"{booking.Vehicle?.Make} {booking.Vehicle?.Model}".Trim(),
            booking.Vehicle?.Images?.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                ?? booking.Vehicle?.Images?.FirstOrDefault()?.ImageUrl
                ?? string.Empty,
            BuildSupplierDto(booking.Vehicle),
            booking.Vehicle?.LicensePlate,
            booking.Vehicle?.PricePerDay,
            booking.Vehicle?.Make,
            booking.Vehicle?.Model,
            booking.Vehicle?.Year,
            booking.Vehicle?.AvailabilityStatus);

        DriverDto? driverDto = null;
        if (booking.Driver != null)
        {
            var driverFullName = booking.Driver.User != null
                ? $"{booking.Driver.User.FirstName} {booking.Driver.User.LastName}".Trim()
                : string.Empty;
            driverDto = new DriverDto(
                booking.Driver.Id,
                driverFullName,
                booking.Driver.User?.PhoneNumber ?? string.Empty);
        }

        BookingCustomerDto? customerDto = null;
        if (booking.User is not null)
        {
            // Resolve verification status from the most recent verification row (if any).
            // We surface a simple lifecycle: Approved / Pending / Rejected / NotSubmitted.
            var latestVerification = await _context.Verifications
                .Where(v => v.UserId == booking.User.Id)
                .OrderByDescending(v => v.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);
            var verificationStatus = latestVerification?.Status ?? "NotSubmitted";

            customerDto = new BookingCustomerDto(
                booking.User.Id,
                $"{booking.User.FirstName} {booking.User.LastName}".Trim(),
                booking.User.Email,
                booking.User.PhoneNumber,
                booking.User.ProfileImage,
                booking.User.EmailVerifiedAt.HasValue,
                verificationStatus);
        }

        var inspectionDto = await BuildInspectionOverviewAsync(booking, cancellationToken);

        var pickupName = await ResolveDisplayLocationAsync(booking.PickupLocation, cancellationToken);
        var dropoffName = await ResolveDisplayLocationAsync(booking.DropoffLocation, cancellationToken);

        // ── Pickup / Return inspection full details ───────────────────────
        var inspections = await _context.VehicleInspections
            .Where(i => i.BookingId == booking.Id)
            .Include(i => i.Inspector)
            .Include(i => i.Images)
            .ToListAsync(cancellationToken);

        var pickupInspection = BuildInspectionFullDto(
            inspections.FirstOrDefault(i => string.Equals(i.InspectionType, "Pickup", StringComparison.OrdinalIgnoreCase)));
        var returnInspection = BuildInspectionFullDto(
            inspections.FirstOrDefault(i => string.Equals(i.InspectionType, "Return", StringComparison.OrdinalIgnoreCase)));

        // ── Payment details + refund (best-effort) ────────────────────────
        BookingPaymentDetailsDto? paymentDetails = null;
        if (latestPayment is not null)
        {
            BookingCancellation? cancellationRecord = null;
            if (booking.Status == BookingStatus.Cancelled)
            {
                cancellationRecord = await _context.BookingCancellations
                    .Where(c => c.BookingId == booking.Id)
                    .OrderByDescending(c => c.CreatedAt)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            paymentDetails = new BookingPaymentDetailsDto(
                PaymentId: latestPayment.PaymentId,
                TransactionId: latestPayment.TransactionId == Guid.Empty ? null : latestPayment.TransactionId,
                Method: latestPayment.PaymentMethod,
                Amount: latestPayment.Amount,
                Currency: latestPayment.Currency,
                Status: latestPayment.Status,
                AuthorizationCode: latestPayment.AuthorizationCode,
                ProcessedAt: latestPayment.ProcessedAt,
                FailureReason: latestPayment.FailureReason,
                CreatedAt: latestPayment.CreatedAt,
                RefundAmount: cancellationRecord?.RefundAmount,
                RefundStatus: cancellationRecord?.RefundStatus.ToString(),
                RefundProcessedAt: cancellationRecord?.RefundProcessedAt,
                RefundMethod: cancellationRecord?.RefundMethod);
        }

        // ── Activity timeline from real events ────────────────────────────
        var timeline = await BuildTimelineAsync(booking, inspections, latestPayment, cancellationToken);

        return new BookingDetailsDto(
            Id: booking.Id,
            BookingNumber: booking.BookingNumber,
            Customer: customerDto,
            Car: vehicleDto,
            Driver: driverDto,
            PickupLocation: new LocationDto(Guid.Empty, pickupName),
            DropOffLocation: new LocationDto(Guid.Empty, dropoffName),
            From: booking.PickupDate ?? DateTime.MinValue,
            To: booking.ReturnDate ?? DateTime.MinValue,
            TotalDays: booking.TotalDays,
            Price: booking.TotalPrice ?? 0,
            DailyRate: booking.Vehicle?.PricePerDay,
            Status: booking.Status.ToString(),
            PayLater: false,
            PaymentStatus: latestPayment?.Status ?? "Unpaid",
            PaymentMethod: latestPayment?.PaymentMethod,
            Inspection: inspectionDto,
            CreatedAt: booking.CreatedAt,
            UpdatedAt: booking.UpdatedAt,
            PickupInspection: pickupInspection,
            ReturnInspection: returnInspection,
            PaymentDetails: paymentDetails,
            Timeline: timeline);
    }

    /// <summary>
    /// Maps a VehicleInspection entity (with Inspector + Images) into the
    /// full inspection DTO used by the admin booking page. Returns null when
    /// no inspection row of that type exists.
    /// </summary>
    private static BookingInspectionFullDto? BuildInspectionFullDto(VehicleInspection? inspection)
    {
        if (inspection is null) return null;

        var inspectorName = inspection.Inspector is not null
            ? $"{inspection.Inspector.FirstName} {inspection.Inspector.LastName}".Trim()
            : string.Empty;

        var imageUrls = inspection.Images?
            .OrderBy(i => i.CreatedAt)
            .Select(i => i.ImageUrl)
            .ToList() ?? new List<string>();

        return new BookingInspectionFullDto(
            InspectionId: inspection.InspectionId,
            InspectionType: inspection.InspectionType,
            InspectorId: inspection.InspectorId,
            InspectorName: inspectorName,
            Status: inspection.Status.ToString(),
            InspectionDate: inspection.InspectionDate,
            SubmittedAt: inspection.SubmittedAt,
            IsSubmitted: inspection.IsSubmitted,
            OdometerReading: inspection.OdometerReading,
            FuelLevel: inspection.FuelLevel,
            GeneralCondition: inspection.GeneralCondition,
            Notes: inspection.Notes,
            ImageUrls: imageUrls);
    }

    /// <summary>
    /// Builds a real activity timeline from the booking, its inspections and
    /// the latest payment row. Never emits fake / static entries — every event
    /// reflects a row that actually exists in the database.
    /// </summary>
    private async Task<IReadOnlyList<BookingTimelineEventDto>> BuildTimelineAsync(
        Booking booking,
        IReadOnlyList<VehicleInspection> inspections,
        BookingPayment? latestPayment,
        CancellationToken cancellationToken)
    {
        var events = new List<BookingTimelineEventDto>();

        if (booking.CreatedAt != default)
        {
            events.Add(new BookingTimelineEventDto(
                Type: "BookingCreated",
                Title: "Booking created",
                Description: booking.BookingNumber is null
                    ? null
                    : $"Booking #{booking.BookingNumber} was created.",
                OccurredAt: booking.CreatedAt));
        }

        if (booking.AssignedInspectorId.HasValue)
        {
            // Use the earliest inspection record's CreatedAt as the assignment
            // moment — the inspection row is created when the inspector is
            // assigned.
            var assignment = inspections
                .OrderBy(i => i.CreatedAt)
                .FirstOrDefault();
            var occurredAt = assignment?.CreatedAt ?? booking.UpdatedAt;
            var inspectorName = booking.AssignedInspector is not null
                ? $"{booking.AssignedInspector.FirstName} {booking.AssignedInspector.LastName}".Trim()
                : null;
            events.Add(new BookingTimelineEventDto(
                Type: "InspectorAssigned",
                Title: "Inspector assigned",
                Description: inspectorName is null ? null : $"{inspectorName} was assigned to inspect the vehicle.",
                OccurredAt: occurredAt));
        }

        foreach (var insp in inspections.Where(i => i.IsSubmitted && i.SubmittedAt.HasValue))
        {
            var isPickup = string.Equals(insp.InspectionType, "Pickup", StringComparison.OrdinalIgnoreCase);
            events.Add(new BookingTimelineEventDto(
                Type: isPickup ? "PickupInspectionCompleted" : "ReturnInspectionCompleted",
                Title: isPickup ? "Pickup inspection completed" : "Return inspection completed",
                Description: $"Inspection result: {insp.Status}.",
                OccurredAt: insp.SubmittedAt!.Value));
        }

        if (latestPayment is not null
            && string.Equals(latestPayment.Status, "Completed", StringComparison.OrdinalIgnoreCase)
            && latestPayment.ProcessedAt.HasValue)
        {
            events.Add(new BookingTimelineEventDto(
                Type: "PaymentCompleted",
                Title: "Payment completed",
                Description: $"{latestPayment.Amount:0.00} {latestPayment.Currency} via {latestPayment.PaymentMethod}.",
                OccurredAt: latestPayment.ProcessedAt.Value));
        }

        if (booking.CancelledAt.HasValue)
        {
            events.Add(new BookingTimelineEventDto(
                Type: "BookingCancelled",
                Title: "Booking cancelled",
                Description: booking.CancellationReason,
                OccurredAt: booking.CancelledAt.Value));
        }

        if (booking.Status == BookingStatus.Completed
            && booking.UpdatedAt != default
            && !booking.CancelledAt.HasValue)
        {
            events.Add(new BookingTimelineEventDto(
                Type: "BookingCompleted",
                Title: "Booking marked completed",
                Description: null,
                OccurredAt: booking.UpdatedAt));
        }

        // Best-effort refund event from the latest cancellation row.
        var refund = await _context.BookingCancellations
            .Where(c => c.BookingId == booking.Id && c.RefundProcessedAt.HasValue)
            .OrderByDescending(c => c.RefundProcessedAt)
            .FirstOrDefaultAsync(cancellationToken);
        if (refund is not null && refund.RefundProcessedAt.HasValue)
        {
            events.Add(new BookingTimelineEventDto(
                Type: "RefundProcessed",
                Title: "Refund processed",
                Description: $"Refund {refund.RefundStatus}: {refund.RefundAmount:0.00} {refund.Currency}.",
                OccurredAt: refund.RefundProcessedAt.Value));
        }

        return events
            .OrderBy(e => e.OccurredAt)
            .ToList();
    }

    /// <summary>
    /// Builds a lightweight inspection overview using the mirror status kept on
    /// the booking (<see cref="Booking.InspectionStatus"/>) and the optional
    /// assigned inspector. We intentionally do NOT pull the full
    /// <c>VehicleInspection</c> rows here — the booking details view only
    /// needs an operational overview, not the whole inspection report.
    /// Returns null when there is nothing meaningful to show, so the frontend
    /// can simply hide the section.
    /// </summary>
    private Task<BookingInspectionOverviewDto?> BuildInspectionOverviewAsync(
        Booking booking,
        CancellationToken cancellationToken)
    {
        // If neither an inspector nor a non-default mirror status is set,
        // suppress the section to keep the payload lean.
        if (booking.AssignedInspectorId is null &&
            booking.InspectionStatus == BookingInspectionStatus.NotRequired)
        {
            return Task.FromResult<BookingInspectionOverviewDto?>(null);
        }

        string? assignedName = null;
        if (booking.AssignedInspector is not null)
        {
            var n = $"{booking.AssignedInspector.FirstName} {booking.AssignedInspector.LastName}".Trim();
            assignedName = string.IsNullOrWhiteSpace(n) ? null : n;
        }

        var mirror = booking.InspectionStatus.ToString();
        var dto = new BookingInspectionOverviewDto(
            PreInspectionStatus: mirror,
            PostInspectionStatus: mirror,
            AssignedInspectorId: booking.AssignedInspectorId,
            AssignedInspectorName: assignedName,
            PreInspectionDate: null,
            PostInspectionDate: null);

        return Task.FromResult<BookingInspectionOverviewDto?>(dto);
    }

    /// <summary>
    /// Resolves a location string (which may be a legacy Guid string) into a human-readable name.
    /// </summary>
    private async Task<string> ResolveDisplayLocationAsync(string? locationStr, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(locationStr))
            return string.Empty;

        if (Guid.TryParse(locationStr, out var guid))
        {
            var loc = await _context.UserAddresses.FirstOrDefaultAsync(l => l.Id == guid, cancellationToken);
            if (loc != null)
            {
                var parts = new List<string>();
                if (!string.IsNullOrWhiteSpace(loc.City)) parts.Add(loc.City);
                if (!string.IsNullOrWhiteSpace(loc.Governorate)) parts.Add(loc.Governorate);
                if (!string.IsNullOrWhiteSpace(loc.Country)) parts.Add(loc.Country);
                if (parts.Count > 0) return string.Join(", ", parts);
            }
            return "Unknown Location";
        }

        return locationStr;
    }
}
