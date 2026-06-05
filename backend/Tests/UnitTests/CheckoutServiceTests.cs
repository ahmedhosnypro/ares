using Backend.Application.DTOs.Checkout;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Tests.TestUtilities;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace Backend.Tests.UnitTests;

/// <summary>
/// Covers the staged checkout flow's core business rules:
/// the mandatory-driver gate and the "booking + payment created together,
/// only after payment" guarantee.
/// </summary>
public class CheckoutServiceTests
{
    private readonly Mock<IBookingRepository> _bookingRepositoryMock = new();
    private readonly Mock<IVehicleRepository> _vehicleRepositoryMock = new();
    private readonly Mock<IPaymentRepository> _paymentRepositoryMock = new();
    private readonly Mock<IDriverProfileRepository> _driverProfileRepositoryMock = new();
    private readonly Mock<IDriverReviewRepository> _driverReviewRepositoryMock = new();
    private readonly Mock<IDriverPricingService> _driverPricingServiceMock = new();
    private readonly Mock<IVerificationService> _verificationServiceMock = new();
    private readonly Mock<IApplicationDbContext> _contextMock = new();
    private readonly IConfiguration _configuration =
        new ConfigurationBuilder().AddInMemoryCollection().Build();
    private readonly CheckoutService _service;

    public CheckoutServiceTests()
    {
        _service = new CheckoutService(
            _bookingRepositoryMock.Object,
            _vehicleRepositoryMock.Object,
            _paymentRepositoryMock.Object,
            _driverProfileRepositoryMock.Object,
            _driverReviewRepositoryMock.Object,
            _driverPricingServiceMock.Object,
            _verificationServiceMock.Object,
            _contextMock.Object,
            _configuration,
            notificationService: null);
    }

    private void SetupLicenses(params Driver[] licenses)
    {
        var set = licenses.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(x => x.Drivers).Returns(set.Object);
    }

