using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Booking entity with specialized booking operations
/// </summary>
public class BookingRepository : PaginatedRepository<Booking>, IBookingRepository
{
    private readonly ILogger<BookingRepository>? _logger;

    public BookingRepository(ApplicationDbContext context, ILogger<BookingRepository>? logger = null) : base(context)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task ReserveVehicleAtomicAsync(
        Booking booking,
        BookingStatus targetStatus,
        DateTime? holdStartedAt,
        DateTime? holdExpiresAt,
        CancellationToken cancellationToken = default)
    {
        if (booking.PickupDate is null || booking.ReturnDate is null)
        {
            throw new BadRequestException("Booking is missing pickup/return dates.");
        }

        var pickup = booking.PickupDate.Value;
        var ret = booking.ReturnDate.Value;

        // Make sure the entity participates in this DbContext so the
        // SaveChanges below persists the transition (and any other changes the
        // caller has already staged on the shared context).
        var entry = _context.Entry(booking);
        if (entry.State == EntityState.Detached)
        {
            _context.Attach(booking);
        }

        if (_context.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory")
        {
            var nowUtc = DateTime.UtcNow;
            var reserving = BookingStatusPolicy.ReservingStatuses;
            var overlaps = await _context.Bookings.AnyAsync(b =>
                b.VehicleId == booking.VehicleId &&
                b.Id != booking.Id &&
                reserving.Contains(b.Status) &&
                !(b.UserId == booking.UserId && b.Status == BookingStatus.PaymentPending) &&
                !(b.Status == BookingStatus.PaymentPending && b.HoldExpiresAt != null && b.HoldExpiresAt <= nowUtc) &&
                b.PickupDate < ret &&
                b.ReturnDate > pickup,
                cancellationToken);

            if (overlaps)
            {
                var conflictDetails = await _context.Bookings
                    .Where(b => b.VehicleId == booking.VehicleId
                        && b.Id != booking.Id
                        && reserving.Contains(b.Status)
                        && !(b.UserId == booking.UserId && b.Status == BookingStatus.PaymentPending)
                        && !(b.Status == BookingStatus.PaymentPending && b.HoldExpiresAt != null && b.HoldExpiresAt <= nowUtc)
                        && b.PickupDate < ret
                        && b.ReturnDate > pickup)
                    .Select(b => new { b.Id, b.Status, b.HoldExpiresAt, b.UserId })
                    .ToListAsync(cancellationToken);

                if (_logger != null)
                {
                    _logger.LogWarning(
                        "ReserveVehicleAtomicAsync conflict detected (InMemory): VehicleId={VehicleId}, AttemptedBookingId={BookingId}, CustomerId={CustomerId}",
                        booking.VehicleId, booking.Id, booking.UserId);
                    
                    foreach (var conflict in conflictDetails)
                    {
                        _logger.LogWarning(
                            "ReserveVehicleAtomicAsync conflicting booking (InMemory): VehicleId={VehicleId}, ConflictingBookingId={BookingId}, ConflictingBookingStatus={BookingStatus}, ConflictingBookingHoldExpiration={HoldExpiration}, ConflictingCustomerId={CustomerId}",
                            booking.VehicleId, conflict.Id, conflict.Status, conflict.HoldExpiresAt, conflict.UserId);
                    }
                }

                throw new ConflictException("This vehicle has just been reserved by another customer.");
            }

            booking.Status = targetStatus;
            booking.HoldStartedAt = holdStartedAt;
            booking.HoldExpiresAt = holdExpiresAt;
            await _context.SaveChangesAsync(cancellationToken);

            if (_logger != null)
            {
                _logger.LogInformation(
                    "ReserveVehicleAtomicAsync success (InMemory): VehicleId={VehicleId}, BookingId={BookingId}, Status={Status}, HoldExpiresAt={HoldExpiresAt}, CustomerId={CustomerId}",
                    booking.VehicleId, booking.Id, targetStatus, holdExpiresAt, booking.UserId);
            }
            return;
        }

        // CreateExecutionStrategy() is required when issuing an explicit
        // transaction so we cooperate with any configured retry strategy.
        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable, cancellationToken);

            var nowUtc = DateTime.UtcNow;
            var reserving = BookingStatusPolicy.ReservingStatuses;

            // Range-lock the overlapping-booking key range for this vehicle.
            // UPDLOCK + HOLDLOCK forces a concurrent transaction to block here
            // (rather than also reading "no overlap"), and HOLDLOCK takes the
            // key-range / serializable lock that prevents phantom inserts. An
            // expired PaymentPending hold is excluded so a lapsed hold never
            // blocks a new reservation.
            //
            // Exclude current user's own PaymentPending holds.
            //
            // The status literals MUST match
            // BookingStatusPolicy.ReservingStatuses.
            var conflicts = await _context.Database
                .SqlQueryRaw<int>(
                    @"SELECT COUNT(*) AS [Value]
                      FROM [Bookings] WITH (UPDLOCK, HOLDLOCK)
                      WHERE [VehicleId] = {0}
                        AND [Id] <> {1}
                        AND [Status] IN ('Pending','PaymentPending','Confirmed','Active','Approved','ReadyForDelivery','WaitingForDriver','NoDriverAvailable','InspectionFailed')
                        AND NOT ([Status] = 'PaymentPending'
                                 AND [HoldExpiresAt] IS NOT NULL
                                 AND [HoldExpiresAt] <= {2})
                        AND NOT ([UserId] = {5} AND [Status] = 'PaymentPending')
                        AND [PickupDate] < {3}
                        AND [ReturnDate] > {4}",
                    booking.VehicleId, booking.Id, nowUtc, ret, pickup, booking.UserId)
                .ToListAsync(cancellationToken);

            if (conflicts.Count > 0 && conflicts[0] > 0)
            {
                var conflictDetails = await _context.Bookings
                    .Where(b => b.VehicleId == booking.VehicleId
                        && b.Id != booking.Id
                        && reserving.Contains(b.Status)
                        && !(b.UserId == booking.UserId && b.Status == BookingStatus.PaymentPending)
                        && !(b.Status == BookingStatus.PaymentPending && b.HoldExpiresAt != null && b.HoldExpiresAt <= nowUtc)
                        && b.PickupDate < ret
                        && b.ReturnDate > pickup)
                    .Select(b => new { b.Id, b.Status, b.HoldExpiresAt, b.UserId })
                    .ToListAsync(cancellationToken);

                if (_logger != null)
                {
                    _logger.LogWarning(
                        "ReserveVehicleAtomicAsync conflict detected: VehicleId={VehicleId}, AttemptedBookingId={BookingId}, CustomerId={CustomerId}",
                        booking.VehicleId, booking.Id, booking.UserId);
                    
                    foreach (var conflict in conflictDetails)
                    {
                        _logger.LogWarning(
                            "ReserveVehicleAtomicAsync conflicting booking: VehicleId={VehicleId}, ConflictingBookingId={BookingId}, ConflictingBookingStatus={BookingStatus}, ConflictingBookingHoldExpiration={HoldExpiration}, ConflictingCustomerId={CustomerId}",
                            booking.VehicleId, conflict.Id, conflict.Status, conflict.HoldExpiresAt, conflict.UserId);
                    }
                }

                await tx.RollbackAsync(cancellationToken);
                throw new ConflictException(
                    "This vehicle has just been reserved by another customer.");
            }

            booking.Status = targetStatus;
            booking.HoldStartedAt = holdStartedAt;
            booking.HoldExpiresAt = holdExpiresAt;
            // UpdatedAt is stamped by AuditableEntityInterceptor.

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                await tx.RollbackAsync(cancellationToken);
                throw new ConflictException(
                    "This vehicle has just been reserved by another customer.");
            }

