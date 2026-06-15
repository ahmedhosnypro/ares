using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Vehicle entity with specialized vehicle operations
/// </summary>
public class VehicleRepository : PaginatedRepository<Vehicle>, IVehicleRepository
{
    private readonly ILogger<VehicleRepository>? _logger;

    public VehicleRepository(ApplicationDbContext context, ILogger<VehicleRepository>? logger = null) : base(context)
    {
        _logger = logger;
    }

    public async Task<IEnumerable<Vehicle>> SearchAvailableVehiclesAsync(
        Guid pickupLocationId,
        Guid? returnLocationId,
        DateTime pickupDate,
        DateTime returnDate,
        string? category = null,
        string? transmission = null,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        CancellationToken cancellationToken = default)
    {
        var locationQuery = _context.UserAddresses.Where(address => address.Id == pickupLocationId);
        if (returnLocationId.HasValue)
        {
            locationQuery = locationQuery.Concat(
                _context.UserAddresses.Where(address => address.Id == returnLocationId.Value));
        }

        var locationRecords = await locationQuery
            .Select(address => new { address.City, address.Governorate, address.Country })
            .ToListAsync(cancellationToken);
        var locationTerms = locationRecords
            .SelectMany(address => new[] { address.City, address.Governorate, address.Country })
            .Where(term => !string.IsNullOrWhiteSpace(term))
            .Select(term => term!.Trim().ToLowerInvariant())
            .Distinct()
            .ToList();

        if (locationTerms.Count == 0)
        {
            return Enumerable.Empty<Vehicle>();
        }

        var query = _dbSet
            .Include(v => v.Images)
            .Include(v => v.User)
            .Include(v => v.Category)
            .Where(v => v.IsActive && v.AvailabilityStatus == "Available")
            .Where(v =>
                v.LocationCity != null &&
                locationTerms.Contains(v.LocationCity.Trim().ToLower()));

        if (!string.IsNullOrWhiteSpace(transmission))
        {
            var normalizedTransmission = transmission.Trim().ToLower();
            query = query.Where(v => v.Transmission != null && v.Transmission.Trim().ToLower() == normalizedTransmission);
        }

        if (minPrice.HasValue)
        {
            query = query.Where(v => v.PricePerDay >= minPrice.Value);
        }

        if (maxPrice.HasValue)
        {
            query = query.Where(v => v.PricePerDay <= maxPrice.Value);
        }

        var vehicles = await query.ToListAsync(cancellationToken);

        var availableVehicles = new List<Vehicle>();
        foreach (var vehicle in vehicles)
        {
            var isAvailable = await IsAvailableAsync(vehicle.Id, pickupDate, returnDate, cancellationToken);
            if (isAvailable)
            {
                availableVehicles.Add(vehicle);
            }
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            availableVehicles = availableVehicles
                .Where(vehicle => MatchesRequestedCategory(vehicle, category))
                .ToList();
        }

        return availableVehicles;
    }

    private static bool MatchesRequestedCategory(Vehicle vehicle, string category)
    {
        var requested = category.Trim().ToLowerInvariant();
        if (requested == string.Empty)
        {
            return true;
        }

        var status = vehicle.Status?.Trim().ToLowerInvariant() ?? string.Empty;
        if (status == requested)
        {
            return true;
        }

        // Define known category groups to protect explicit categories from cross-matching.
        var compactGroup = new[] { "compact", "mini", "compact-mini", "economy", "hatchback", "coupe" };
        var standardGroup = new[] { "standard", "mid-size", "midsize", "sedan" };
        var premiumGroup = new[] { "premium", "suv", "maxi", "suv-maxi" };

        var isCompactStatus = compactGroup.Contains(status);
        var isStandardStatus = standardGroup.Contains(status);
        var isPremiumStatus = premiumGroup.Contains(status);

        if (isCompactStatus || isStandardStatus || isPremiumStatus)
        {
            var isCompactRequested = compactGroup.Contains(requested);
            var isStandardRequested = standardGroup.Contains(requested);
            var isPremiumRequested = premiumGroup.Contains(requested);

            if (isCompactStatus && isCompactRequested) return true;
            if (isStandardStatus && isStandardRequested) return true;
            if (isPremiumStatus && isPremiumRequested) return true;

            if (isCompactStatus && !isCompactRequested) return false;
            if (isStandardStatus && !isStandardRequested) return false;
            if (isPremiumStatus && !isPremiumRequested) return false;
        }

        var seats = vehicle.Seats ?? 0;
        var dailyRate = vehicle.PricePerDay ?? 0;
        var fuelType = vehicle.FuelType?.Trim().ToLowerInvariant() ?? string.Empty;
        var make = vehicle.Make?.Trim().ToLowerInvariant() ?? string.Empty;
        var model = vehicle.Model?.Trim().ToLowerInvariant() ?? string.Empty;
        var description = vehicle.Description?.Trim().ToLowerInvariant() ?? string.Empty;

        // Conduct focused checks to resolve confusion around large 4-passenger vehicles and SUVs.
        var isSuvKeyword = model.Contains("suv") || model.Contains("crossover") || 
                           description.Contains("suv") || description.Contains("crossover");

        var isLargeKeyword = model.Contains("large") || description.Contains("large") || 
                             model.Contains("wagon") || description.Contains("wagon") ||
                             model.Contains("truck") || description.Contains("truck") ||
                             model.Contains("pickup") || description.Contains("pickup") ||
                             description.Contains("midsize") || description.Contains("mid-size") ||
                             description.Contains("standard");

        return requested switch
        {
            "compact" or "mini" or "compact-mini" or "economy" =>
                seats is > 0 and <= 4 && !isSuvKeyword && !isLargeKeyword && dailyRate <= 60,
            "mid-size" or "midsize" or "standard" =>
                ((seats is 4 or 5) && !isSuvKeyword) || (isLargeKeyword && !isSuvKeyword),
            "suv" or "maxi" or "suv-maxi" or "premium" =>
                isSuvKeyword || (seats >= 5 && dailyRate > 80) || seats >= 6,
            "electric" =>
                fuelType.Contains("electric"),
            "luxury" =>
                dailyRate >= 150 || make is "bmw" or "mercedes" or "audi" or "lexus",
            _ => status.Contains(requested)
        };
    }