    private void SetupHappyVehicle(Guid vehicleId, Guid customerId)
    {
        _verificationServiceMock
            .Setup(x => x.IsApprovedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _vehicleRepositoryMock
            .Setup(x => x.IsAvailableAsync(vehicleId, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _vehicleRepositoryMock
            .Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Vehicle
            {
                Id = vehicleId,
                Make = "Toyota",
                Model = "Camry",
                IsActive = true,
                UserId = Guid.NewGuid(), // not the customer
                PricePerDay = 50.00m
            });
        _bookingRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Booking b, CancellationToken _) => b);
        _paymentRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<BookingPayment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((BookingPayment p, CancellationToken _) => p);
        _bookingRepositoryMock
            .Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        _driverPricingServiceMock
            .Setup(x => x.GetDailyRateAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(25.00m);
    }

    private static CheckoutRequest BuildRequest(Guid vehicleId, bool needDriver, Guid? driverProfileId)
        => new(
            VehicleId: vehicleId,
            PickupLocationId: Guid.NewGuid(),
            DropOffLocationId: Guid.NewGuid(),
            PickupDate: DateTime.UtcNow.AddDays(2),
            ReturnDate: DateTime.UtcNow.AddDays(5),
            NeedDriver: needDriver,
            DriverProfileId: driverProfileId,
            PaymentMethod: "credit_card");

    [Fact]
    public async Task CheckoutAsync_WhenNoLicenseAndSelfDrive_ShouldThrowBadRequestException()
    {
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        SetupHappyVehicle(vehicleId, userId);
        SetupLicenses(); // no approved license

        var request = BuildRequest(vehicleId, needDriver: false, driverProfileId: null);

        await Assert.ThrowsAsync<BadRequestException>(
            () => _service.CheckoutAsync(request, userId));

        _bookingRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()), Times.Never);
        _paymentRepositoryMock.Verify(x => x.AddAsync(It.IsAny<BookingPayment>(), It.IsAny<CancellationToken>()), Times.Never);
        _bookingRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckoutAsync_WhenNeedDriverButNoneSelected_ShouldThrowBadRequestException()
    {
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        SetupHappyVehicle(vehicleId, userId);
        SetupLicenses(); // no license → driver mandatory

        var request = BuildRequest(vehicleId, needDriver: true, driverProfileId: null);

        await Assert.ThrowsAsync<BadRequestException>(
            () => _service.CheckoutAsync(request, userId));

        _bookingRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()), Times.Never);
        _paymentRepositoryMock.Verify(x => x.AddAsync(It.IsAny<BookingPayment>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckoutAsync_WithSelectedDriver_ShouldCreateConfirmedBookingAndPaymentTogether()
    {
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var driverProfileId = Guid.NewGuid();
        SetupHappyVehicle(vehicleId, userId);
        SetupLicenses(); // no license → driver mandatory (and selected here)

        _driverProfileRepositoryMock
            .Setup(x => x.GetByIdWithUserAsync(driverProfileId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DriverProfile
            {
                Id = driverProfileId,
                UserId = Guid.NewGuid(),
                Status = DriverProfileStatus.Verified,
                IsActive = true,
                Availability = DriverAvailability.Available,
                CreatedAt = DateTime.UtcNow.AddYears(-2),
                User = new ApplicationUser { FirstName = "Sam", LastName = "Driver" }
            });
        _driverProfileRepositoryMock
            .Setup(x => x.HasOverlappingAssignmentAsync(driverProfileId, It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _driverProfileRepositoryMock
            .Setup(x => x.UpdateAsync(It.IsAny<DriverProfile>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var request = BuildRequest(vehicleId, needDriver: true, driverProfileId: driverProfileId);

        var result = await _service.CheckoutAsync(request, userId);

        // 3 days * (50 vehicle + 25 driver) = 225
        Assert.Equal("Confirmed", result.Status);
        Assert.Equal(225.00m, result.TotalPrice);

        _bookingRepositoryMock.Verify(x => x.AddAsync(
            It.Is<Booking>(b =>
                b.Status == BookingStatus.Confirmed &&
                b.RequiresDriver &&
                b.AssignedDriverProfileId == driverProfileId &&
                b.GrandTotal == 225.00m),
            It.IsAny<CancellationToken>()), Times.Once);

        _paymentRepositoryMock.Verify(x => x.AddAsync(
            It.Is<BookingPayment>(p => p.Status == "Captured" && p.Amount == 225.00m),
            It.IsAny<CancellationToken>()), Times.Once);

        // The booking + payment are committed atomically via the race-safe
        // reservation (SERIALIZABLE / UPDLOCK+HOLDLOCK) rather than a bare SaveChanges.
        _bookingRepositoryMock.Verify(x => x.ReserveVehicleAtomicAsync(
            It.Is<Booking>(b => b.Status == BookingStatus.Confirmed),
            BookingStatus.Confirmed,
            It.IsAny<DateTime?>(),
            It.IsAny<DateTime?>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CheckoutAsync_WithApprovedLicenseSelfDrive_ShouldCreateConfirmedBookingWithoutDriver()
    {
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        SetupHappyVehicle(vehicleId, userId);
        SetupLicenses(new Driver
        {
            UserId = userId,
            IsVerified = true,
            LicenseNumber = "L-123",
            LicenseExpiryDate = DateTime.UtcNow.AddYears(1)
        });

        var request = BuildRequest(vehicleId, needDriver: false, driverProfileId: null);

        var result = await _service.CheckoutAsync(request, userId);

        // 3 days * 50 vehicle = 150, no driver fee
        Assert.Equal("Confirmed", result.Status);
        Assert.Equal(150.00m, result.TotalPrice);

        _bookingRepositoryMock.Verify(x => x.AddAsync(
            It.Is<Booking>(b =>
                b.Status == BookingStatus.Confirmed &&
                !b.RequiresDriver &&
                b.AssignedDriverProfileId == null &&
                b.GrandTotal == 150.00m),
            It.IsAny<CancellationToken>()), Times.Once);

        _paymentRepositoryMock.Verify(x => x.AddAsync(
            It.Is<BookingPayment>(p => p.Status == "Captured" && p.Amount == 150.00m),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
