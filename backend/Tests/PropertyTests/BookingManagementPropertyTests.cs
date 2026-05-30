using Backend.Application.DTOs.Booking;
using Backend.Application.DTOs.Common;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Repositories;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Moq;
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

        // Mock UserManager
        var store = new Mock<IUserStore<ApplicationUser>>();
        var userManagerMock = new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        
        userManagerMock.Setup(x => x.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((string id) => new ApplicationUser { Id = Guid.Parse(id) });
        userManagerMock.Setup(x => x.IsInRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
            .ReturnsAsync(false);

        _bookingService = new BookingService(_bookingRepository, _vehicleRepository, _context, userManagerMock.Object, null!);

        // Ensure database is created
        _context.Database.EnsureCreated();
    }

    #region Property 18: Booking list pagination works correctly

    [Property(MaxTest = 100)]
    public bool BookingListPaginationWorksCorrectly(PositiveInt bookingCountGen, PositiveInt pageSizeGen)
    {
        var bookingCount = Math.Max(1, bookingCountGen.Get % 20 + 1);
        var pageSize = Math.Max(1, pageSizeGen.Get % 10 + 1);

        try
        {
            ClearTestData();
            var (userId, vehicleId) = CreateTestUserAndVehicle(100);
            var bookings = CreateMultipleTestBookings(userId, vehicleId, bookingCount);

            var totalPages = (int)Math.Ceiling((double)bookingCount / pageSize);

            for (int page = 1; page <= Math.Min(totalPages, 3); page++)
            {
                var request = new BookingListRequest(userId, null, null, null, null, page, pageSize, "en");
                var result = _bookingService.GetUserBookingsAsync(userId, request).GetAwaiter().GetResult();

                if (result.Page != page || result.PageSize != pageSize || result.TotalCount != bookingCount || result.TotalPages != totalPages)
                    return false;
            }

            return true;
        }
        catch { return false; }
    }

    #endregion

    #region Property 19: Booking filters return only matching bookings

    [Property(MaxTest = 100)]
    public bool BookingFiltersReturnOnlyMatchingBookings(PositiveInt bookingCountGen)
    {
        var bookingCount = Math.Max(3, bookingCountGen.Get % 10 + 3);

        try
        {
            ClearTestData();
            var (user1Id, vehicle1Id) = CreateTestUserAndVehicle(100);
            var (user2Id, vehicle2Id) = CreateTestUserAndVehicle(150);

            var baseDate = DateTime.UtcNow.AddDays(1);
            for (int i = 0; i < bookingCount; i++)
            {
                var pickupDate = baseDate.AddDays(i * 3);
                var returnDate = pickupDate.AddDays(2);
                var vehicleId = i % 2 == 0 ? vehicle1Id : vehicle2Id;
                CreateTestBooking(vehicleId, user1Id, pickupDate, returnDate, BookingStatus.Confirmed);
            }

            var request = new BookingListRequest(user1Id, null, new List<string> { "Confirmed" }, null, null, 1, 20, "en");
            var result = _bookingService.GetUserBookingsAsync(user1Id, request).GetAwaiter().GetResult();

            return result.Data.All(b => b.Status == "Confirmed") && result.TotalCount == bookingCount;
        }
        catch { return false; }
    }

    #endregion

    #region Property 20: Booking details returns complete information

    [Property(MaxTest = 100)]
    public bool BookingDetailsReturnsCompleteInformation(PositiveInt priceGen)
    {
        try
        {
            ClearTestData();
            var (userId, vehicleId) = CreateTestUserAndVehicle(100);
            var booking = CreateTestBooking(vehicleId, userId, DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(3), BookingStatus.Confirmed);

            // Wire Payments set
            _context.Payments.RemoveRange(_context.Payments);
            _context.SaveChanges();

            var result = _bookingService.GetBookingDetailsAsync(booking.Id, userId).GetAwaiter().GetResult();

            return result.Id == booking.Id && result.Car != null && result.Car.Id == vehicleId;
        }
        catch { return false; }
    }

    #endregion

    #region Property 21: Booking cancellation updates status

    [Property(MaxTest = 100)]
    public bool BookingCancellationUpdatesStatus(PositiveInt daysGen)
    {
        try
        {
            ClearTestData();
            var (userId, vehicleId) = CreateTestUserAndVehicle(100);
            var booking = CreateTestBooking(vehicleId, userId, DateTime.UtcNow.AddDays(5), DateTime.UtcNow.AddDays(10), BookingStatus.Confirmed);

            var cancellationResult = _bookingService.CancelBookingAsync(booking.Id, userId).GetAwaiter().GetResult();
            var updatedBooking = _context.Bookings.First(b => b.Id == booking.Id);

            return cancellationResult && updatedBooking.Status == BookingStatus.Cancelled;
        }
        catch { return false; }
    }

    #endregion

    #region Helper Methods

    private void ClearTestData()
    {
        _context.BookingCancellations.RemoveRange(_context.BookingCancellations);
        _context.Bookings.RemoveRange(_context.Bookings);
        _context.VehicleImages.RemoveRange(_context.VehicleImages);
        _context.Vehicles.RemoveRange(_context.Vehicles);
        _context.Users.RemoveRange(_context.Users);
        _context.SaveChanges();
    }

    private (Guid userId, Guid vehicleId) CreateTestUserAndVehicle(decimal pricePerDay)
    {
        var customerId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        
        _context.Users.Add(new ApplicationUser { Id = customerId, UserName = customerId.ToString(), Email = customerId + "@test.com" });
        _context.Users.Add(new ApplicationUser { Id = supplierId, UserName = supplierId.ToString(), Email = supplierId + "@test.com" });

        var vehicleId = Guid.NewGuid();
        var vehicle = new Vehicle
        {
            Id = vehicleId,
            UserId = supplierId,
            Make = "Toyota",
            Model = "Camry",
            Year = 2023,
            LicensePlate = "TEST-" + vehicleId.ToString()[..4],
            PricePerDay = pricePerDay,
            Status = "Available",
            AvailabilityStatus = "Available",
            IsActive = true
        };
        _context.Vehicles.Add(vehicle);
        _context.VehicleImages.Add(new VehicleImage { Id = Guid.NewGuid(), VehicleId = vehicleId, ImageUrl = "test.jpg", IsPrimary = true });

        _context.SaveChanges();
        return (customerId, vehicleId);
    }

    private Guid CreateTestUser()
    {
        var userId = Guid.NewGuid();
        _context.Users.Add(new ApplicationUser { Id = userId, UserName = userId.ToString(), Email = userId + "@test.com" });
        _context.SaveChanges();
        return userId;
    }

    private Booking CreateTestBooking(Guid vehicleId, Guid userId, DateTime pickupDate, DateTime returnDate, BookingStatus status)
    {
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            BookingNumber = "BK-" + Guid.NewGuid().ToString("N")[..8].ToUpper(),
            UserId = userId,
            VehicleId = vehicleId,
            PickupDate = pickupDate,
            ReturnDate = returnDate,
            Status = status,
            TotalPrice = 100,
            TotalDays = 1,
            CreatedAt = DateTime.UtcNow
        };
        _context.Bookings.Add(booking);
        _context.SaveChanges();
        return booking;
    }

    private List<Booking> CreateMultipleTestBookings(Guid userId, Guid vehicleId, int count)
    {
        var bookings = new List<Booking>();
        for (int i = 0; i < count; i++)
        {
            bookings.Add(CreateTestBooking(vehicleId, userId, DateTime.UtcNow.AddDays(i * 5), DateTime.UtcNow.AddDays(i * 5 + 2), BookingStatus.Confirmed));
        }
        return bookings;
    }

    #endregion

    public void Dispose() => _context.Dispose();
}
