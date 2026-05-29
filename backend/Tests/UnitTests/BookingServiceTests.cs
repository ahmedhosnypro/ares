using Backend.Application.DTOs.Booking;
using Backend.Application.DTOs.Common;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Tests.TestUtilities;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Backend.Tests.UnitTests;

public class BookingServiceTests
{
    private readonly Mock<IBookingRepository> _bookingRepositoryMock;
    private readonly Mock<IVehicleRepository> _vehicleRepositoryMock;
    private readonly Mock<IApplicationDbContext> _contextMock;
    private readonly BookingService _bookingService;

    public BookingServiceTests()
    {
        _bookingRepositoryMock = new Mock<IBookingRepository>();
        _vehicleRepositoryMock = new Mock<IVehicleRepository>();
        _contextMock = new Mock<IApplicationDbContext>();

        var emptyUserAddresses = new List<UserAddress>().AsQueryable();
        var userAddressesDbSet = CreateMockDbSet(emptyUserAddresses);
        _contextMock.Setup(x => x.UserAddresses).Returns(userAddressesDbSet.Object);

        _bookingService = new BookingService(
            _bookingRepositoryMock.Object,
            _vehicleRepositoryMock.Object,
            _contextMock.Object,
            null!);
    }

    #region CreateBookingAsync Tests

    [Fact]
    public async Task CreateBookingAsync_WithValidRequest_ShouldCreateBookingSuccessfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var pickupDate = DateTime.UtcNow.AddDays(1);
        var returnDate = DateTime.UtcNow.AddDays(3);

        var request = new CreateBookingRequest(
            VehicleId: vehicleId,
            PickupLocationId: Guid.NewGuid(),
            DropOffLocationId: Guid.NewGuid(),
            PickupDate: pickupDate,
            ReturnDate: returnDate,
            DriverId: null,
            PayLater: false
        );

        var vehicle = new Vehicle
        {
            Id = vehicleId,
            Make = "Toyota",
            Model = "Camry",
            PricePerDay = 50.00m
        };

        _vehicleRepositoryMock.Setup(x => x.IsAvailableAsync(vehicleId, pickupDate, returnDate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _bookingRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<Booking>());

        _bookingRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _bookingService.CreateBookingAsync(request, userId);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.BookingId);
        Assert.StartsWith("BK-", result.BookingNumber);
        Assert.Equal(BookingStatus.Pending.ToString(), result.Status);
        Assert.Equal(100.00m, result.TotalPrice); // 2 days * $50
        Assert.Equal("Booking created successfully", result.Message);

