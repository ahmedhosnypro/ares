using Backend.Application.DTOs.Booking;
using Backend.Application.DTOs.Common;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services;

/// <summary>
/// Service implementation for booking-related operations
/// Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10
/// </summary>
public class BookingService : IBookingService
{
    private readonly IBookingRepository _bookingRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IApplicationDbContext _context;
    private readonly INotificationService? _notificationService;

    public BookingService(
        IBookingRepository bookingRepository,
        IVehicleRepository vehicleRepository,
        IApplicationDbContext context,
        INotificationService? notificationService = null)
    {
        _bookingRepository = bookingRepository;
        _vehicleRepository = vehicleRepository;
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<BookingResponse> CreateBookingAsync(
        CreateBookingRequest request,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Requirement 4.4: Validate that pickup date is before return date
        if (request.PickupDate >= request.ReturnDate)
        {
            throw new ValidationException("DateRange", "Pickup date must be before return date");
        }

        // Requirement 4.3: Check vehicle availability for date range
        var isAvailable = await _vehicleRepository.IsAvailableAsync(
            request.VehicleId,
            request.PickupDate,
            request.ReturnDate,
            cancellationToken);

        if (!isAvailable)
        {
            throw new ConflictException("Vehicle is not available for the selected dates");
        }

        // Get vehicle to calculate price
        var vehicle = await _vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);
        if (vehicle == null)
        {
            throw new NotFoundException($"Vehicle with ID {request.VehicleId} not found");
        }

        // Requirement 4.2: Calculate total price (days * pricePerDay)
        var totalDays = (request.ReturnDate - request.PickupDate).Days;
        var totalPrice = (vehicle.PricePerDay ?? 0) * totalDays;

        // Requirement 4.5: Generate unique booking number
        var bookingNumber = GenerateUniqueBookingNumber();

        // Requirement 4.10: Create booking with status "Pending"
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            BookingNumber = bookingNumber,
            UserId = userId,
            VehicleId = request.VehicleId,
            PickupDate = request.PickupDate,
            ReturnDate = request.ReturnDate,
            TotalDays = totalDays,
            TotalPrice = totalPrice,
            Status = BookingStatus.Pending,
            DriverId = request.DriverId,
            RequiresDriver = request.DriverId.HasValue
        };

        // Requirement 4.1: Create booking and mark vehicle as unavailable for those dates
        await _bookingRepository.AddAsync(booking, cancellationToken);
        await _bookingRepository.SaveChangesAsync(cancellationToken);

