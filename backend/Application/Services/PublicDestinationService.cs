using Backend.Application.DTOs.Public;
using Backend.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services;

public class PublicDestinationService : IPublicDestinationService
{
    private readonly IApplicationDbContext _context;

    public PublicDestinationService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<PublicDestinationDto>> GetPopularDestinationsAsync(
        int limit,
        CancellationToken cancellationToken = default)
    {
        var normalizedLimit = Math.Clamp(limit, 1, 24);

        var locations = await _context.UserAddresses
            .Where(address =>
                !string.IsNullOrWhiteSpace(address.City) &&
                !string.IsNullOrWhiteSpace(address.Country))
            .Select(address => new
            {
                address.Id,
                address.City,
                address.Country,
                address.Governorate,
                address.ImageUrl,
                address.IsPrimary
            })
            .ToListAsync(cancellationToken);

        var destinationLocations = locations
            .GroupBy(location => BuildCityKey(location.City))
            .Select(group =>
            {
                var representative = group
                    .OrderByDescending(location => location.IsPrimary)
                    .ThenByDescending(location => !string.IsNullOrWhiteSpace(location.ImageUrl))
                    .First();

                return new
                {
                    Key = group.Key,
                    representative.Id,
                    City = representative.City?.Trim() ?? string.Empty,
                    Country = representative.Country?.Trim() ?? string.Empty,
                    ImageUrl = representative.ImageUrl
                };
            })
            .ToList();

        if (destinationLocations.Count == 0)
        {
            return Array.Empty<PublicDestinationDto>();
        }

        var cityKeys = destinationLocations.Select(location => location.Key).Distinct().ToList();

        var availableVehicles = await _context.Vehicles
            .Where(vehicle =>
                vehicle.IsActive &&
                vehicle.AvailabilityStatus == "Available" &&
                vehicle.PricePerDay.HasValue &&
                !string.IsNullOrWhiteSpace(vehicle.LocationCity))
            .Select(vehicle => new
            {
                vehicle.LocationCity,
                PricePerDay = vehicle.PricePerDay ?? 0
            })
            .ToListAsync(cancellationToken);

        var statsByCity = availableVehicles
            .Select(vehicle => new
            {
                CityKey = BuildCityKey(vehicle.LocationCity),
                vehicle.PricePerDay
            })
            .Where(vehicle => cityKeys.Contains(vehicle.CityKey))
            .GroupBy(vehicle => vehicle.CityKey)
            .ToDictionary(
                group => group.Key,
                group => new
                {
                    VehicleCount = group.Count(),
                    StartingPrice = group.Min(vehicle => vehicle.PricePerDay)
                });

        var destinations = destinationLocations
            .Where(location => statsByCity.ContainsKey(location.Key))
            .Select(location =>
            {
                var stats = statsByCity[location.Key];
                return new PublicDestinationDto(
                    Id: location.Id,
                    City: location.City,
                    Country: location.Country,
                    ImageUrl: location.ImageUrl,
                    StartingPrice: Math.Round(stats.StartingPrice, 2),
                    VehicleCount: stats.VehicleCount);
            })
            .OrderByDescending(destination => destination.VehicleCount)
            .ThenBy(destination => destination.StartingPrice)
            .Take(normalizedLimit)
            .ToList();

        return destinations;
    }

    private static string BuildCityKey(string? city)
    {
        return (city ?? string.Empty).Trim().ToLowerInvariant();
    }
}
