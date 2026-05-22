using Backend.Application.DTOs.Common;
using Backend.Application.Interfaces;
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
/// Property-based tests for repository pagination functionality using FsCheck.
/// Each property validates universal correctness guarantees for pagination across all valid inputs.
/// </summary>
public class RepositoryPaginationPropertyTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IBookingRepository _bookingRepository;
    private readonly IPaymentRepository _paymentRepository;

    public RepositoryPaginationPropertyTests()
    {
        // Setup in-memory database for testing
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _bookingRepository = new BookingRepository(_context);
        _paymentRepository = new PaymentRepository(_context);

        // Ensure database is created
        _context.Database.EnsureCreated();
    }

    #region Property 18: Booking list pagination works correctly

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 18: Booking list pagination works correctly
    public bool BookingListPaginationWorksCorrectly(PositiveInt totalBookingsGen, PositiveInt pageGen, PositiveInt pageSizeGen)
    {
        // Extract values and constrain to valid ranges
        var totalBookings = Math.Min(totalBookingsGen.Get % 101, 100); // 0-100
        var page = Math.Max(1, pageGen.Get % 10 + 1); // 1-10
        var pageSize = Math.Max(1, pageSizeGen.Get % 20 + 1); // 1-20

        try
        {
            // Clear any existing data
            _context.Bookings.RemoveRange(_context.Bookings);
            _context.Users.RemoveRange(_context.Users);
            _context.Vehicles.RemoveRange(_context.Vehicles);
            _context.SaveChanges();

            // Create test user
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

            // Create test vehicle
            var vehicleId = Guid.NewGuid();
            var vehicle = new Vehicle
            {
                Id = vehicleId,
                Make = "Test",
                Model = "Vehicle",
                Year = 2023,
                LicensePlate = "TEST123",
                PricePerDay = 100,
                UserId = userId
            };
            _context.Vehicles.Add(vehicle);

            // Create test bookings
            var bookings = new List<Booking>();
            for (int i = 0; i < totalBookings; i++)
            {
                var booking = new Booking
                {
                    Id = Guid.NewGuid(),
                    BookingNumber = $"BK{i:D6}",
                    UserId = userId,
                    VehicleId = vehicleId,
                    PickupDate = DateTime.UtcNow.AddDays(i),
                    ReturnDate = DateTime.UtcNow.AddDays(i + 1),
                    TotalPrice = 100,
                    Status = BookingStatus.Confirmed,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-i)
                };
                bookings.Add(booking);
            }

            _context.Bookings.AddRange(bookings);
            _context.SaveChanges();

            // Act - Get paginated results
            var result = _bookingRepository.GetPagedAsync(page, pageSize).Result;

            // Assert - Verify pagination properties
            var expectedTotalPages = (int)Math.Ceiling(totalBookings / (double)pageSize);
            var expectedItemCount = totalBookings == 0 ? 0 :
                page > expectedTotalPages ? 0 :
                page == expectedTotalPages ? totalBookings - ((page - 1) * pageSize) :
                pageSize;

            return result.TotalCount == totalBookings &&
                   result.Page == page &&
                   result.PageSize == pageSize &&
                   result.TotalPages == expectedTotalPages &&
                   result.Data.Count == expectedItemCount &&
                   result.Data.Count <= pageSize;
        }
        catch
        {
            // If any exception occurs, the property fails
            return false;
        }
    }

    #endregion

    #region Property 26: Payment history pagination works correctly

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 26: Payment history pagination works correctly
    public bool PaymentHistoryPaginationWorksCorrectly(PositiveInt totalPaymentsGen, PositiveInt pageGen, PositiveInt pageSizeGen)
    {
        // Extract values and constrain to valid ranges
        var totalPayments = Math.Min(totalPaymentsGen.Get % 101, 100); // 0-100
        var page = Math.Max(1, pageGen.Get % 10 + 1); // 1-10
        var pageSize = Math.Max(1, pageSizeGen.Get % 20 + 1); // 1-20

        try
        {
            // Clear any existing data
            _context.Payments.RemoveRange(_context.Payments);
            _context.Bookings.RemoveRange(_context.Bookings);
            _context.Users.RemoveRange(_context.Users);
            _context.Vehicles.RemoveRange(_context.Vehicles);
            _context.SaveChanges();

            // Create test user
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

            // Create test vehicle
            var vehicleId = Guid.NewGuid();
            var vehicle = new Vehicle
            {
                Id = vehicleId,
                Make = "Test",
                Model = "Vehicle",
                Year = 2023,
                LicensePlate = "TEST123",
                PricePerDay = 100,
                UserId = userId
            };
            _context.Vehicles.Add(vehicle);

            // Create test bookings and payments
            var payments = new List<BookingPayment>();
            for (int i = 0; i < totalPayments; i++)
            {
                var booking = new Booking
                {
                    Id = Guid.NewGuid(),
                    BookingNumber = $"BK{i:D6}",
                    UserId = userId,
                    VehicleId = vehicleId,
                    PickupDate = DateTime.UtcNow.AddDays(i),
                    ReturnDate = DateTime.UtcNow.AddDays(i + 1),
                    TotalPrice = 100,
                    Status = BookingStatus.Confirmed,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-i)
                };
                _context.Bookings.Add(booking);

                var payment = new BookingPayment
                {
                    PaymentId = Guid.NewGuid(),
                    BookingId = booking.Id,
                    TransactionId = Guid.NewGuid(),
                    PaymentMethod = "CreditCard",
                    Amount = 100,
                    Currency = "USD",
                    Status = "Completed",
                    ProcessedAt = DateTime.UtcNow.AddMinutes(-i),
                    CreatedAt = DateTime.UtcNow.AddMinutes(-i)
                };
                payments.Add(payment);
            }

            _context.Payments.AddRange(payments);
            _context.SaveChanges();

            // Act - Get paginated results
            var result = _paymentRepository.GetPagedAsync(page, pageSize).Result;

            // Assert - Verify pagination properties
            var expectedTotalPages = (int)Math.Ceiling(totalPayments / (double)pageSize);
            var expectedItemCount = totalPayments == 0 ? 0 :
                page > expectedTotalPages ? 0 :
                page == expectedTotalPages ? totalPayments - ((page - 1) * pageSize) :
                pageSize;

            return result.TotalCount == totalPayments &&
                   result.Page == page &&
                   result.PageSize == pageSize &&
                   result.TotalPages == expectedTotalPages &&
                   result.Data.Count == expectedItemCount &&
                   result.Data.Count <= pageSize;
        }
        catch
        {
            // If any exception occurs, the property fails
            return false;
        }
    }

    #endregion

    #region Additional Pagination Properties

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Pagination metadata consistency
    public bool PaginationMetadataIsConsistent(PositiveInt totalItemsGen, PositiveInt pageGen, PositiveInt pageSizeGen)
    {
        // Extract values and constrain to valid ranges
        var totalItems = Math.Min(totalItemsGen.Get % 51, 50); // 0-50
        var page = Math.Max(1, pageGen.Get % 10 + 1); // 1-10
        var pageSize = Math.Max(1, pageSizeGen.Get % 10 + 1); // 1-10

        try
        {
            // Clear existing data
            _context.Bookings.RemoveRange(_context.Bookings);
            _context.Users.RemoveRange(_context.Users);
            _context.Vehicles.RemoveRange(_context.Vehicles);
            _context.SaveChanges();

            // Create test data if needed
            if (totalItems > 0)
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
                    Make = "Test",
                    Model = "Vehicle",
                    Year = 2023,
                    LicensePlate = "TEST123",
                    PricePerDay = 100,
                    UserId = userId
                };
                _context.Vehicles.Add(vehicle);

                for (int i = 0; i < totalItems; i++)
                {
                    var booking = new Booking
                    {
                        Id = Guid.NewGuid(),
                        BookingNumber = $"BK{i:D6}",
                        UserId = userId,
                        VehicleId = vehicleId,
                        PickupDate = DateTime.UtcNow.AddDays(i),
                        ReturnDate = DateTime.UtcNow.AddDays(i + 1),
                        TotalPrice = 100,
                        Status = BookingStatus.Confirmed,
                        CreatedAt = DateTime.UtcNow.AddMinutes(-i)
                    };
                    _context.Bookings.Add(booking);
                }
                _context.SaveChanges();
            }

            // Act
            var result = _bookingRepository.GetPagedAsync(page, pageSize).Result;

            // Assert - Verify metadata consistency
            var expectedTotalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
            var expectedHasPrevious = page > 1;
            var expectedHasNext = page < expectedTotalPages;

            return result.TotalCount == totalItems &&
                   result.TotalPages == expectedTotalPages &&
                   result.HasPreviousPage == expectedHasPrevious &&
                   result.HasNextPage == expectedHasNext;
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Empty result set pagination
    public bool EmptyResultSetPaginationWorksCorrectly(PositiveInt pageGen, PositiveInt pageSizeGen)
    {
        // Extract values and constrain to valid ranges - ensure pageSize is always >= 1
        var page = Math.Max(1, pageGen.Get % 5 + 1); // 1-5
        var pageSize = Math.Max(1, pageSizeGen.Get % 10 + 1); // 1-10

        // Use a fresh database context for this test to avoid state issues
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var testContext = new ApplicationDbContext(options);
        testContext.Database.EnsureCreated();
        var testRepository = new BookingRepository(testContext);

        try
        {
            // Ensure empty result set (database is already empty since it's new)
            // Act
            var result = testRepository.GetPagedAsync(page, pageSize).Result;

            // Assert - Empty result set should have consistent metadata
            // When totalCount is 0, totalPages should be 0 (Math.Ceiling(0 / pageSize) = 0)
            var expectedTotalPages = 0;
            // For empty result sets, HasPreviousPage should follow normal logic: page > 1
            var expectedHasPrevious = page > 1;
            // For empty result sets, HasNextPage should be false since totalPages = 0
            var expectedHasNext = false;

            return result.TotalCount == 0 &&
                   result.TotalPages == expectedTotalPages &&
                   result.Data.Count == 0 &&
                   result.Page == page &&
                   result.PageSize == pageSize &&
                   result.HasPreviousPage == expectedHasPrevious &&
                   result.HasNextPage == expectedHasNext;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}