        _vehicleRepositoryMock.Verify(x => x.IsAvailableAsync(vehicleId, pickupDate, returnDate, It.IsAny<CancellationToken>()), Times.Once);
        _vehicleRepositoryMock.Verify(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()), Times.Once);
        _bookingRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()), Times.Once);
        _bookingRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
    [Fact]
    public async Task CreateBookingAsync_WithUnavailableVehicle_ShouldThrowConflictException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var pickupDate = DateTime.UtcNow.AddDays(1);
        var returnDate = DateTime.UtcNow.AddDays(3);

        var request = new CreateBookingRequest(
            VehicleId: vehicleId,
            PickupLocationId: Guid.NewGuid(),
            DropOffLocationId: Guid.NewGuid(),
            PickupDate: pickupDate,
            ReturnDate: returnDate,
            DriverId: null,
            PayLater: false
        );

        _vehicleRepositoryMock.Setup(x => x.IsAvailableAsync(vehicleId, pickupDate, returnDate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ConflictException>(
            () => _bookingService.CreateBookingAsync(request, userId));

        Assert.Equal("Vehicle is not available for the selected dates", exception.Message);
        _vehicleRepositoryMock.Verify(x => x.IsAvailableAsync(vehicleId, pickupDate, returnDate, It.IsAny<CancellationToken>()), Times.Once);
        _vehicleRepositoryMock.Verify(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        _bookingRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateBookingAsync_WithNonExistentVehicle_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var pickupDate = DateTime.UtcNow.AddDays(1);
        var returnDate = DateTime.UtcNow.AddDays(3);

        var request = new CreateBookingRequest(
            VehicleId: vehicleId,
            PickupLocationId: Guid.NewGuid(),
            DropOffLocationId: Guid.NewGuid(),
            PickupDate: pickupDate,
            ReturnDate: returnDate,
            DriverId: null,
            PayLater: false
        );

        _vehicleRepositoryMock.Setup(x => x.IsAvailableAsync(vehicleId, pickupDate, returnDate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Vehicle?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _bookingService.CreateBookingAsync(request, userId));

        Assert.Equal($"Vehicle with ID {vehicleId} not found", exception.Message);
        _vehicleRepositoryMock.Verify(x => x.IsAvailableAsync(vehicleId, pickupDate, returnDate, It.IsAny<CancellationToken>()), Times.Once);
        _vehicleRepositoryMock.Verify(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()), Times.Once);
        _bookingRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateBookingAsync_WithInvalidDateRange_ShouldThrowValidationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var pickupDate = DateTime.UtcNow.AddDays(3);
        var returnDate = DateTime.UtcNow.AddDays(1); // Return date before pickup date

        var request = new CreateBookingRequest(
            VehicleId: vehicleId,
            PickupLocationId: Guid.NewGuid(),
            DropOffLocationId: Guid.NewGuid(),
            PickupDate: pickupDate,
            ReturnDate: returnDate,
            DriverId: null,
            PayLater: false
        );

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _bookingService.CreateBookingAsync(request, userId));

        Assert.Contains("DateRange", exception.Errors.Keys);
        Assert.Equal("Pickup date must be before return date", exception.Errors["DateRange"].First());
        _vehicleRepositoryMock.Verify(x => x.IsAvailableAsync(It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateBookingAsync_WithDriver_ShouldCreateBookingWithDriver()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        var pickupDate = DateTime.UtcNow.AddDays(1);
        var returnDate = DateTime.UtcNow.AddDays(5);

        var request = new CreateBookingRequest(
            VehicleId: vehicleId,
            PickupLocationId: Guid.NewGuid(),
            DropOffLocationId: Guid.NewGuid(),
            PickupDate: pickupDate,
            ReturnDate: returnDate,
            DriverId: driverId,
            PayLater: true
        );

        var vehicle = new Vehicle
        {
            Id = vehicleId,
            Make = "BMW",
            Model = "X5",
            PricePerDay = 100.00m
        };

        _vehicleRepositoryMock.Setup(x => x.IsAvailableAsync(vehicleId, pickupDate, returnDate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _bookingRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<Booking>());

        _bookingRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _bookingService.CreateBookingAsync(request, userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(400.00m, result.TotalPrice); // 4 days * $100
        Assert.Equal(BookingStatus.Pending.ToString(), result.Status);

        _bookingRepositoryMock.Verify(x => x.AddAsync(It.Is<Booking>(b =>
            b.DriverId == driverId &&
            b.RequiresDriver == true &&
            b.TotalDays == 4), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(1, 50.00, 50.00)]  // 1 day
    [InlineData(3, 75.50, 226.50)] // 3 days
    [InlineData(7, 100.00, 700.00)] // 7 days
    [InlineData(14, 25.99, 363.86)] // 14 days
    public async Task CreateBookingAsync_PriceCalculation_ShouldCalculateCorrectTotalPrice(
        int days, decimal pricePerDay, decimal expectedTotal)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var pickupDate = DateTime.UtcNow.AddDays(1);
        var returnDate = pickupDate.AddDays(days);

        var request = new CreateBookingRequest(
            VehicleId: vehicleId,
            PickupLocationId: Guid.NewGuid(),
            DropOffLocationId: Guid.NewGuid(),
            PickupDate: pickupDate,
            ReturnDate: returnDate,
            DriverId: null,
            PayLater: false
        );

        var vehicle = new Vehicle
        {
            Id = vehicleId,
            Make = "Test",
            Model = "Vehicle",
            PricePerDay = pricePerDay
        };

        _vehicleRepositoryMock.Setup(x => x.IsAvailableAsync(vehicleId, pickupDate, returnDate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _bookingRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<Booking>());

        _bookingRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _bookingService.CreateBookingAsync(request, userId);

        // Assert
        Assert.Equal(expectedTotal, result.TotalPrice);
        _bookingRepositoryMock.Verify(x => x.AddAsync(It.Is<Booking>(b =>
            b.TotalDays == days &&
            b.TotalPrice == expectedTotal), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateBookingAsync_BookingNumberGeneration_ShouldGenerateUniqueBookingNumbers()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var pickupDate = DateTime.UtcNow.AddDays(1);
        var returnDate = DateTime.UtcNow.AddDays(2);

        var request = new CreateBookingRequest(
            VehicleId: vehicleId,
            PickupLocationId: Guid.NewGuid(),
            DropOffLocationId: Guid.NewGuid(),
            PickupDate: pickupDate,
            ReturnDate: returnDate,
            DriverId: null,
            PayLater: false
        );

        var vehicle = new Vehicle
        {
            Id = vehicleId,
            Make = "Test",
            Model = "Vehicle",
            PricePerDay = 50.00m
        };

        _vehicleRepositoryMock.Setup(x => x.IsAvailableAsync(vehicleId, pickupDate, returnDate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _bookingRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<Booking>());

        _bookingRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result1 = await _bookingService.CreateBookingAsync(request, userId);
        var result2 = await _bookingService.CreateBookingAsync(request, userId);

        // Assert
        Assert.NotEqual(result1.BookingNumber, result2.BookingNumber);
        Assert.Matches(@"^BK-\d{8}-[A-Z0-9]{5}$", result1.BookingNumber);
        Assert.Matches(@"^BK-\d{8}-[A-Z0-9]{5}$", result2.BookingNumber);
    }

    #endregion

    #region GetBookingDetailsAsync Tests

    [Fact]
    public async Task GetBookingDetailsAsync_WithValidBookingAndUser_ShouldReturnBookingDetails()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        var booking = new Booking
        {
            Id = bookingId,
            UserId = userId,
            VehicleId = vehicleId,
            PickupDate = DateTime.UtcNow.AddDays(1),
            ReturnDate = DateTime.UtcNow.AddDays(3),
            TotalPrice = 150.00m,
            Status = BookingStatus.Confirmed,
            Vehicle = new Vehicle
            {
                Id = vehicleId,
                Make = "Toyota",
                Model = "Camry",
                User = new ApplicationUser
                {
                    Id = supplierId,
                    FirstName = "John",
                    LastName = "Supplier"
                },
                Images = new List<VehicleImage>
                {
                    new VehicleImage { ImageUrl = "image1.jpg", IsPrimary = true }
                }
            },
            Driver = new Driver
            {
                Id = driverId,
                UserId = Guid.NewGuid(),
                User = new ApplicationUser
                {
                    FirstName = "Jane",
                    LastName = "Driver",
                    PhoneNumber = "123-456-7890"
                }
            }
        };

        _bookingRepositoryMock.Setup(x => x.GetBookingWithDetailsAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);

        // Booking details now also resolves the latest payment for the
        // booking — wire an empty Payments set so the service can run.
        var emptyPayments = new List<BookingPayment>().AsQueryable();
        var paymentsDbSet = CreateMockDbSet(emptyPayments);
        _contextMock.Setup(x => x.Payments).Returns(paymentsDbSet.Object);

        var emptyInspections = new List<VehicleInspection>().AsQueryable();
        var inspectionsDbSet = CreateMockDbSet(emptyInspections);
        _contextMock.Setup(x => x.VehicleInspections).Returns(inspectionsDbSet.Object);

        var emptyCancellations = new List<BookingCancellation>().AsQueryable();
        var cancellationsDbSet = CreateMockDbSet(emptyCancellations);
        _contextMock.Setup(x => x.BookingCancellations).Returns(cancellationsDbSet.Object);

        // Act
        var result = await _bookingService.GetBookingDetailsAsync(bookingId, userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(bookingId, result.Id);
        Assert.Equal("Toyota Camry", result.Car.Name);
        Assert.Equal("image1.jpg", result.Car.Image);
        Assert.Equal("John Supplier", result.Car.Supplier.FullName);
        Assert.NotNull(result.Driver);
        Assert.Equal("Jane Driver", result.Driver.FullName);
        Assert.Equal("123-456-7890", result.Driver.Phone);
        Assert.Equal(150.00m, result.Price);
        Assert.Equal(BookingStatus.Confirmed.ToString(), result.Status);

        _bookingRepositoryMock.Verify(x => x.GetBookingWithDetailsAsync(bookingId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetBookingDetailsAsync_WithNonExistentBooking_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        _bookingRepositoryMock.Setup(x => x.GetBookingWithDetailsAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Booking?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _bookingService.GetBookingDetailsAsync(bookingId, userId));

        Assert.Equal($"Booking with ID {bookingId} not found", exception.Message);
        _bookingRepositoryMock.Verify(x => x.GetBookingWithDetailsAsync(bookingId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetBookingDetailsAsync_WithUnauthorizedUser_ShouldThrowForbiddenException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var booking = new Booking
        {
            Id = bookingId,
            UserId = differentUserId, // Different user ID
            VehicleId = Guid.NewGuid(),
            Status = BookingStatus.Confirmed
        };

        _bookingRepositoryMock.Setup(x => x.GetBookingWithDetailsAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ForbiddenException>(
            () => _bookingService.GetBookingDetailsAsync(bookingId, userId));

        Assert.Equal("You do not have permission to view this booking", exception.Message);
        _bookingRepositoryMock.Verify(x => x.GetBookingWithDetailsAsync(bookingId, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion
    #region CancelBookingAsync Tests

    [Fact]
    public async Task CancelBookingAsync_WithValidBookingAndUser_ShouldCancelBookingSuccessfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();

        var booking = new Booking
        {
            Id = bookingId,
            UserId = userId,
            VehicleId = vehicleId,
            Status = BookingStatus.Confirmed,
            TotalPrice = 200.00m,
            Vehicle = new Vehicle { Id = vehicleId }
        };

        var bookings = new List<Booking> { booking }.AsQueryable();
        var mockDbSet = CreateMockDbSet(bookings);

        _contextMock.Setup(x => x.Bookings).Returns(mockDbSet.Object);
        _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _contextMock.Setup(x => x.AddBookingCancellation(It.IsAny<BookingCancellation>()));

        _bookingRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _bookingService.CancelBookingAsync(bookingId, userId);

        // Assert
        Assert.True(result);
        Assert.Equal(BookingStatus.Cancelled, booking.Status);
        Assert.NotNull(booking.CancelledAt);

        _bookingRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()), Times.Once);
        _contextMock.Verify(x => x.AddBookingCancellation(It.IsAny<BookingCancellation>()), Times.Once);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CancelBookingAsync_WithNonExistentBooking_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var bookings = new List<Booking>().AsQueryable();
        var mockDbSet = CreateMockDbSet(bookings);

        _contextMock.Setup(x => x.Bookings).Returns(mockDbSet.Object);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _bookingService.CancelBookingAsync(bookingId, userId));

        Assert.Equal($"Booking with ID {bookingId} not found", exception.Message);
        _bookingRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CancelBookingAsync_WithUnauthorizedUser_ShouldThrowForbiddenException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var booking = new Booking
        {
            Id = bookingId,
            UserId = differentUserId, // Different user ID
            Status = BookingStatus.Confirmed
        };

        var bookings = new List<Booking> { booking }.AsQueryable();
        var mockDbSet = CreateMockDbSet(bookings);

        _contextMock.Setup(x => x.Bookings).Returns(mockDbSet.Object);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ForbiddenException>(
            () => _bookingService.CancelBookingAsync(bookingId, userId));

        Assert.Equal("You do not have permission to cancel this booking", exception.Message);
        _bookingRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(BookingStatus.Cancelled)]
    [InlineData(BookingStatus.Completed)]
    public async Task CancelBookingAsync_WithNonCancellableStatus_ShouldThrowValidationException(BookingStatus status)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var booking = new Booking
        {
            Id = bookingId,
            UserId = userId,
            Status = status
        };

        var bookings = new List<Booking> { booking }.AsQueryable();
        var mockDbSet = CreateMockDbSet(bookings);

        _contextMock.Setup(x => x.Bookings).Returns(mockDbSet.Object);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _bookingService.CancelBookingAsync(bookingId, userId));

        Assert.Contains("Status", exception.Errors.Keys);
        Assert.Equal("This booking cannot be cancelled", exception.Errors["Status"].First());
        _bookingRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region HasUserBookingsAsync Tests

    [Fact]
    public async Task HasUserBookingsAsync_WithUserHavingBookings_ShouldReturnTrue()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _bookingRepositoryMock.Setup(x => x.HasUserBookingsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _bookingService.HasUserBookingsAsync(userId);

        // Assert
        Assert.True(result);
        _bookingRepositoryMock.Verify(x => x.HasUserBookingsAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HasUserBookingsAsync_WithUserHavingNoBookings_ShouldReturnFalse()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _bookingRepositoryMock.Setup(x => x.HasUserBookingsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _bookingService.HasUserBookingsAsync(userId);

        // Assert
        Assert.False(result);
        _bookingRepositoryMock.Verify(x => x.HasUserBookingsAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region GetUserBookingsAsync Tests

    [Fact]
    public async Task GetUserBookingsAsync_WithValidRequest_ShouldReturnPaginatedBookings()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();

        var bookings = new List<Booking>
        {
            new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                VehicleId = vehicleId,
                PickupDate = DateTime.UtcNow.AddDays(1),
                ReturnDate = DateTime.UtcNow.AddDays(3),
                TotalPrice = 150.00m,
                Status = BookingStatus.Confirmed,
                Vehicle = new Vehicle
                {
                    Id = vehicleId,
                    Make = "Toyota",
                    Model = "Camry",
                    User = new ApplicationUser
                    {
                        Id = supplierId,
                        FirstName = "John",
                        LastName = "Supplier"
                    },
                    Images = new List<VehicleImage>
                    {
                        new VehicleImage { ImageUrl = "image1.jpg", IsPrimary = true }
                    }
                }
            }
        };

        var request = new BookingListRequest(
            UserId: userId,
            Suppliers: null,
            Statuses: null,
            CarId: null,
            Filter: null,
            Page: 1,
            Size: 10,
            Language: "en"
        );

        var emptyPayments = new List<BookingPayment>().AsQueryable();
        var paymentsDbSet = CreateMockDbSet(emptyPayments);
        _contextMock.Setup(x => x.Payments).Returns(paymentsDbSet.Object);

        _bookingRepositoryMock.Setup(x => x.GetUserBookingsAsync(
            userId, null, null, null, null, null, null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(bookings);

        // Act
        var result = await _bookingService.GetUserBookingsAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.Data);
        Assert.Equal(1, result.Page);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(1, result.TotalCount);
        Assert.Equal(1, result.TotalPages);

        var bookingDto = result.Data.First();
        Assert.Equal("Toyota Camry", bookingDto.Car.Name);
        Assert.Equal("John Supplier", bookingDto.Supplier.FullName);
        Assert.Equal(150.00m, bookingDto.Price);
        Assert.Equal(BookingStatus.Confirmed.ToString(), bookingDto.Status);

        _bookingRepositoryMock.Verify(x => x.GetUserBookingsAsync(
            userId, null, null, null, null, null, null, null, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetUserBookingsAsync_WithFilters_ShouldPassFiltersToRepository()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var suppliers = new List<Guid> { Guid.NewGuid() };
        var statuses = new List<string> { "Confirmed", "Pending" };
        var carId = Guid.NewGuid();
        var fromDate = DateTime.UtcNow.AddDays(-10);
        var toDate = DateTime.UtcNow.AddDays(10);
        var keyword = "test";
        var pickupLocation = Guid.NewGuid();
        var dropOffLocation = Guid.NewGuid();

        var request = new BookingListRequest(
            UserId: userId,
            Suppliers: suppliers,
            Statuses: statuses,
            CarId: carId,
            Filter: new BookingFilters(
                From: fromDate,
                To: toDate,
                Keyword: keyword,
                PickupLocation: pickupLocation,
                DropOffLocation: dropOffLocation
            ),
            Page: 2,
            Size: 5,
            Language: "en"
        );

        var emptyPayments = new List<BookingPayment>().AsQueryable();
        var paymentsDbSet = CreateMockDbSet(emptyPayments);
        _contextMock.Setup(x => x.Payments).Returns(paymentsDbSet.Object);

        _bookingRepositoryMock.Setup(x => x.GetUserBookingsAsync(
            userId, suppliers, statuses, carId, fromDate, toDate, keyword, pickupLocation, dropOffLocation, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking>());

        // Act
        var result = await _bookingService.GetUserBookingsAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.Data);
        Assert.Equal(2, result.Page);
        Assert.Equal(5, result.PageSize);

        _bookingRepositoryMock.Verify(x => x.GetUserBookingsAsync(
            userId, suppliers, statuses, carId, fromDate, toDate, keyword, pickupLocation, dropOffLocation, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region Helper Methods

    private static Mock<DbSet<T>> CreateMockDbSet<T>(IQueryable<T> data) where T : class
    {
        return data.BuildMockDbSet();
    }

    #endregion
}