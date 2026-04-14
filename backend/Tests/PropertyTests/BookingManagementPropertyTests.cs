using Backend.Application.DTOs.Booking;
using Backend.Application.DTOs.Common;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Repositories;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests.PropertyTests;

/// <summary>
/// Property-based tests for booking management functionality using FsCheck.
/// Each property validates universal correctness guarantees for booking management operations across all valid inputs.
/// </summary>
public class BookingManagementPropertyTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IBookingRepository _bookingRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IBookingService _bookingService;

    public BookingManagementPropertyTests()
    {
        // Setup in-memory database for testing
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _bookingRepository = new BookingRepository(_context);
        _vehicleRepository = new VehicleRepository(_context);
        _bookingService = new BookingService(_bookingRepository, _vehicleRepository, _context);

        // Ensure database is created
        _context.Database.EnsureCreated();
    }

    #region Property 18: Booking list pagination works correctly

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 18: Booking list pagination works correctly
    public bool BookingListPaginationWorksCorrectly(PositiveInt bookingCountGen, PositiveInt pageSizeGen)
    {
        var bookingCount = Math.Max(1, bookingCountGen.Get % 20 + 1); // 1-20 bookings
        var pageSize = Math.Max(1, pageSizeGen.Get % 10 + 1); // 1-10 page size

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and vehicle
            var (userId, vehicleId) = CreateTestUserAndVehicle(100);

            // Create multiple bookings for the user
            var bookings = CreateMultipleTestBookings(userId, vehicleId, bookingCount);

            // Test pagination for different pages
            var totalPages = (int)Math.Ceiling((double)bookingCount / pageSize);
            
            for (int page = 1; page <= Math.Min(totalPages, 3); page++) // Test first 3 pages max
            {
                var request = new BookingListRequest(
                    UserId: userId,
                    Suppliers: null,
                    Statuses: null,
                    CarId: null,
                    Filter: null,
                    Page: page,
                    Size: pageSize,
                    Language: "en"
                );

                var result = _bookingService.GetUserBookingsAsync(userId, request).Result;

                // Verify pagination properties
                if (result.Page != page ||
                    result.PageSize != pageSize ||
                    result.TotalCount != bookingCount ||
                    result.TotalPages != totalPages)
                {
                    return false;
                }

                // Verify data count for this page
                var expectedDataCount = Math.Min(pageSize, bookingCount - (page - 1) * pageSize);
                if (result.Data.Count != expectedDataCount)
                {
                    return false;
                }

                // Verify all returned bookings belong to the user
                if (result.Data.Any(b => !bookings.Any(original => original.Id == b.Id)))
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

    #region Property 19: Booking filters return only matching bookings

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 19: Booking filters return only matching bookings
    public bool BookingFiltersReturnOnlyMatchingBookings(PositiveInt bookingCountGen)
    {
        var bookingCount = Math.Max(3, bookingCountGen.Get % 10 + 3); // 3-12 bookings

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test users and vehicles
            var (user1Id, vehicle1Id) = CreateTestUserAndVehicle(100);
            var (user2Id, vehicle2Id) = CreateTestUserAndVehicle(150);

            // Create bookings with different statuses and dates
            var bookings = new List<Booking>();
            var statuses = new[] { "Pending", "Confirmed", "Cancelled", "Completed" };
            var baseDate = DateTime.UtcNow.AddDays(1);

            for (int i = 0; i < bookingCount; i++)
            {
                var pickupDate = baseDate.AddDays(i * 3);
                var returnDate = pickupDate.AddDays(2);
                var status = statuses[i % statuses.Length];
                var vehicleId = i % 2 == 0 ? vehicle1Id : vehicle2Id;

                var booking = CreateTestBooking(vehicleId, user1Id, pickupDate, returnDate, status);
                bookings.Add(booking);
            }

            // Test status filter
            var confirmedBookings = bookings.Where(b => b.Status == "Confirmed").ToList();
            if (confirmedBookings.Any())
            {
                var statusFilterRequest = new BookingListRequest(
                    UserId: user1Id,
                    Suppliers: null,
                    Statuses: new List<string> { "Confirmed" },
                    CarId: null,
                    Filter: null,
                    Page: 1,
                    Size: 20,
                    Language: "en"
                );

                var statusResult = _bookingService.GetUserBookingsAsync(user1Id, statusFilterRequest).Result;

                // Verify all returned bookings have "Confirmed" status
                if (statusResult.Data.Any(b => b.Status != "Confirmed") ||
                    statusResult.TotalCount != confirmedBookings.Count)
                {
                    return false;
                }
            }

            // Test vehicle filter
            var vehicle1Bookings = bookings.Where(b => b.VehicleId == vehicle1Id).ToList();
            if (vehicle1Bookings.Any())
            {
                var vehicleFilterRequest = new BookingListRequest(
                    UserId: user1Id,
                    Suppliers: null,
                    Statuses: null,
                    CarId: vehicle1Id,
                    Filter: null,
                    Page: 1,
                    Size: 20,
                    Language: "en"
                );

                var vehicleResult = _bookingService.GetUserBookingsAsync(user1Id, vehicleFilterRequest).Result;

                // Verify all returned bookings are for the specified vehicle
                if (vehicleResult.Data.Any(b => b.Car.Id != vehicle1Id) ||
                    vehicleResult.TotalCount != vehicle1Bookings.Count)
                {
                    return false;
                }
            }

            // Test date range filter
            var midDate = baseDate.AddDays(bookingCount / 2 * 3);
            var dateRangeBookings = bookings.Where(b => 
                b.PickupDate >= baseDate && b.PickupDate <= midDate).ToList();

            if (dateRangeBookings.Any())
            {
                var dateFilterRequest = new BookingListRequest(
                    UserId: user1Id,
                    Suppliers: null,
                    Statuses: null,
                    CarId: null,
                    Filter: new BookingFilters(
                        From: baseDate,
                        To: midDate,
                        Keyword: null,
                        PickupLocation: null,
                        DropOffLocation: null
                    ),
                    Page: 1,
                    Size: 20,
                    Language: "en"
                );

                var dateResult = _bookingService.GetUserBookingsAsync(user1Id, dateFilterRequest).Result;

                // Verify all returned bookings are within the date range
                if (dateResult.Data.Any(b => b.From < baseDate || b.From > midDate))
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

    #region Property 20: Booking details returns complete information

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 20: Booking details returns complete information
    public bool BookingDetailsReturnsCompleteInformation(PositiveInt priceGen)
    {
        var pricePerDay = Math.Max(10, priceGen.Get % 500 + 10); // $10-$509 per day

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user, supplier, and vehicle
            var (userId, vehicleId) = CreateTestUserAndVehicle(pricePerDay);
            var supplierId = CreateTestSupplier();
            var driverId = CreateTestDriver();

            // Update vehicle to have the supplier
            var vehicle = _context.Vehicles.First(v => v.Id == vehicleId);
            vehicle.UserId = supplierId;
            _context.SaveChanges();

            // Create a booking with driver
            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(3);
            var booking = CreateTestBookingWithDriver(vehicleId, userId, driverId, pickupDate, returnDate, "Confirmed");

            // Act - Get booking details
            var result = _bookingService.GetBookingDetailsAsync(booking.Id, userId).Result;

            // Assert - Verify all required fields are present and correct
            var hasAllRequiredFields = 
                result.Id == booking.Id &&
                result.Car != null &&
                result.Car.Id == vehicleId &&
                !string.IsNullOrEmpty(result.Car.Name) &&
                !string.IsNullOrEmpty(result.Car.Image) &&
                result.Car.Supplier != null &&
                result.Car.Supplier.Id == supplierId &&
                !string.IsNullOrEmpty(result.Car.Supplier.FullName) &&
                result.Driver != null &&
                result.Driver.Id == driverId &&
                !string.IsNullOrEmpty(result.Driver.FullName) &&
                result.PickupLocation != null &&
                result.DropOffLocation != null &&
                result.From == pickupDate &&
                result.To == returnDate &&
                result.Price > 0 &&
                result.Status == "Confirmed";

            return hasAllRequiredFields;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Property 21: Booking cancellation updates status

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 21: Booking cancellation updates status
    public bool BookingCancellationUpdatesStatus(PositiveInt daysGen)
    {
        var days = Math.Max(1, daysGen.Get % 14 + 1); // 1-14 days

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and vehicle
            var (userId, vehicleId) = CreateTestUserAndVehicle(100);

            // Create a booking that can be cancelled
            var pickupDate = DateTime.UtcNow.AddDays(5); // Future date
            var returnDate = pickupDate.AddDays(days);
            var booking = CreateTestBooking(vehicleId, userId, pickupDate, returnDate, "Confirmed");

            // Verify vehicle is not available before cancellation
            var availableBeforeCancellation = _vehicleRepository.IsAvailableAsync(vehicleId, pickupDate, returnDate).Result;

            // Act - Cancel the booking
            var cancellationResult = _bookingService.CancelBookingAsync(booking.Id, userId).Result;

            // Get updated booking details
            var updatedBooking = _context.Bookings.First(b => b.Id == booking.Id);

            // Verify vehicle is available after cancellation
            var availableAfterCancellation = _vehicleRepository.IsAvailableAsync(vehicleId, pickupDate, returnDate).Result;

            // Assert - Verify cancellation updated status and made vehicle available
            return cancellationResult == true &&
                   updatedBooking.Status == "Cancelled" &&
                   updatedBooking.CancelledAt.HasValue &&
                   !availableBeforeCancellation && // Was not available before
                   availableAfterCancellation;     // Is available after cancellation
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Additional Properties for Edge Cases

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Booking details with unauthorized user fails
    public bool BookingDetailsWithUnauthorizedUserFails()
    {
        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test users and vehicle
            var (user1Id, vehicleId) = CreateTestUserAndVehicle(100);
            var user2Id = CreateTestUser(); // Different user

            // Create booking for user1
            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(2);
            var booking = CreateTestBooking(vehicleId, user1Id, pickupDate, returnDate, "Confirmed");

            // Act & Assert - user2 should not be able to access user1's booking
            try
            {
                var result = _bookingService.GetBookingDetailsAsync(booking.Id, user2Id).Result;
                return false; // Should have thrown exception
            }
            catch (AggregateException ae) when (ae.InnerException is ForbiddenException)
            {
                return true; // Expected exception
            }
            catch (ForbiddenException)
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
    // Feature: backend-api-implementation, Additional Property: Booking cancellation with ineligible status fails
    public bool BookingCancellationWithIneligibleStatusFails()
    {
        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user and vehicle
            var (userId, vehicleId) = CreateTestUserAndVehicle(100);

            // Create booking with status that cannot be cancelled
            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(2);
            var booking = CreateTestBooking(vehicleId, userId, pickupDate, returnDate, "Completed");

            // Act & Assert - Should not be able to cancel completed booking
            try
            {
                var result = _bookingService.CancelBookingAsync(booking.Id, userId).Result;
                return false; // Should have thrown exception
            }
            catch (AggregateException ae) when (ae.InnerException is ValidationException ve)
            {
                return ve.Errors.ContainsKey("Status");
            }
            catch (ValidationException ve)
            {
                return ve.Errors.ContainsKey("Status");
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
    // Feature: backend-api-implementation, Additional Property: Empty booking list returns correct pagination
    public bool EmptyBookingListReturnsCorrectPagination(PositiveInt pageSizeGen)
    {
        var pageSize = Math.Max(1, pageSizeGen.Get % 20 + 1); // 1-20 page size

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user with no bookings
            var userId = CreateTestUser();

            var request = new BookingListRequest(
                UserId: userId,
                Suppliers: null,
                Statuses: null,
                CarId: null,
                Filter: null,
                Page: 1,
                Size: pageSize,
                Language: "en"
            );

            // Act - Get bookings for user with no bookings
            var result = _bookingService.GetUserBookingsAsync(userId, request).Result;

            // Assert - Should return empty list with correct pagination info
            return result.Data.Count == 0 &&
                   result.Page == 1 &&
                   result.PageSize == pageSize &&
                   result.TotalCount == 0 &&
                   result.TotalPages == 0;
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
        _context.BookingCancellations.RemoveRange(_context.BookingCancellations);
        _context.Bookings.RemoveRange(_context.Bookings);
        _context.VehicleImages.RemoveRange(_context.VehicleImages);
        _context.Vehicles.RemoveRange(_context.Vehicles);
        _context.Drivers.RemoveRange(_context.Drivers);
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

    private Guid CreateTestSupplier()
    {
        var supplierId = Guid.NewGuid();
        var supplier = new ApplicationUser
        {
            Id = supplierId,
            Email = $"supplier{supplierId}@example.com",
            FirstName = "Test",
            LastName = "Supplier",
            UserName = $"supplier{supplierId}@example.com",
            EmailConfirmed = true
        };
        _context.Users.Add(supplier);
        _context.SaveChanges();
        return supplierId;
    }

    private Guid CreateTestDriver()
    {
        var driverId = Guid.NewGuid();
        var userId = CreateTestUser();
        var driver = new Driver
        {
            Id = driverId,
            UserId = userId,
            LicenseNumber = $"DL{driverId.ToString()[..8].ToUpper()}",
            LicenseExpiryDate = DateTime.UtcNow.AddYears(2),
            IsActive = true,
            IsVerified = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Drivers.Add(driver);
        _context.SaveChanges();
        return driverId;
    }

    private Booking CreateTestBooking(Guid vehicleId, Guid userId, DateTime pickupDate, DateTime returnDate, string status = "Confirmed")
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
            RequiresDriver = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Bookings.Add(booking);
        _context.SaveChanges();
        return booking;
    }

    private Booking CreateTestBookingWithDriver(Guid vehicleId, Guid userId, Guid driverId, DateTime pickupDate, DateTime returnDate, string status = "Confirmed")
    {
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            BookingNumber = $"BK-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..5].ToUpper()}",
            UserId = userId,
            VehicleId = vehicleId,
            DriverId = driverId,
            PickupDate = pickupDate,
            ReturnDate = returnDate,
            TotalDays = (returnDate - pickupDate).Days,
            TotalPrice = 100 * (returnDate - pickupDate).Days,
            Status = status,
            RequiresDriver = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Bookings.Add(booking);
        _context.SaveChanges();
        return booking;
    }

    private List<Booking> CreateMultipleTestBookings(Guid userId, Guid vehicleId, int count)
    {
        var bookings = new List<Booking>();
        var baseDate = DateTime.UtcNow.AddDays(1);
        var statuses = new[] { "Pending", "Confirmed", "Cancelled", "Completed" };

        for (int i = 0; i < count; i++)
        {
            // Create separate vehicle for each booking to avoid conflicts
            var (_, newVehicleId) = CreateTestUserAndVehicle(100 + i);
            
            var pickupDate = baseDate.AddDays(i * 5); // Non-overlapping bookings
            var returnDate = pickupDate.AddDays(2);
            var status = statuses[i % statuses.Length];
            
            var booking = CreateTestBooking(newVehicleId, userId, pickupDate, returnDate, status);
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