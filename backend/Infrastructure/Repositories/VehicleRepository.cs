using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Vehicle entity with specialized vehicle operations
/// </summary>
public class VehicleRepository : PaginatedRepository<Vehicle>, IVehicleRepository
{
    public VehicleRepository(ApplicationDbContext context) : base(context)
    {
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

        var seats = vehicle.Seats ?? 0;
        var dailyRate = vehicle.PricePerDay ?? 0;
        var fuelType = vehicle.FuelType?.Trim().ToLowerInvariant() ?? string.Empty;
        var make = vehicle.Make?.Trim().ToLowerInvariant() ?? string.Empty;

        return requested switch
        {
            "compact" or "mini" or "compact-mini" or "economy" =>
                seats is > 0 and <= 4 || dailyRate is > 0 and <= 70,
            "mid-size" or "midsize" or "standard" =>
                seats == 5 && dailyRate is > 70 and <= 120,
            "suv" or "maxi" or "suv-maxi" =>
                status.Contains("suv") || seats >= 6,
            "electric" =>
                fuelType.Contains("electric"),
            "luxury" =>
                dailyRate >= 150 || make is "bmw" or "mercedes" or "audi" or "lexus",
            _ => status.Contains(requested)
        };
    }

    public async Task<bool> IsAvailableAsync(
        Guid vehicleId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default)
    {
        var hasOverlappingBooking = await _context.Bookings
            .AnyAsync(b =>
                b.VehicleId == vehicleId &&
                b.Status != "Cancelled" &&
                b.PickupDate < endDate &&
                b.ReturnDate > startDate,
                cancellationToken);

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
