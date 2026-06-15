using Backend.Application.DTOs.Vehicle;
using Backend.Application.Exceptions;
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
/// Property-based tests for vehicle details functionality using FsCheck.
/// Each property validates universal correctness guarantees for vehicle details operations across all valid inputs.
/// </summary>
public class VehicleDetailsPropertyTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IReviewRepository _reviewRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IVehicleService _vehicleService;

    public VehicleDetailsPropertyTests()
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

    #region Property 10: Vehicle details returns complete information

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 10: Vehicle details returns complete information
    public bool VehicleDetailsReturnsCompleteInformation(PositiveInt yearOffset, PositiveInt seatsGen, PositiveInt priceGen)
    {
        // Generate valid test data within reasonable ranges
        var year = 2020 + (yearOffset.Get % 5); // 2020-2024
        var seats = Math.Max(2, seatsGen.Get % 8 + 2); // 2-9 seats
        var pricePerDay = Math.Max(10, priceGen.Get % 500 + 10); // $10-$509 per day

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and vehicle with complete information
            var (userId, vehicleId) = CreateTestVehicleWithCompleteInfo(year, seats, pricePerDay);

            // Act - Get vehicle details
            var result = _vehicleService.GetVehicleDetailsAsync(vehicleId).Result;

            // Assert - Verify all required fields are present and valid
            return result != null &&
                   result.VehicleId == vehicleId &&
                   !string.IsNullOrEmpty(result.Make) &&
                   !string.IsNullOrEmpty(result.Model) &&
                   result.Year == year &&
                   !string.IsNullOrEmpty(result.Color) &&
                   !string.IsNullOrEmpty(result.LicensePlate) &&
                   !string.IsNullOrEmpty(result.Transmission) &&
                   !string.IsNullOrEmpty(result.FuelType) &&
                   result.Seats == seats &&
                   result.PricePerDay == pricePerDay &&
                   !string.IsNullOrEmpty(result.LocationCity) &&
                   !string.IsNullOrEmpty(result.Description) &&
                   !string.IsNullOrEmpty(result.Status) &&
                   !string.IsNullOrEmpty(result.AvailabilityStatus) &&
                   result.Images != null &&
                   result.Features != null &&
                   result.Supplier != null &&
                   result.Supplier.Id == userId &&
                   result.AverageRating >= 0 &&
                   result.ReviewCount >= 0;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Property 11: Non-existent vehicle returns 404

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 11: Non-existent vehicle returns 404
    public bool NonExistentVehicleReturns404()
    {
        try
        {
            // Clear any existing data to ensure clean state
            ClearTestData();

            // Generate a random GUID that doesn't exist in database
            var nonExistentVehicleId = Guid.NewGuid();

            // Act & Assert - Should throw NotFoundException
            var exception = Assert.ThrowsAsync<NotFoundException>(
                () => _vehicleService.GetVehicleDetailsAsync(nonExistentVehicleId)).Result;

            return exception != null &&
                   exception.Message.Contains(nonExistentVehicleId.ToString());
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Property 12: Pricing calculation is accurate

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 12: Pricing calculation is accurate
    public bool PricingCalculationIsAccurate(PositiveInt pricePerDayGen, PositiveInt daysGen, bool includeInsurance, bool includeServices)
    {
        var pricePerDay = Math.Max(10, pricePerDayGen.Get % 300 + 10); // $10-$309 per day
        var days = Math.Max(1, daysGen.Get % 30 + 1); // 1-30 days

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test vehicle
            var (userId, vehicleId) = CreateTestVehicleWithPrice(pricePerDay);

            // Create pricing request with valid date range
            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(days);

            var request = new PricingRequest(
                pickupDate,
                returnDate,
                includeInsurance ? "basic" : null,
                includeServices ? "gps,childseat" : null,
                "USD"
            );

            // Act - Calculate pricing
            var result = _vehicleService.CalculatePricingAsync(vehicleId, request).Result;

            // Assert - Verify pricing calculation accuracy
            var expectedBasePrice = pricePerDay * days;
            var expectedInsuranceCost = includeInsurance ? 10 * days : 0; // basic insurance = $10/day
            var expectedServicesCost = includeServices ? (5 + 8) * days : 0; // gps=$5/day, childseat=$8/day
            var expectedTotalPrice = expectedBasePrice + expectedInsuranceCost + expectedServicesCost;

            return result != null &&
                   result.BasePrice == expectedBasePrice &&
                   result.InsuranceCost == expectedInsuranceCost &&
                   result.AdditionalServicesCost == expectedServicesCost &&
                   result.TotalPrice == expectedTotalPrice &&
                   result.TotalDays == days &&
                   result.Currency == "USD";
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Property 13: Invalid date range returns 400

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 13: Invalid date range returns 400
    public bool InvalidDateRangeReturns400(PositiveInt dayOffsetGen)
    {
        var dayOffset = Math.Max(0, dayOffsetGen.Get % 10); // 0-9 days offset

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test vehicle
            var (userId, vehicleId) = CreateTestVehicleWithPrice(100);

            // Create invalid date range (pickup >= return)
            var pickupDate = DateTime.UtcNow.AddDays(5);
            var returnDate = pickupDate.AddDays(-dayOffset); // Same day or earlier

            var request = new PricingRequest(
                pickupDate,
                returnDate,
                null,
                null,
                "USD"
            );

            // Act & Assert - Should throw ValidationException
            try
            {
                var result = _vehicleService.CalculatePricingAsync(vehicleId, request).Result;
                // If we get here without exception, the test should fail
                return false;
            }
            catch (AggregateException ae) when (ae.InnerException is ValidationException ve)
            {
                // Check if it's the expected validation exception
                return ve.Errors.ContainsKey("DateRange") &&
                       ve.Errors["DateRange"].Any(msg => msg.Contains("Return date must be after pickup date"));
            }
            catch (ValidationException ve)
            {
                // Direct validation exception
                return ve.Errors.ContainsKey("DateRange") &&
                       ve.Errors["DateRange"].Any(msg => msg.Contains("Return date must be after pickup date"));
            }
            catch
            {
                // Any other exception means the test failed
                return false;
            }
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Additional Properties for Edge Cases

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Vehicle availability returns correct booked dates
    public bool VehicleAvailabilityReturnsCorrectBookedDates(PositiveInt bookingCountGen)
    {
        var bookingCount = Math.Min(bookingCountGen.Get % 6, 5); // 0-5 bookings

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test vehicle and user
            var (userId, vehicleId) = CreateTestVehicleWithPrice(100);

            // Create bookings for the vehicle
            var bookings = CreateTestBookings(vehicleId, userId, bookingCount);

            // Define availability check period
            var startDate = DateTime.UtcNow.AddDays(-10);
            var endDate = DateTime.UtcNow.AddDays(20);

            // Act - Get vehicle availability
            var result = _vehicleService.GetAvailabilityAsync(vehicleId, startDate, endDate).Result;

            // Assert - Verify booked dates match created bookings
            var expectedBookedDates = bookings
                .Where(b => b.PickupDate < endDate && b.ReturnDate > startDate)
                .Count();

            return result != null &&
                   result.VehicleId == vehicleId &&
                   result.BookedDates != null &&
                   result.BookedDates.Count == expectedBookedDates &&
                   result.BlockedDates != null;
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Vehicle images return correct format and data
    public bool VehicleImagesReturnCorrectFormatAndData(PositiveInt imageCountGen)
    {
        var imageCount = Math.Min(imageCountGen.Get % 6 + 1, 5); // 1-5 images

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test vehicle with images
            var (userId, vehicleId) = CreateTestVehicleWithImages(imageCount);

            // Act - Get vehicle images
            var result = _vehicleService.GetImagesAsync(vehicleId, "medium").Result;

            // Assert - Verify image data structure and count
            var imageList = result.ToList();
            return imageList.Count == imageCount &&
                   imageList.All(img => img.ImageId != Guid.Empty &&
                                       !string.IsNullOrEmpty(img.Url) &&
                                       img.Size == "medium");
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Vehicle reviews calculation is accurate
    public bool VehicleReviewsCalculationIsAccurate(PositiveInt reviewCountGen)
    {
        var reviewCount = Math.Min(reviewCountGen.Get % 11, 10); // 0-10 reviews

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test vehicle
            var (userId, vehicleId) = CreateTestVehicleWithPrice(100);

            // Create reviews with known ratings
            var reviews = CreateTestReviews(vehicleId, userId, reviewCount);
            var expectedAverageRating = reviews.Any() ? reviews.Average(r => r.Rating ?? 0) : 0;

            // Act - Get vehicle details (includes rating calculation)
            var result = _vehicleService.GetVehicleDetailsAsync(vehicleId).Result;

            // Assert - Verify rating calculation accuracy
            return result != null &&
                   Math.Abs(result.AverageRating - expectedAverageRating) < 0.01 && // Allow small floating point differences
                   result.ReviewCount == reviewCount;
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Pricing with different currencies works correctly
    public bool PricingWithDifferentCurrenciesWorksCorrectly(string currencyCode)
    {
        // Use a set of valid currency codes
        var validCurrencies = new[] { "USD", "EUR", "GBP", "CAD", "AUD" };
        var currency = validCurrencies[Math.Abs(currencyCode?.GetHashCode() ?? 0) % validCurrencies.Length];

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test vehicle
            var (userId, vehicleId) = CreateTestVehicleWithPrice(100);

            // Create pricing request with specific currency
            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(3);

            var request = new PricingRequest(
                pickupDate,
                returnDate,
                null,
                null,
                currency
            );

            // Act - Calculate pricing
            var result = _vehicleService.CalculatePricingAsync(vehicleId, request).Result;

            // Assert - Verify currency is correctly set in response
            return result != null &&
                   result.Currency == currency &&
                   result.TotalPrice > 0;
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
        _context.Reviews.RemoveRange(_context.Reviews);
        _context.Bookings.RemoveRange(_context.Bookings);
        _context.VehicleFeatures.RemoveRange(_context.VehicleFeatures);
        _context.VehicleImages.RemoveRange(_context.VehicleImages);
        _context.Vehicles.RemoveRange(_context.Vehicles);
        _context.Users.RemoveRange(_context.Users);
        _context.SaveChanges();
    }

    private (Guid userId, Guid vehicleId) CreateTestVehicleWithCompleteInfo(int year, int seats, decimal pricePerDay)
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

        var vehicleId = Guid.NewGuid();
        var vehicle = new Vehicle
        {
            Id = vehicleId,
            UserId = userId,
            Make = "Toyota",
            Model = "Camry",
            Year = year,
            Color = "Blue",
            LicensePlate = $"TEST{vehicleId.ToString()[..6].ToUpper()}",
            Transmission = "Automatic",
            FuelType = "Gasoline",
            Seats = seats,
            PricePerDay = pricePerDay,
            LocationCity = "Test City",
            Description = "Test vehicle description",
            Status = "Available",
            AvailabilityStatus = "Available",
            IsActive = true,
            ApprovedAt = DateTime.UtcNow
        };
        _context.Vehicles.Add(vehicle);

        // Add vehicle images
        var image = new VehicleImage
        {
            Id = Guid.NewGuid(),
            VehicleId = vehicleId,
            ImageUrl = "https://example.com/image.jpg",
            ThumbnailUrl = "https://example.com/thumb.jpg",
            IsPrimary = true
        };
        _context.VehicleImages.Add(image);

        // Add vehicle features
        var feature = new VehicleFeature
        {
            Id = Guid.NewGuid(),
            VehicleId = vehicleId,
            FeatureName = "Air Conditioning",
            FeatureDescription = "Climate control system"
        };
        _context.VehicleFeatures.Add(feature);

        _context.SaveChanges();
        return (userId, vehicleId);
    }

    private (Guid userId, Guid vehicleId) CreateTestVehicleWithPrice(decimal pricePerDay)
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

        var vehicleId = Guid.NewGuid();
        var vehicle = new Vehicle
        {
            Id = vehicleId,
            UserId = userId,
            Make = "Toyota",
            Model = "Camry",
            Year = 2023,
            Color = "Blue",
            LicensePlate = $"TEST{vehicleId.ToString()[..6].ToUpper()}",
            Transmission = "Automatic",
            FuelType = "Gasoline",
            Seats = 5,
            PricePerDay = pricePerDay,
            LocationCity = "Test City",
            Description = "Test vehicle",
            Status = "Available",
            AvailabilityStatus = "Available",
            IsActive = true,
            ApprovedAt = DateTime.UtcNow
        };
        _context.Vehicles.Add(vehicle);
        _context.SaveChanges();
        return (userId, vehicleId);
    }

    private (Guid userId, Guid vehicleId) CreateTestVehicleWithImages(int imageCount)
    {
        var (userId, vehicleId) = CreateTestVehicleWithPrice(100);

        for (int i = 0; i < imageCount; i++)
        {
            var image = new VehicleImage
            {
                Id = Guid.NewGuid(),
                VehicleId = vehicleId,
                ImageUrl = $"https://example.com/image{i}.jpg",
                ThumbnailUrl = $"https://example.com/thumb{i}.jpg",
                IsPrimary = i == 0 // First image is primary
            };
            _context.VehicleImages.Add(image);
        }

        _context.SaveChanges();
        return (userId, vehicleId);
    }

    private List<Booking> CreateTestBookings(Guid vehicleId, Guid userId, int bookingCount)
    {
        var bookings = new List<Booking>();
        var baseDate = DateTime.UtcNow;

        for (int i = 0; i < bookingCount; i++)
        {
            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                BookingNumber = $"BK{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
                UserId = userId,
                VehicleId = vehicleId,
                PickupDate = baseDate.AddDays(i * 5), // Non-overlapping bookings
                ReturnDate = baseDate.AddDays(i * 5 + 2),
                TotalPrice = 200,
                Status = BookingStatus.Confirmed,
                CreatedAt = DateTime.UtcNow
            };
            bookings.Add(booking);
            _context.Bookings.Add(booking);
        }

        _context.SaveChanges();
        return bookings;
    }

    private List<Review> CreateTestReviews(Guid vehicleId, Guid userId, int reviewCount)
    {
        var reviews = new List<Review>();
        var ratings = new[] { 1, 2, 3, 4, 5 };

        for (int i = 0; i < reviewCount; i++)
        {
            var review = new Review
            {
                Id = Guid.NewGuid(),
                VehicleId = vehicleId,
                UserId = userId,
                Rating = ratings[i % ratings.Length],
                Comment = $"Test review {i}",
                CreatedAt = DateTime.UtcNow
            };
            reviews.Add(review);
            _context.Reviews.Add(review);
        }

        _context.SaveChanges();
        return reviews;
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}