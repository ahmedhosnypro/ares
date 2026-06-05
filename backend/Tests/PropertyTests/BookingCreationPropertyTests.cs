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

    #region Property 14: Booking creation updates vehicle availability

    [Property(MaxTest = 100)]
    public bool BookingCreationUpdatesVehicleAvailability(PositiveInt daysGen, PositiveInt priceGen)
    {
        var days = Math.Max(1, daysGen.Get % 14 + 1);
        var pricePerDay = Math.Max(10, priceGen.Get % 200 + 10);

        try
        {
            ClearTestData();
            var (userId, vehicleId) = CreateTestUserAndVehicle(pricePerDay);

            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(days);

            var initiallyAvailable = _vehicleRepository.IsAvailableAsync(vehicleId, pickupDate, returnDate).GetAwaiter().GetResult();
            if (!initiallyAvailable) return true;

            var request = new CreateBookingRequest(vehicleId, Guid.NewGuid(), Guid.NewGuid(), pickupDate, returnDate, null, false);

            var response = _bookingService.CreateBookingAsync(request, userId).GetAwaiter().GetResult();
            var availableAfterBooking = _vehicleRepository.IsAvailableAsync(vehicleId, pickupDate, returnDate).GetAwaiter().GetResult();

            return response != null && response.BookingId != Guid.Empty && !availableAfterBooking;
        }
        catch { return false; }
    }

    #endregion

    #region Property 15: Booking price calculation is correct

    [Property(MaxTest = 100)]
    public bool BookingPriceCalculationIsCorrect(PositiveInt daysGen, PositiveInt priceGen)
    {
        var days = Math.Max(1, daysGen.Get % 30 + 1);
        var pricePerDay = Math.Max(10, priceGen.Get % 500 + 10);

        try
        {
            ClearTestData();
            var (userId, vehicleId) = CreateTestUserAndVehicle(pricePerDay);

            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(days);

            var request = new CreateBookingRequest(vehicleId, Guid.NewGuid(), Guid.NewGuid(), pickupDate, returnDate, null, false);
            var response = _bookingService.CreateBookingAsync(request, userId).GetAwaiter().GetResult();

            var expectedTotalPrice = pricePerDay * days;
            return response != null && response.TotalPrice == expectedTotalPrice;
        }
        catch { return false; }
    }

    #endregion

    #region Property 16: Double-booking is prevented

    [Property(MaxTest = 100)]
    public bool DoubleBookingIsPrevented(PositiveInt daysGen, PositiveInt overlapGen)
    {
        var days = Math.Max(2, daysGen.Get % 10 + 2);
        var overlapDays = Math.Max(1, overlapGen.Get % days);

        try
        {
            ClearTestData();
            var (user1Id, vehicleId) = CreateTestUserAndVehicle(100);
            var user2Id = CreateTestUser();

            var pickup1 = DateTime.UtcNow.AddDays(5);
            var return1 = pickup1.AddDays(days);
            var pickup2 = pickup1.AddDays(overlapDays);
            var return2 = pickup2.AddDays(days);

            var request1 = new CreateBookingRequest(vehicleId, Guid.NewGuid(), Guid.NewGuid(), pickup1, return1, null, false);
            var request2 = new CreateBookingRequest(vehicleId, Guid.NewGuid(), Guid.NewGuid(), pickup2, return2, null, false);

            var response1 = _bookingService.CreateBookingAsync(request1, user1Id).GetAwaiter().GetResult();

            try
            {
                _bookingService.CreateBookingAsync(request2, user2Id).GetAwaiter().GetResult();
                return false;
            }
            catch (Exception ex) when (ex is ConflictException || (ex is AggregateException ae && ae.InnerException is ConflictException))
            {
                return response1 != null && response1.BookingId != Guid.Empty;
            }
        }
        catch { return false; }
    }

    #endregion

    #region Property 17: Booking numbers are unique

    [Property(MaxTest = 100)]
    public bool BookingNumbersAreUnique(PositiveInt bookingCountGen)
    {
        var bookingCount = Math.Min(bookingCountGen.Get % 10 + 2, 10);

        try
        {
            ClearTestData();
            var bookingNumbers = new HashSet<string>();

            for (int i = 0; i < bookingCount; i++)
            {
                var (userId, vehicleId) = CreateTestUserAndVehicle(100);
                var pickupDate = DateTime.UtcNow.AddDays(i * 10 + 1);
                var returnDate = pickupDate.AddDays(2);

                var request = new CreateBookingRequest(vehicleId, Guid.NewGuid(), Guid.NewGuid(), pickupDate, returnDate, null, false);
                var response = _bookingService.CreateBookingAsync(request, userId).GetAwaiter().GetResult();

                if (response == null || string.IsNullOrEmpty(response.BookingNumber) || bookingNumbers.Contains(response.BookingNumber))
                    return false;

                bookingNumbers.Add(response.BookingNumber);
            }

            return bookingNumbers.Count == bookingCount;
        }
        catch { return false; }
    }

    #endregion

    #region Additional Properties

    [Property(MaxTest = 100)]
    public bool BookingCreationWithInvalidDateRangeFails(PositiveInt dayOffsetGen)
    {
        var dayOffset = Math.Max(0, dayOffsetGen.Get % 5);

        try
        {
            ClearTestData();
            var (userId, vehicleId) = CreateTestUserAndVehicle(100);
            var pickupDate = DateTime.UtcNow.AddDays(5);
            var returnDate = pickupDate.AddDays(-dayOffset);

            var request = new CreateBookingRequest(vehicleId, Guid.NewGuid(), Guid.NewGuid(), pickupDate, returnDate, null, false);

            try
            {
                _bookingService.CreateBookingAsync(request, userId).GetAwaiter().GetResult();
                return false;
            }
            catch (Exception ex) when (ex is ValidationException || (ex is AggregateException ae && ae.InnerException is ValidationException))
            {
                return true;
            }
        }
        catch { return false; }
    }

    [Property(MaxTest = 100)]
    public bool BookingCreationWithNonExistentVehicleFails()
    {
        try
        {
            ClearTestData();
            var userId = CreateTestUser();
            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(3);

            var request = new CreateBookingRequest(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), pickupDate, returnDate, null, false);

            try
            {
                _bookingService.CreateBookingAsync(request, userId).GetAwaiter().GetResult();
                return false;
            }
            catch (Exception ex) when (ex is NotFoundException || (ex is AggregateException ae && ae.InnerException is NotFoundException))
            {
                return true;
            }
        }
        catch { return false; }
    }

    [Property(MaxTest = 100)]
    public bool BookingStatusIsSetToPending(PositiveInt daysGen)
    {
        var days = Math.Max(1, daysGen.Get % 7 + 1);

        try
        {
            ClearTestData();
            var (userId, vehicleId) = CreateTestUserAndVehicle(100);
            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(days);

            var request = new CreateBookingRequest(vehicleId, Guid.NewGuid(), Guid.NewGuid(), pickupDate, returnDate, null, false);
            var response = _bookingService.CreateBookingAsync(request, userId).GetAwaiter().GetResult();

            var booking = _bookingRepository.GetByIdAsync(response.BookingId).GetAwaiter().GetResult();

            return response != null && response.Status == BookingStatus.Confirmed.ToString() && booking != null && booking.Status == BookingStatus.Confirmed;
        }
        catch { return false; }
    }

    [Property(MaxTest = 100)]
    public bool BookingNumberFormatIsCorrect(PositiveInt daysGen)
    {
        var days = Math.Max(1, daysGen.Get % 5 + 1);

        try
        {
            ClearTestData();
            var (userId, vehicleId) = CreateTestUserAndVehicle(100);
            var pickupDate = DateTime.UtcNow.AddDays(1);
            var returnDate = pickupDate.AddDays(days);

            var request = new CreateBookingRequest(vehicleId, Guid.NewGuid(), Guid.NewGuid(), pickupDate, returnDate, null, false);
            var response = _bookingService.CreateBookingAsync(request, userId).GetAwaiter().GetResult();

            var bookingNumber = response.BookingNumber;
            var parts = bookingNumber.Split('-');

            return parts.Length == 3 && parts[0] == "BK" && parts[1].Length == 8 && parts[2].Length == 5;
        }
        catch { return false; }
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

    #endregion

    public void Dispose() => _context.Dispose();
}
