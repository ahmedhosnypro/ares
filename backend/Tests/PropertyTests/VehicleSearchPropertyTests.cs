using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Vehicle;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Repositories;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests.PropertyTests;

/// <summary>
/// Property-based tests for vehicle search functionality using FsCheck.
/// Each property validates universal correctness guarantees for vehicle search across all valid inputs.
/// </summary>
public class VehicleSearchPropertyTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IReviewRepository _reviewRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IVehicleService _vehicleService;

    public VehicleSearchPropertyTests()
    {
        // Setup in-memory database for testing
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _vehicleRepository = new VehicleRepository(_context);
        _reviewRepository = new ReviewRepository(_context);
        _bookingRepository = new BookingRepository(_context);
        var pricingService = new PricingService(_context);
        _vehicleService = new VehicleService(_vehicleRepository, _reviewRepository, _bookingRepository, _context, pricingService);

        // Ensure database is created
        _context.Database.EnsureCreated();
    }

    #region Property 7: Vehicle search returns paginated results

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 7: Vehicle search returns paginated results
    public bool VehicleSearchReturnsPaginatedResults(PositiveInt totalVehiclesGen, PositiveInt pageGen, PositiveInt limitGen)
    {
        // Extract values and constrain to valid ranges
        var totalVehicles = Math.Min(totalVehiclesGen.Get % 51, 50); // 0-50 vehicles
        var page = Math.Max(1, pageGen.Get % 10 + 1); // 1-10
        var limit = Math.Max(1, limitGen.Get % 20 + 1); // 1-20

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and location
            var (userId, pickupLocationId) = CreateTestUserAndLocation();

            // Create test vehicles
            var vehicles = CreateTestVehicles(userId, totalVehicles);

            // Create search request
            var request = new VehicleSearchRequest(
                pickupLocationId,
                null,
                DateTime.UtcNow.AddDays(1),
                DateTime.UtcNow.AddDays(3),
                Page: page,
                Limit: limit
            );

            // Act - Search vehicles
            var result = _vehicleService.SearchVehiclesAsync(request).Result;

            // Assert - Verify pagination properties
            var expectedTotalPages = totalVehicles == 0 ? 0 : (int)Math.Ceiling(totalVehicles / (double)limit);
            var expectedItemCount = totalVehicles == 0 ? 0 :
                page > expectedTotalPages ? 0 :
                page == expectedTotalPages ? totalVehicles - ((page - 1) * limit) :
                limit;

            return result.TotalCount == totalVehicles &&
                   result.Page == page &&
                   result.PageSize == limit &&
                   result.TotalPages == expectedTotalPages &&
                   result.Data.Count == expectedItemCount &&
                   result.Data.Count <= limit;
        }
        catch
        {
            // If any exception occurs, the property fails
            return false;
        }
    }

    #endregion

    #region Property 8: Vehicle search filters return only matching vehicles

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 8: Vehicle search filters return only matching vehicles
    public bool VehicleSearchFiltersReturnOnlyMatchingVehicles(PositiveInt vehicleCountGen, bool useCategory, bool useTransmission, bool usePriceRange)
    {
        var vehicleCount = Math.Min(vehicleCountGen.Get % 21, 20); // 0-20 vehicles

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and location
            var (userId, pickupLocationId) = CreateTestUserAndLocation();

            // Create diverse test vehicles with different attributes
            var vehicles = CreateDiverseTestVehicles(userId, vehicleCount);

            // Define filter criteria
            string? categoryFilter = useCategory ? "SUV" : null;
            string? transmissionFilter = useTransmission ? "Automatic" : null;
            decimal? minPriceFilter = usePriceRange ? 50m : null;
            decimal? maxPriceFilter = usePriceRange ? 150m : null;

            // Create search request with filters
            var request = new VehicleSearchRequest(
                pickupLocationId,
                null,
                DateTime.UtcNow.AddDays(1),
                DateTime.UtcNow.AddDays(3),
                Category: categoryFilter,
                Transmission: transmissionFilter,
                MinPrice: minPriceFilter,
                MaxPrice: maxPriceFilter
            );

            // Act - Search vehicles with filters
            var result = _vehicleService.SearchVehiclesAsync(request).Result;

            // Assert - Verify all returned vehicles match the filters
            foreach (var vehicle in result.Data)
            {
                // Check category filter
                if (categoryFilter != null && vehicle.Category != categoryFilter)
                {
                    return false;
                }

                // Check transmission filter
                if (transmissionFilter != null)
                {
                    // Get the actual vehicle from database to check transmission
                    var actualVehicle = _context.Vehicles.FirstOrDefault(v => v.Id == vehicle.VehicleId);
                    if (actualVehicle?.Transmission != transmissionFilter)
                    {
                        return false;
                    }
                }

                // Check price range filter
                if (minPriceFilter.HasValue && vehicle.DailyRate < minPriceFilter.Value)
                {
                    return false;
                }

                if (maxPriceFilter.HasValue && vehicle.DailyRate > maxPriceFilter.Value)
                {
                    return false;
                }
            }

            return true;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Property 9: Vehicle search sorting orders results correctly

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 9: Vehicle search sorting orders results correctly
    public bool VehicleSearchSortingOrdersResultsCorrectly(PositiveInt vehicleCountGen, string sortByGen)
    {
        var vehicleCount = Math.Min(vehicleCountGen.Get % 16 + 5, 20); // 5-20 vehicles for meaningful sorting

        // Define valid sort options
        var sortOptions = new[] { "price", "distance", "rating" };
        var sortBy = sortOptions[Math.Abs(sortByGen?.GetHashCode() ?? 0) % sortOptions.Length];

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and location
            var (userId, pickupLocationId) = CreateTestUserAndLocation();

            // Create test vehicles with varied attributes for sorting
            var vehicles = CreateVehiclesForSorting(userId, vehicleCount);

            // Create search request with sorting
            var request = new VehicleSearchRequest(
                pickupLocationId,
                null,
                DateTime.UtcNow.AddDays(1),
                DateTime.UtcNow.AddDays(3),
                SortBy: sortBy
            );

            // Act - Search vehicles with sorting
            var result = _vehicleService.SearchVehiclesAsync(request).Result;

            if (result.Data.Count <= 1)
            {
                return true; // Single item or empty list is always sorted
            }

            // Assert - Verify sorting order
            for (int i = 0; i < result.Data.Count - 1; i++)
            {
                var current = result.Data[i];
                var next = result.Data[i + 1];

                switch (sortBy.ToLower())
                {
                    case "price":
                        if (current.DailyRate > next.DailyRate)
                        {
                            return false; // Should be ascending order
                        }
                        break;

                    case "distance":
                        var currentDistance = current.Distance ?? double.MaxValue;
                        var nextDistance = next.Distance ?? double.MaxValue;
                        if (currentDistance > nextDistance)
                        {
                            return false; // Should be ascending order
                        }
                        break;

                    case "rating":
                        if (current.Rating < next.Rating)
                        {
                            return false; // Should be descending order for rating
                        }
                        break;
                }
            }

            return true;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Additional Properties for Edge Cases

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Empty search results return valid pagination
    public bool EmptySearchResultsReturnValidPagination(PositiveInt pageGen, PositiveInt limitGen)
    {
        var page = Math.Max(1, pageGen.Get % 5 + 1); // 1-5
        var limit = Math.Max(1, limitGen.Get % 10 + 1); // 1-10

        try
        {
            // Clear any existing data to ensure empty results
            ClearTestData();

            // Create test user and location but no vehicles
            var (userId, pickupLocationId) = CreateTestUserAndLocation();

            var request = new VehicleSearchRequest(
                pickupLocationId,
                null,
                DateTime.UtcNow.AddDays(1),
                DateTime.UtcNow.AddDays(3),
                Page: page,
                Limit: limit
            );

            // Act
            var result = _vehicleService.SearchVehiclesAsync(request).Result;

            // Assert - Empty result should have consistent pagination metadata
            return result.TotalCount == 0 &&
                   result.TotalPages == 0 &&
                   result.Data.Count == 0 &&
                   result.Page == page &&
                   result.PageSize == limit;
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Vehicle availability filtering works correctly
    public bool VehicleAvailabilityFilteringWorksCorrectly(PositiveInt vehicleCountGen, PositiveInt bookedVehiclesGen)
    {
        var vehicleCount = Math.Min(vehicleCountGen.Get % 11 + 5, 15); // 5-15 vehicles
        var bookedVehiclesCount = Math.Min(bookedVehiclesGen.Get % vehicleCount + 1, vehicleCount); // 1 to vehicleCount

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and location
            var (userId, pickupLocationId) = CreateTestUserAndLocation();

            // Create test vehicles
            var vehicles = CreateTestVehicles(userId, vehicleCount);

            // Create bookings for some vehicles to make them unavailable
            var searchStartDate = DateTime.UtcNow.AddDays(1);
            var searchEndDate = DateTime.UtcNow.AddDays(3);

            CreateOverlappingBookings(vehicles.Take(bookedVehiclesCount), userId, searchStartDate, searchEndDate);

            var request = new VehicleSearchRequest(
                pickupLocationId,
                null,
                searchStartDate,
                searchEndDate
            );

            // Act - Search for available vehicles
            var result = _vehicleService.SearchVehiclesAsync(request).Result;

            // Assert - Should only return vehicles without overlapping bookings
            var expectedAvailableCount = vehicleCount - bookedVehiclesCount;
            return result.Data.Count == expectedAvailableCount &&
                   result.TotalCount == expectedAvailableCount;
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Multiple filters work together correctly
    public bool MultipleFiltersWorkTogetherCorrectly(PositiveInt vehicleCountGen)
    {
        var vehicleCount = Math.Min(vehicleCountGen.Get % 16 + 10, 25); // 10-25 vehicles

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and location
            var (userId, pickupLocationId) = CreateTestUserAndLocation();

            // Create diverse test vehicles
            var vehicles = CreateDiverseTestVehicles(userId, vehicleCount);

            // Apply multiple filters
            var request = new VehicleSearchRequest(
                pickupLocationId,
                null,
                DateTime.UtcNow.AddDays(1),
                DateTime.UtcNow.AddDays(3),
                Category: "SUV",
                Transmission: "Automatic",
                MinPrice: 75m,
                MaxPrice: 125m
            );

            // Act
            var result = _vehicleService.SearchVehiclesAsync(request).Result;

            // Assert - All returned vehicles should match ALL filters
            foreach (var vehicle in result.Data)
            {
                var actualVehicle = _context.Vehicles.FirstOrDefault(v => v.Id == vehicle.VehicleId);

                if (vehicle.Category != "SUV" ||
                    actualVehicle?.Transmission != "Automatic" ||
                    vehicle.DailyRate < 75m ||
                    vehicle.DailyRate > 125m)
                {
                    return false;
                }
            }

            return true;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Helper Methods

    private void ClearTestData()
    {
        _context.Bookings.RemoveRange(_context.Bookings);
        _context.Reviews.RemoveRange(_context.Reviews);
        _context.VehicleImages.RemoveRange(_context.VehicleImages);
        _context.Vehicles.RemoveRange(_context.Vehicles);
        _context.UserAddresses.RemoveRange(_context.UserAddresses);
        _context.Users.RemoveRange(_context.Users);
        _context.SaveChanges();
    }

    private (Guid userId, Guid pickupLocationId) CreateTestUserAndLocation()
    {
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = $"test{userId}@example.com",
            FirstName = "Test",
            LastName = "User",
            UserName = $"test{userId}@example.com"
        };
        _context.Users.Add(user);

        var pickupLocationId = Guid.NewGuid();
        var location = new UserAddress
        {
            Id = pickupLocationId,
            UserId = userId,
            AddressLine = "Test Address",
            City = "Test City",
            Governorate = "Test Governorate",
            Country = "Test Country",
            PostalCode = "12345",
            IsPrimary = true
        };
        _context.UserAddresses.Add(location);
        _context.SaveChanges();

        return (userId, pickupLocationId);
    }

    private List<Vehicle> CreateTestVehicles(Guid userId, int count)
    {
        var vehicles = new List<Vehicle>();

        for (int i = 0; i < count; i++)
        {
            var vehicle = new Vehicle
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Make = $"Make{i}",
                Model = $"Model{i}",
                Year = 2020 + (i % 4),
                Color = "Blue",
                LicensePlate = $"TEST{i:D3}",
                Transmission = "Automatic",
                FuelType = "Gasoline",
                Seats = 5,
                PricePerDay = 100 + (i * 10),
                LocationCity = "Test City",
                Description = $"Test vehicle {i}",
                Status = "Available",
                AvailabilityStatus = "Available",
                IsActive = true,
                ApprovedAt = DateTime.UtcNow
            };

            vehicles.Add(vehicle);
        }

        _context.Vehicles.AddRange(vehicles);
        _context.SaveChanges();
        return vehicles;
    }

    private List<Vehicle> CreateDiverseTestVehicles(Guid userId, int count)
    {
        var vehicles = new List<Vehicle>();
        var categories = new[] { "SUV", "Sedan", "Hatchback", "Coupe" };
        var transmissions = new[] { "Automatic", "Manual" };

        for (int i = 0; i < count; i++)
        {
            var vehicle = new Vehicle
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Make = $"Make{i}",
                Model = $"Model{i}",
                Year = 2020 + (i % 4),
                Color = "Blue",
                LicensePlate = $"TEST{i:D3}",
                Transmission = transmissions[i % transmissions.Length],
                FuelType = "Gasoline",
                Seats = 5,
                PricePerDay = 50 + (i * 15), // Varied prices: 50, 65, 80, 95, 110, 125, 140, etc.
                LocationCity = "Test City",
                Description = $"Test vehicle {i}",
                Status = categories[i % categories.Length], // Using Status as Category
                AvailabilityStatus = "Available",
                IsActive = true,
                ApprovedAt = DateTime.UtcNow
            };

            vehicles.Add(vehicle);
        }

        _context.Vehicles.AddRange(vehicles);
        _context.SaveChanges();
        return vehicles;
    }

    private List<Vehicle> CreateVehiclesForSorting(Guid userId, int count)
    {
        var vehicles = new List<Vehicle>();

        for (int i = 0; i < count; i++)
        {
            var vehicle = new Vehicle
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Make = $"Make{i}",
                Model = $"Model{i}",
                Year = 2020 + (i % 4),
                Color = "Blue",
                LicensePlate = $"TEST{i:D3}",
                Transmission = "Automatic",
                FuelType = "Gasoline",
                Seats = 5,
                PricePerDay = 50 + (i * 20), // Varied prices for sorting
                LocationCity = "Test City",
                Description = $"Test vehicle {i}",
                Status = "Available",
                AvailabilityStatus = "Available",
                IsActive = true,
                ApprovedAt = DateTime.UtcNow
            };

            vehicles.Add(vehicle);

            // Create some reviews for rating-based sorting
            if (i % 3 == 0) // Every 3rd vehicle gets reviews
            {
                var review = new Review
                {
                    Id = Guid.NewGuid(),
                    VehicleId = vehicle.Id,
                    UserId = userId,
                    Rating = 3 + (i % 3), // Ratings: 3, 4, 5
                    Comment = $"Review for vehicle {i}",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Reviews.Add(review);
            }
        }

        _context.Vehicles.AddRange(vehicles);
        _context.SaveChanges();
        return vehicles;
    }

    private void CreateOverlappingBookings(IEnumerable<Vehicle> vehicles, Guid userId, DateTime searchStart, DateTime searchEnd)
    {
        foreach (var vehicle in vehicles)
        {
            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                BookingNumber = $"BK{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
                UserId = userId,
                VehicleId = vehicle.Id,
                PickupDate = searchStart.AddHours(-12), // Overlaps with search period
                ReturnDate = searchEnd.AddHours(12),
                TotalPrice = 200,
                Status = BookingStatus.Confirmed,
                CreatedAt = DateTime.UtcNow
            };
            _context.Bookings.Add(booking);
        }
        _context.SaveChanges();
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}