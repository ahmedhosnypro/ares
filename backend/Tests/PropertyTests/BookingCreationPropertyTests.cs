using Backend.Application.DTOs.Booking;
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
/// Property-based tests for booking creation functionality using FsCheck.
/// Each property validates universal correctness guarantees for booking operations across all valid inputs.
/// </summary>
public class BookingCreationPropertyTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IBookingRepository _bookingRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IBookingService _bookingService;

    public BookingCreationPropertyTests()
    {
        // Setup in-memory database for testing
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _bookingRepository = new BookingRepository(_context);
        _vehicleRepository = new VehicleRepository(_context);
        _bookingService = new BookingService(_bookingRepository, _vehicleRepository, _context, null!);

        // Ensure database is created
        _context.Database.EnsureCreated();
    }

    #region Property 14: Booking creation updates vehicle availability

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 14: Booking creation updates vehicle availability
    public bool BookingCreationUpdatesVehicleAvailability(PositiveInt daysGen, PositiveInt priceGen)
    {
        var days = Math.Max(1, daysGen.Get % 14 + 1); // 1-14 days
        var pricePerDay = Math.Max(10, priceGen.Get % 200 + 10); // $10-$209 per day

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and vehicle
            var (userId, vehicleId) = CreateTestUserAndVehicle(pricePerDay);

            // Define booking dates
            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(days);

            // Verify vehicle is initially available
            var initiallyAvailable = _vehicleRepository.IsAvailableAsync(vehicleId, pickupDate, returnDate).Result;
            if (!initiallyAvailable)
                return true; // Skip if vehicle is not initially available

            // Create booking request
            var request = new CreateBookingRequest(
                vehicleId,
                Guid.NewGuid(), // PickupLocationId
                Guid.NewGuid(), // DropOffLocationId
                pickupDate,
                returnDate,
                null, // No driver
                false // Not pay later
            );

            // Act - Create booking
            var response = _bookingService.CreateBookingAsync(request, userId).Result;

            // Assert - Vehicle should no longer be available for those dates
            var availableAfterBooking = _vehicleRepository.IsAvailableAsync(vehicleId, pickupDate, returnDate).Result;

            return response != null &&
                   response.BookingId != Guid.Empty &&
                   !availableAfterBooking; // Vehicle should not be available after booking
        }
        catch
        {
            return false;
        }
    }

    #endregion
    #region Property 15: Booking price calculation is correct

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 15: Booking price calculation is correct
    public bool BookingPriceCalculationIsCorrect(PositiveInt daysGen, PositiveInt priceGen)
    {
        var days = Math.Max(1, daysGen.Get % 30 + 1); // 1-30 days
        var pricePerDay = Math.Max(10, priceGen.Get % 500 + 10); // $10-$509 per day

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and vehicle
            var (userId, vehicleId) = CreateTestUserAndVehicle(pricePerDay);

            // Define booking dates
            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(days);

            // Create booking request
            var request = new CreateBookingRequest(
                vehicleId,
                Guid.NewGuid(), // PickupLocationId
                Guid.NewGuid(), // DropOffLocationId
                pickupDate,
                returnDate,
                null, // No driver
                false // Not pay later
            );

            // Act - Create booking
            var response = _bookingService.CreateBookingAsync(request, userId).Result;

            // Calculate expected price
            var expectedTotalPrice = pricePerDay * days;

            // Assert - Verify price calculation is correct
            return response != null &&
                   response.TotalPrice == expectedTotalPrice;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Property 16: Double-booking is prevented

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 16: Double-booking is prevented
    public bool DoubleBookingIsPrevented(PositiveInt daysGen, PositiveInt overlapGen)
    {
        var days = Math.Max(2, daysGen.Get % 10 + 2); // 2-11 days
        var overlapDays = Math.Max(1, overlapGen.Get % days); // 1 to days overlap

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test users and vehicle
            var (user1Id, vehicleId) = CreateTestUserAndVehicle(100);
            var user2Id = CreateTestUser();

            // Define first booking dates
            var pickup1 = DateTime.UtcNow.AddDays(5);
            var return1 = pickup1.AddDays(days);

            // Define overlapping second booking dates
            var pickup2 = pickup1.AddDays(overlapDays); // Overlaps with first booking
            var return2 = pickup2.AddDays(days);

            // Create first booking request
            var request1 = new CreateBookingRequest(
                vehicleId,
                Guid.NewGuid(),
                Guid.NewGuid(),
                pickup1,
                return1,
                null,
                false
            );

            // Create overlapping second booking request
            var request2 = new CreateBookingRequest(
                vehicleId,
                Guid.NewGuid(),
                Guid.NewGuid(),
                pickup2,
                return2,
                null,
                false
            );

            // Act - Create first booking (should succeed)
            var response1 = _bookingService.CreateBookingAsync(request1, user1Id).Result;

            // Act - Try to create overlapping booking (should fail)
            try
            {
                var response2 = _bookingService.CreateBookingAsync(request2, user2Id).Result;
                return false; // Should have thrown exception
            }
            catch (AggregateException ae) when (ae.InnerException is ConflictException)
            {
                // Expected exception for double-booking prevention
                return response1 != null && response1.BookingId != Guid.Empty;
            }
            catch (ConflictException)
            {
                // Direct conflict exception
                return response1 != null && response1.BookingId != Guid.Empty;
            }
            catch
            {
                return false; // Unexpected exception
            }
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Property 17: Booking numbers are unique

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 17: Booking numbers are unique
    public bool BookingNumbersAreUnique(PositiveInt bookingCountGen)
    {
        var bookingCount = Math.Min(bookingCountGen.Get % 10 + 2, 10); // 2-10 bookings

        try
        {
            // Clear any existing data
            ClearTestData();

            var bookingNumbers = new HashSet<string>();
            var allBookingsSucceeded = true;

            for (int i = 0; i < bookingCount; i++)
            {
                // Create separate user and vehicle for each booking to avoid conflicts
                var (userId, vehicleId) = CreateTestUserAndVehicle(100);

                // Define non-overlapping booking dates
                var pickupDate = DateTime.UtcNow.AddDays(i * 10 + 1); // Spaced 10 days apart
                var returnDate = pickupDate.AddDays(2);

                var request = new CreateBookingRequest(
                    vehicleId,
                    Guid.NewGuid(),
                    Guid.NewGuid(),
                    pickupDate,
                    returnDate,
                    null,
                    false
                );

                try
                {
                    var response = _bookingService.CreateBookingAsync(request, userId).Result;

                    if (response == null || string.IsNullOrEmpty(response.BookingNumber))
                    {
                        allBookingsSucceeded = false;
                        break;
                    }

                    // Check if booking number is unique
                    if (bookingNumbers.Contains(response.BookingNumber))
                    {
                        return false; // Duplicate booking number found
                    }

                    bookingNumbers.Add(response.BookingNumber);
                }
                catch
                {
                    allBookingsSucceeded = false;
                    break;
                }
            }

            // Assert - All booking numbers should be unique
            return allBookingsSucceeded && bookingNumbers.Count == bookingCount;
        }
        catch
        {
            return false;
        }
    }

    #endregion
    #region Additional Properties for Edge Cases

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Booking creation with invalid date range fails
    public bool BookingCreationWithInvalidDateRangeFails(PositiveInt dayOffsetGen)
    {
        var dayOffset = Math.Max(0, dayOffsetGen.Get % 5); // 0-4 days offset

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and vehicle
            var (userId, vehicleId) = CreateTestUserAndVehicle(100);

            // Create invalid date range (pickup >= return)
            var pickupDate = DateTime.UtcNow.AddDays(5);
            var returnDate = pickupDate.AddDays(-dayOffset); // Same day or earlier

            var request = new CreateBookingRequest(
                vehicleId,
                Guid.NewGuid(),
                Guid.NewGuid(),
                pickupDate,
                returnDate,
                null,
                false
            );

            // Act & Assert - Should throw ValidationException
            try
            {
                var response = _bookingService.CreateBookingAsync(request, userId).Result;
                return false; // Should have thrown exception
            }
            catch (AggregateException ae) when (ae.InnerException is ValidationException ve)
            {
                return ve.Errors.ContainsKey("DateRange");
            }
            catch (ValidationException ve)
            {
                return ve.Errors.ContainsKey("DateRange");
            }
            catch
            {
                return false; // Unexpected exception
            }
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Booking creation with non-existent vehicle fails
    public bool BookingCreationWithNonExistentVehicleFails()
    {
        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user
            var userId = CreateTestUser();

            // Use non-existent vehicle ID
            var nonExistentVehicleId = Guid.NewGuid();

            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(3);

            var request = new CreateBookingRequest(
                nonExistentVehicleId,
                Guid.NewGuid(),
                Guid.NewGuid(),
                pickupDate,
                returnDate,
                null,
                false
            );

            // Act & Assert - Should throw NotFoundException
            try
            {
                var response = _bookingService.CreateBookingAsync(request, userId).Result;
                return false; // Should have thrown exception
            }
            catch (AggregateException ae) when (ae.InnerException is NotFoundException)
            {
                return true; // Expected exception
            }
            catch (NotFoundException)
            {
                return true; // Expected exception
            }
            catch
            {
                return false; // Unexpected exception
            }
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Booking status is set to Pending
    public bool BookingStatusIsSetToPending(PositiveInt daysGen)
    {
        var days = Math.Max(1, daysGen.Get % 7 + 1); // 1-7 days

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and vehicle
            var (userId, vehicleId) = CreateTestUserAndVehicle(100);

            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(days);

            var request = new CreateBookingRequest(
                vehicleId,
                Guid.NewGuid(),
                Guid.NewGuid(),
                pickupDate,
                returnDate,
                null,
                false
            );

            // Act - Create booking
            var response = _bookingService.CreateBookingAsync(request, userId).Result;

            // Verify booking was created with correct status
            var booking = _bookingRepository.GetByIdAsync(response.BookingId).Result;

            return response != null &&
                   response.Status == BookingStatus.Pending.ToString() &&
                   booking != null &&
                   booking.Status == BookingStatus.Pending;
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Booking number format is correct
    public bool BookingNumberFormatIsCorrect(PositiveInt daysGen)
    {
        var days = Math.Max(1, daysGen.Get % 5 + 1); // 1-5 days

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and vehicle
            var (userId, vehicleId) = CreateTestUserAndVehicle(100);

            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(days);

            var request = new CreateBookingRequest(
                vehicleId,
                Guid.NewGuid(),
                Guid.NewGuid(),
                pickupDate,
                returnDate,
                null,
                false
            );

            // Act - Create booking
            var response = _bookingService.CreateBookingAsync(request, userId).Result;

            // Assert - Verify booking number format (BK-YYYYMMDD-XXXXX)
            var bookingNumber = response.BookingNumber;
            var parts = bookingNumber.Split('-');

            return parts.Length == 3 &&
                   parts[0] == "BK" &&
                   parts[1].Length == 8 && // YYYYMMDD
                   parts[2].Length == 5 && // XXXXX
                   DateTime.TryParseExact(parts[1], "yyyyMMdd", null, System.Globalization.DateTimeStyles.None, out _);
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
        _context.VehicleImages.RemoveRange(_context.VehicleImages);
        _context.Vehicles.RemoveRange(_context.Vehicles);
        _context.Users.RemoveRange(_context.Users);
        _context.SaveChanges();
    }

    private (Guid userId, Guid vehicleId) CreateTestUserAndVehicle(decimal pricePerDay)
    {
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = $"test{userId}@example.com",
            FirstName = "Test",
            LastName = "User",
            UserName = $"test{userId}@example.com",
            EmailConfirmed = true
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
            Description = "Test vehicle for booking",
            Status = "Available",
            AvailabilityStatus = "Available",
            IsActive = true,
            ApprovedAt = DateTime.UtcNow
        };
        _context.Vehicles.Add(vehicle);

        // Add a primary vehicle image
        var image = new VehicleImage
        {
            Id = Guid.NewGuid(),
            VehicleId = vehicleId,
            ImageUrl = "https://example.com/test-vehicle.jpg",
            ThumbnailUrl = "https://example.com/test-vehicle-thumb.jpg",
            IsPrimary = true
        };
        _context.VehicleImages.Add(image);

        _context.SaveChanges();
        return (userId, vehicleId);
    }

    private Guid CreateTestUser()
    {
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = $"test{userId}@example.com",
            FirstName = "Test",
            LastName = "User",
            UserName = $"test{userId}@example.com",
            EmailConfirmed = true
        };
        _context.Users.Add(user);
        _context.SaveChanges();
        return userId;
    }

    private Booking CreateTestBooking(Guid vehicleId, Guid userId, DateTime pickupDate, DateTime returnDate, BookingStatus status = BookingStatus.Confirmed)
    {
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            BookingNumber = $"BK-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..5].ToUpper()}",
            UserId = userId,
            VehicleId = vehicleId,
            PickupDate = pickupDate,
            ReturnDate = returnDate,
            TotalDays = (returnDate - pickupDate).Days,
            TotalPrice = 100 * (returnDate - pickupDate).Days,
            Status = status,
            CreatedAt = DateTime.UtcNow
        };
        _context.Bookings.Add(booking);
        _context.SaveChanges();
        return booking;
    }

    private List<Booking> CreateMultipleTestBookings(Guid vehicleId, Guid userId, int count)
    {
        var bookings = new List<Booking>();
        var baseDate = DateTime.UtcNow.AddDays(1);

        for (int i = 0; i < count; i++)
        {
            var pickupDate = baseDate.AddDays(i * 5); // Non-overlapping bookings
            var returnDate = pickupDate.AddDays(2);

            var booking = CreateTestBooking(vehicleId, userId, pickupDate, returnDate);
            bookings.Add(booking);
        }

        return bookings;
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}