    /// <summary>
    /// Non-locking availability pre-check (used for vehicle search and as a
    /// cheap early-out before the authoritative, race-safe reservation in
    /// <see cref="IBookingRepository.ReserveVehicleAtomicAsync"/>).
    ///
    /// A vehicle is unavailable when an overlapping booking exists in a
    /// reserving status (see <see cref="Backend.Domain.Entities.Enums.BookingStatusPolicy.ReservingStatuses"/>).
    /// A <c>PaymentPending</c> booking whose hold has already expired is treated
    /// as free (the vehicle is released the moment the hold lapses, even before
    /// the background sweep flips it to <c>Expired</c>).
    /// </summary>
    public async Task<bool> IsAvailableAsync(
        Guid vehicleId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default,
        Guid? excludeUserId = null,
        Guid? excludeBookingId = null)
    {
        var nowUtc = DateTime.UtcNow;
        var reserving = Backend.Domain.Entities.Enums.BookingStatusPolicy.ReservingStatuses;

        var conflicts = await _context.Bookings
            .Where(b =>
                b.VehicleId == vehicleId &&
                b.Id != excludeBookingId &&
                !(excludeUserId.HasValue && b.UserId == excludeUserId.Value && b.Status == Backend.Domain.Entities.Enums.BookingStatus.PaymentPending) &&
                reserving.Contains(b.Status) &&
                !(b.Status == Backend.Domain.Entities.Enums.BookingStatus.PaymentPending &&
                  b.HoldExpiresAt != null &&
                  b.HoldExpiresAt <= nowUtc) &&
                b.PickupDate < endDate &&
                b.ReturnDate > startDate)
            .Select(b => new { b.Id, b.Status, b.HoldExpiresAt, b.UserId })
            .ToListAsync(cancellationToken);

        var hasOverlappingBooking = conflicts.Any();

        if (_logger != null)
        {
            _logger.LogInformation(
                "Vehicle availability check: VehicleId={VehicleId}, StartDate={StartDate}, EndDate={EndDate}, Decision={Available}, ExcludeUserId={ExcludeUserId}, ExcludeBookingId={ExcludeBookingId}",
                vehicleId, startDate, endDate, !hasOverlappingBooking, excludeUserId, excludeBookingId);
            
            foreach (var conflict in conflicts)
            {
                _logger.LogWarning(
                    "Vehicle availability conflict: VehicleId={VehicleId}, ConflictingBookingId={BookingId}, ConflictingBookingStatus={BookingStatus}, ConflictingBookingHoldExpiration={HoldExpiration}, ConflictingCustomerId={CustomerId}",
                    vehicleId, conflict.Id, conflict.Status, conflict.HoldExpiresAt, conflict.UserId);
            }
        }

        return !hasOverlappingBooking;
    }

    public async Task<IEnumerable<VehicleImage>> GetVehicleImagesAsync(
        Guid vehicleId,
        CancellationToken cancellationToken = default)
    {
        return await _context.VehicleImages
            .Where(vi => vi.VehicleId == vehicleId)
            .OrderByDescending(vi => vi.IsPrimary)
            .ThenBy(vi => vi.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