            if (_logger != null)
            {
                _logger.LogInformation(
                    "ReserveVehicleAtomicAsync success: VehicleId={VehicleId}, BookingId={BookingId}, Status={Status}, HoldExpiresAt={HoldExpiresAt}, CustomerId={CustomerId}",
                    booking.VehicleId, booking.Id, targetStatus, holdExpiresAt, booking.UserId);
            }

            await tx.CommitAsync(cancellationToken);
        });
    }

    public async Task<IEnumerable<Booking>> GetUserBookingsAsync(
        Guid userId,
        List<Guid>? suppliers = null,
        List<string>? statuses = null,
        Guid? carId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? keyword = null,
        Guid? pickupLocationId = null,
        Guid? dropOffLocationId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .AsNoTracking()
            .Include(b => b.Vehicle)
                .ThenInclude(v => v!.Images)
            .Include(b => b.Vehicle)
                .ThenInclude(v => v!.User)
                    .ThenInclude(u => u!.CompanyProfile)
            .Include(b => b.Driver)
                .ThenInclude(d => d!.User)
            .Include(b => b.User)
            .Where(b => b.UserId == userId);

        // Filter by suppliers (vehicle owners)
        if (suppliers != null && suppliers.Any())
        {
            query = query.Where(b => b.Vehicle != null && suppliers.Contains(b.Vehicle.UserId));
        }

        // Filter by statuses
        if (statuses != null && statuses.Any())
        {
            var enumStatuses = statuses
                .Select(s => Enum.TryParse<BookingStatus>(s, true, out var parsed) ? parsed : (BookingStatus?)null)
                .Where(s => s.HasValue)
                .Select(s => s!.Value)
                .ToList();

            if (enumStatuses.Any())
            {
                query = query.Where(b => enumStatuses.Contains(b.Status));
            }
        }

        // Filter by vehicle ID
        if (carId.HasValue)
        {
            query = query.Where(b => b.VehicleId == carId.Value);
        }

        // Filter by date range
        if (fromDate.HasValue)
        {
            query = query.Where(b => b.PickupDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(b => b.ReturnDate <= toDate.Value);
        }

        // Filter by keyword (search in booking number and vehicle name)
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var lowerKeyword = keyword.ToLower();
            query = query.Where(b =>
                (b.BookingNumber != null && b.BookingNumber.ToLower().Contains(lowerKeyword)) ||
                (b.Vehicle != null && b.Vehicle.Make != null && b.Vehicle.Make.ToLower().Contains(lowerKeyword)) ||
                (b.Vehicle != null && b.Vehicle.Model != null && b.Vehicle.Model.ToLower().Contains(lowerKeyword)));
        }

        // Note: pickupLocationId and dropOffLocationId filters are included in the interface
        // but cannot be implemented until location fields are added to the Booking entity

        return await query
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasActiveBookingsAsync(
        Guid vehicleId,
        CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;
        var reserving = BookingStatusPolicy.ReservingStatuses;
        return await _dbSet
            .AnyAsync(b =>
                b.VehicleId == vehicleId &&
                reserving.Contains(b.Status) &&
                !(b.Status == BookingStatus.PaymentPending &&
                  b.HoldExpiresAt != null &&
                  b.HoldExpiresAt <= nowUtc),
                cancellationToken);
    }

    public async Task<bool> HasUserBookingsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(b => b.UserId == userId, cancellationToken);
    }

    public async Task<Booking?> GetBookingWithDetailsAsync(
        Guid bookingId,
        CancellationToken cancellationToken = default)
    {
        // NOTE: Intentionally NOT AsNoTracking — this is also used by
        // UpdateBookingStatusAsync / Edit Booking flow which mutates the
        // returned entity. Read-only callers may project as needed.
        return await _dbSet
            .Include(b => b.Vehicle)
                .ThenInclude(v => v!.Images)
            .Include(b => b.Vehicle)
                .ThenInclude(v => v!.User)
                    .ThenInclude(u => u!.CompanyProfile)
            .Include(b => b.Driver)
                .ThenInclude(d => d!.User)
            .Include(b => b.User)
            .Include(b => b.AssignedInspector)
            .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken);
    }

    public async Task<IEnumerable<Booking>> GetAdminBookingsAsync(
        Guid? supplierId = null,
        List<string>? statuses = null,
        Guid? carId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? keyword = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .AsNoTracking()
            .Include(b => b.Vehicle)
                .ThenInclude(v => v!.Images)
            .Include(b => b.Vehicle)
                .ThenInclude(v => v!.User)
                    .ThenInclude(u => u!.CompanyProfile)
            .Include(b => b.Driver)
                .ThenInclude(d => d!.User)
            .Include(b => b.User)
            .AsQueryable();

        // Filter by supplier (vehicle owner)
        if (supplierId.HasValue)
        {
            query = query.Where(b => b.Vehicle != null && b.Vehicle.UserId == supplierId.Value);
        }

        // Filter by statuses
        if (statuses != null && statuses.Any())
        {
            var enumStatuses = statuses
                .Select(s => Enum.TryParse<BookingStatus>(s, true, out var parsed) ? parsed : (BookingStatus?)null)
                .Where(s => s.HasValue)
                .Select(s => s!.Value)
                .ToList();

            if (enumStatuses.Any())
            {
                query = query.Where(b => enumStatuses.Contains(b.Status));
            }
        }

        // Filter by vehicle ID
        if (carId.HasValue)
        {
            query = query.Where(b => b.VehicleId == carId.Value);
        }

        // Filter by date range
        if (fromDate.HasValue)
        {
            query = query.Where(b => b.PickupDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(b => b.ReturnDate <= toDate.Value);
        }

        // Filter by keyword (search in booking number, vehicle name, customer name)
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var lowerKeyword = keyword.ToLower();
            query = query.Where(b =>
                (b.BookingNumber != null && b.BookingNumber.ToLower().Contains(lowerKeyword)) ||
                (b.Vehicle != null && b.Vehicle.Make != null && b.Vehicle.Make.ToLower().Contains(lowerKeyword)) ||
                (b.Vehicle != null && b.Vehicle.Model != null && b.Vehicle.Model.ToLower().Contains(lowerKeyword)) ||
                (b.User != null && b.User.FirstName != null && b.User.FirstName.ToLower().Contains(lowerKeyword)) ||
                (b.User != null && b.User.LastName != null && b.User.LastName.ToLower().Contains(lowerKeyword)));
        }

        return await query
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Booking>> GetAssignmentsForDriverAsync(
        Guid driverProfileId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(b => b.Vehicle)
            .Include(b => b.User)
            .Where(b => b.AssignedDriverProfileId == driverProfileId)
            .OrderBy(b => b.PickupDate)
            .ToListAsync(cancellationToken);
    }
}