        // Requirement 4.8: Create notification for customer
        await CreateBookingNotificationAsync(userId, bookingNumber, cancellationToken);

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
        var totalCount = bookingList.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)request.Size);
        var skip = (request.Page - 1) * request.Size;
        var pagedBookings = bookingList.Skip(skip).Take(request.Size).ToList();

        var bookingDtos = pagedBookings.Select(b => new BookingListDto(
            b.Id,
            new VehicleBasicDto(
                b.Vehicle?.Id ?? Guid.Empty,
                $"{b.Vehicle?.Make} {b.Vehicle?.Model}".Trim(),
                b.Vehicle?.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                    ?? b.Vehicle?.Images.FirstOrDefault()?.ImageUrl
                    ?? string.Empty
            ),
            new SupplierDto(
                b.Vehicle?.User?.Id ?? Guid.Empty,
                $"{b.Vehicle?.User?.FirstName} {b.Vehicle?.User?.LastName}".Trim()
            ),
            b.Driver != null ? new DriverDto(
                b.Driver.Id,
                $"{b.Driver.User?.FirstName} {b.Driver.User?.LastName}".Trim(),
                b.Driver.User?.Email ?? string.Empty
            ) : null,
            new LocationDto(Guid.Empty, b.PickupLocation ?? "Pickup Location"),
            new LocationDto(Guid.Empty, b.DropoffLocation ?? "Drop-off Location"),
            b.PickupDate ?? DateTime.MinValue,
            b.ReturnDate ?? DateTime.MinValue,
            b.TotalPrice ?? 0,
            b.Status.ToString(),
            false, // PayLater flag - placeholder until field is added to entity
            b.CreatedAt,
            b.UpdatedAt
        )).ToList();

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
        CancellationToken cancellationToken = default)
    {
        var booking = await _bookingRepository.GetBookingWithDetailsAsync(bookingId, cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException($"Booking with ID {bookingId} not found");
        }

        // Verify booking belongs to authenticated user
        if (booking.UserId != userId)
        {
            throw new ForbiddenException("You do not have permission to view this booking");
        }

        var vehicleDto = new VehicleWithSupplierDto(
            booking.Vehicle?.Id ?? Guid.Empty,
            $"{booking.Vehicle?.Make} {booking.Vehicle?.Model}".Trim(),
            booking.Vehicle?.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                ?? booking.Vehicle?.Images.FirstOrDefault()?.ImageUrl
                ?? string.Empty,
            new SupplierDto(
                booking.Vehicle?.User?.Id ?? Guid.Empty,
                $"{booking.Vehicle?.User?.FirstName} {booking.Vehicle?.User?.LastName}".Trim()
            )
        );

        DriverDto? driverDto = null;
        if (booking.Driver != null)
        {
            var driverFullName = booking.Driver.User != null ? $"{booking.Driver.User.FirstName} {booking.Driver.User.LastName}".Trim() : string.Empty;
            driverDto = new DriverDto(
                booking.Driver.Id,
                driverFullName,
                booking.Driver.User?.PhoneNumber ?? string.Empty
            );
        }

        return new BookingDetailsDto(
            booking.Id,
            vehicleDto,
            driverDto,
            new LocationDto(Guid.Empty, booking.PickupLocation ?? "Pickup Location"),
            new LocationDto(Guid.Empty, booking.DropoffLocation ?? "Drop-off Location"),
            booking.PickupDate ?? DateTime.MinValue,
            booking.ReturnDate ?? DateTime.MinValue,
            booking.TotalPrice ?? 0,
            booking.Status.ToString(),
            false // PayLater flag - placeholder until field is added to entity
        );
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

        var bookingDtos = pagedBookings.Select(b => new BookingListDto(
            b.Id,
            new VehicleBasicDto(
                b.Vehicle?.Id ?? Guid.Empty,
                $"{b.Vehicle?.Make} {b.Vehicle?.Model}".Trim(),
                b.Vehicle?.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                    ?? b.Vehicle?.Images.FirstOrDefault()?.ImageUrl
                    ?? string.Empty
            ),
            new SupplierDto(
                b.Vehicle?.User?.Id ?? Guid.Empty,
                $"{b.Vehicle?.User?.FirstName} {b.Vehicle?.User?.LastName}".Trim()
            ),
            b.Driver != null ? new DriverDto(
                b.Driver.Id,
                $"{b.Driver.User?.FirstName} {b.Driver.User?.LastName}".Trim(),
                b.Driver.User?.Email ?? string.Empty
            ) : null,
            new LocationDto(Guid.Empty, b.PickupLocation ?? "Pickup Location"),
            new LocationDto(Guid.Empty, b.DropoffLocation ?? "Drop-off Location"),
            b.PickupDate ?? DateTime.MinValue,
            b.ReturnDate ?? DateTime.MinValue,
            b.TotalPrice ?? 0,
            b.Status.ToString(),
            false, // PayLater flag - placeholder until field is added to entity
            b.CreatedAt,
            b.UpdatedAt
        )).ToList();

        return new PagedResult<BookingListDto>(
            bookingDtos,
            page,
            size,
            totalCount,
            totalPages
        );
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

        var vehicleDto = new VehicleWithSupplierDto(
            booking.Vehicle?.Id ?? Guid.Empty,
            $"{booking.Vehicle?.Make} {booking.Vehicle?.Model}".Trim(),
            booking.Vehicle?.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                ?? booking.Vehicle?.Images.FirstOrDefault()?.ImageUrl
                ?? string.Empty,
            new SupplierDto(
                booking.Vehicle?.User?.Id ?? Guid.Empty,
                $"{booking.Vehicle?.User?.FirstName} {booking.Vehicle?.User?.LastName}".Trim()
            )
        );

        DriverDto? driverDto = null;
        if (booking.Driver != null)
        {
            var driverFullName = booking.Driver.User != null ? $"{booking.Driver.User.FirstName} {booking.Driver.User.LastName}".Trim() : string.Empty;
            driverDto = new DriverDto(
                booking.Driver.Id,
                driverFullName,
                booking.Driver.User?.PhoneNumber ?? string.Empty
            );
        }

        return new BookingDetailsDto(
            booking.Id,
            vehicleDto,
            driverDto,
            new LocationDto(Guid.Empty, booking.PickupLocation ?? "Pickup Location"),
            new LocationDto(Guid.Empty, booking.DropoffLocation ?? "Drop-off Location"),
            booking.PickupDate ?? DateTime.MinValue,
            booking.ReturnDate ?? DateTime.MinValue,
            booking.TotalPrice ?? 0,
            booking.Status.ToString(),
            false
        );
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

        // Validate status transition
        if (booking.Status == Backend.Domain.Entities.Enums.BookingStatus.Cancelled || booking.Status == Backend.Domain.Entities.Enums.BookingStatus.Completed)
        {
            throw new ValidationException("Status", $"Cannot update status from {booking.Status}");
        }

        if (!Enum.TryParse<Backend.Domain.Entities.Enums.BookingStatus>(newStatus, true, out var parsedStatus))
        {
            throw new ValidationException("Status", $"Invalid status value: {newStatus}");
        }

        booking.Status = parsedStatus;
        booking.UpdatedAt = DateTime.UtcNow;

        await _bookingRepository.UpdateAsync(booking, cancellationToken);
        await _bookingRepository.SaveChangesAsync(cancellationToken);

        // Fire-and-forget notification for the customer (best-effort).
        await NotifyBookingStatusChangeAsync(booking, parsedStatus, cancellationToken);

        return true;
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
    /// Creates a notification for the customer after booking creation.
    /// Requirement 4.8: Create notification for customer
    /// Wrapped in try/catch so notification failures never break the booking flow.
    /// </summary>
    private async Task CreateBookingNotificationAsync(
        Guid userId,
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
                "BookingPending",
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
                        "BookingApproved",
                        cancellationToken);
                    break;

                case Backend.Domain.Entities.Enums.BookingStatus.Cancelled:
                    await _notificationService.CreateNotificationAsync(
                        booking.UserId,
                        "Booking Rejected",
                        $"Your booking {bookingLabel} has been rejected or cancelled. Please review your bookings for details.",
                        "BookingRejected",
                        cancellationToken);
                    break;

                case Backend.Domain.Entities.Enums.BookingStatus.Completed:
                    await _notificationService.CreateNotificationAsync(
                        booking.UserId,
                        "Booking Completed",
                        $"Your booking {bookingLabel} has been completed. Thank you for choosing us!",
                        "BookingCompleted",
                        cancellationToken);

                    // Review-available notification (Requirement: review available).
                    await _notificationService.CreateNotificationAsync(
                        booking.UserId,
                        "Share your experience",
                        $"You can now leave a review for booking {bookingLabel}.",
                        "ReviewAvailable",
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
}
