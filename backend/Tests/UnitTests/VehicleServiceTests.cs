using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Vehicle;
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

/// <summary>
/// Unit tests for VehicleService focusing on search functionality
/// Tests various filter combinations, pagination, sorting, and availability filtering
/// </summary>
public class VehicleServiceTests : IDisposable
{
    private readonly Mock<IVehicleRepository> _vehicleRepositoryMock;
    private readonly Mock<IReviewRepository> _reviewRepositoryMock;
    private readonly Mock<IBookingRepository> _bookingRepositoryMock;
    private readonly Mock<IApplicationDbContext> _contextMock;
    private readonly Mock<IPricingService> _pricingServiceMock;
    private readonly VehicleService _vehicleService;

    public VehicleServiceTests()
    {
        _vehicleRepositoryMock = new Mock<IVehicleRepository>();
        _reviewRepositoryMock = new Mock<IReviewRepository>();
        _bookingRepositoryMock = new Mock<IBookingRepository>();
        _contextMock = new Mock<IApplicationDbContext>();
        _pricingServiceMock = new Mock<IPricingService>();

        var discountCodesQueryable = new List<DiscountCode>().AsQueryable().BuildMockDbSet();
        _contextMock.Setup(x => x.DiscountCodes).Returns(discountCodesQueryable.Object);

        _pricingServiceMock.Setup(x => x.CalculateBookingPricingAsync(It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid vId, DateTime start, DateTime end, CancellationToken ct) =>
            {
                var days = (end - start).Days;
                if (days <= 0) days = 1;

                var vehicle = _vehicleRepositoryMock.Object.GetByIdAsync(vId, ct).Result;
                if (vehicle == null)
                {
                    throw new NotFoundException($"Vehicle with ID {vId} not found");
                }
                var rate = vehicle.PricePerDay ?? 100m;
                return (rate * days, 0m, rate * days);
            });

        _vehicleService = new VehicleService(
            _vehicleRepositoryMock.Object,
            _reviewRepositoryMock.Object,
            _bookingRepositoryMock.Object,
            _contextMock.Object,
            _pricingServiceMock.Object,
            new Mock<INotificationService>().Object);
    }

    public void Dispose()
    {
        // Cleanup if needed
    }

    #region SearchVehiclesAsync Tests

    [Fact]
    public async Task SearchVehiclesAsync_WithValidRequest_ShouldReturnPaginatedResults()
    {
        // Arrange
        var request = new VehicleSearchRequest(
            PickupLocationId: Guid.NewGuid(),
            ReturnLocationId: null,
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(3),
            Page: 1,
            Limit: 10);

        var vehicles = CreateTestVehicles(15); // More than page limit
        var reviewsQueryable = CreateMockReviewsQueryable();

        _vehicleRepositoryMock.Setup(x => x.SearchAvailableVehiclesAsync(
                request.PickupLocationId,
                request.ReturnLocationId,
                request.PickupDate,
                request.ReturnDate,
                request.Category,
                request.Transmission,
                request.MinPrice,
                request.MaxPrice,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicles);

        _contextMock.Setup(x => x.Reviews)
            .Returns(reviewsQueryable);

        // Act
        var result = await _vehicleService.SearchVehiclesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.Data.Count); // Should be limited by page size
        Assert.Equal(1, result.Page);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(15, result.TotalCount);
        Assert.Equal(2, result.TotalPages); // 15 items / 10 per page = 2 pages

        _vehicleRepositoryMock.Verify(x => x.SearchAvailableVehiclesAsync(
            request.PickupLocationId,
            request.ReturnLocationId,
            request.PickupDate,
            request.ReturnDate,
            request.Category,
            request.Transmission,
            request.MinPrice,
            request.MaxPrice,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SearchVehiclesAsync_WithExcludeUserId_ShouldFilterOutSupplierVehicles()
    {
        // Arrange
        var supplierId = Guid.NewGuid();
        var request = new VehicleSearchRequest(
            PickupLocationId: Guid.NewGuid(),
            ReturnLocationId: null,
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(3),
            ExcludeUserId: supplierId);

        var supplierVehicle = CreateVehicle(Guid.NewGuid(), "Toyota", "Camry", 100);
        supplierVehicle.UserId = supplierId;
        var customerVehicle = CreateVehicle(Guid.NewGuid(), "Honda", "Civic", 90);
        customerVehicle.UserId = Guid.NewGuid();

        var vehicles = new List<Vehicle> { supplierVehicle, customerVehicle };
        var reviewsQueryable = CreateMockReviewsQueryable();

        _vehicleRepositoryMock.Setup(x => x.SearchAvailableVehiclesAsync(
                request.PickupLocationId,
                request.ReturnLocationId,
                request.PickupDate,
                request.ReturnDate,
                request.Category,
                request.Transmission,
                request.MinPrice,
                request.MaxPrice,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicles);

        _contextMock.Setup(x => x.Reviews)
            .Returns(reviewsQueryable);

        // Act
        var result = await _vehicleService.SearchVehiclesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.Data);
        Assert.Equal("Honda", result.Data[0].Make);
        Assert.Equal("Civic", result.Data[0].Model);
    }

    [Fact]
    public async Task SearchVehiclesAsync_WithCategoryFilter_ShouldReturnOnlyMatchingVehicles()
    {
        // Arrange
        var request = new VehicleSearchRequest(
            PickupLocationId: Guid.NewGuid(),
            ReturnLocationId: null,
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(3),
            Category: "SUV");

        var vehicles = CreateTestVehicles(5);
        var reviewsQueryable = CreateMockReviewsQueryable();

        _vehicleRepositoryMock.Setup(x => x.SearchAvailableVehiclesAsync(
                request.PickupLocationId,
                request.ReturnLocationId,
                request.PickupDate,
                request.ReturnDate,
                "SUV", // Should pass the category filter
                request.Transmission,
                request.MinPrice,
                request.MaxPrice,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicles);

        _contextMock.Setup(x => x.Reviews)
            .Returns(reviewsQueryable);

        // Act
        var result = await _vehicleService.SearchVehiclesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Data.Count);

        _vehicleRepositoryMock.Verify(x => x.SearchAvailableVehiclesAsync(
            request.PickupLocationId,
            request.ReturnLocationId,
            request.PickupDate,
            request.ReturnDate,
            "SUV",
            request.Transmission,
            request.MinPrice,
            request.MaxPrice,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SearchVehiclesAsync_WithTransmissionFilter_ShouldReturnOnlyMatchingVehicles()
    {
        // Arrange
        var request = new VehicleSearchRequest(
            PickupLocationId: Guid.NewGuid(),
            ReturnLocationId: null,
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(3),
            Transmission: "Automatic");

        var vehicles = CreateTestVehicles(3);
        var reviewsQueryable = CreateMockReviewsQueryable();

        _vehicleRepositoryMock.Setup(x => x.SearchAvailableVehiclesAsync(
                request.PickupLocationId,
                request.ReturnLocationId,
                request.PickupDate,
                request.ReturnDate,
                request.Category,
                "Automatic", // Should pass the transmission filter
                request.MinPrice,
                request.MaxPrice,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicles);

        _contextMock.Setup(x => x.Reviews)
            .Returns(reviewsQueryable);

        // Act
        var result = await _vehicleService.SearchVehiclesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Data.Count);

        _vehicleRepositoryMock.Verify(x => x.SearchAvailableVehiclesAsync(
            request.PickupLocationId,
            request.ReturnLocationId,
            request.PickupDate,
            request.ReturnDate,
            request.Category,
            "Automatic",
            request.MinPrice,
            request.MaxPrice,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SearchVehiclesAsync_WithPriceRangeFilter_ShouldReturnOnlyMatchingVehicles()
    {
        // Arrange
        var request = new VehicleSearchRequest(
            PickupLocationId: Guid.NewGuid(),
            ReturnLocationId: null,
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(3),
            MinPrice: 50,
            MaxPrice: 150);

        var vehicles = CreateTestVehicles(4);
        var reviewsQueryable = CreateMockReviewsQueryable();

        _vehicleRepositoryMock.Setup(x => x.SearchAvailableVehiclesAsync(
                request.PickupLocationId,
                request.ReturnLocationId,
                request.PickupDate,
                request.ReturnDate,
                request.Category,
                request.Transmission,
                50m, // Should pass the price filters
                150m,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicles);

        _contextMock.Setup(x => x.Reviews)
            .Returns(reviewsQueryable);

        // Act
        var result = await _vehicleService.SearchVehiclesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(4, result.Data.Count);

        _vehicleRepositoryMock.Verify(x => x.SearchAvailableVehiclesAsync(
            request.PickupLocationId,
            request.ReturnLocationId,
            request.PickupDate,
            request.ReturnDate,
            request.Category,
            request.Transmission,
            50m,
            150m,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SearchVehiclesAsync_WithMultipleFilters_ShouldReturnOnlyMatchingVehicles()
    {
        // Arrange
        var request = new VehicleSearchRequest(
            PickupLocationId: Guid.NewGuid(),
            ReturnLocationId: Guid.NewGuid(),
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(3),
            Category: "Sedan",
            Transmission: "Manual",
            MinPrice: 30,
            MaxPrice: 100);

        var vehicles = CreateTestVehicles(2);
        var reviewsQueryable = CreateMockReviewsQueryable();

        _vehicleRepositoryMock.Setup(x => x.SearchAvailableVehiclesAsync(
                request.PickupLocationId,
                request.ReturnLocationId,
                request.PickupDate,
                request.ReturnDate,
                "Sedan",
                "Manual",
                30m,
                100m,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicles);

        _contextMock.Setup(x => x.Reviews)
            .Returns(reviewsQueryable);

        // Act
        var result = await _vehicleService.SearchVehiclesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Data.Count);

        _vehicleRepositoryMock.Verify(x => x.SearchAvailableVehiclesAsync(
            request.PickupLocationId,
            request.ReturnLocationId,
            request.PickupDate,
            request.ReturnDate,
            "Sedan",
            "Manual",
            30m,
            100m,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SearchVehiclesAsync_WithSortByPrice_ShouldReturnVehiclesSortedByPrice()
    {
        // Arrange
        var request = new VehicleSearchRequest(
            PickupLocationId: Guid.NewGuid(),
            ReturnLocationId: null,
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(3),
            SortBy: "price");

        var vehicles = new List<Vehicle>
        {
            CreateVehicle(Guid.NewGuid(), "Toyota", "Camry", 150),
            CreateVehicle(Guid.NewGuid(), "Honda", "Civic", 80),
            CreateVehicle(Guid.NewGuid(), "BMW", "X5", 200)
        };

        var reviewsQueryable = CreateMockReviewsQueryable();

        _vehicleRepositoryMock.Setup(x => x.SearchAvailableVehiclesAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<decimal?>(),
                It.IsAny<decimal?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicles);

        _contextMock.Setup(x => x.Reviews)
            .Returns(reviewsQueryable);

        // Act
        var result = await _vehicleService.SearchVehiclesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Data.Count);

        // Should be sorted by price ascending
        Assert.Equal(80, result.Data[0].DailyRate);
        Assert.Equal(150, result.Data[1].DailyRate);
        Assert.Equal(200, result.Data[2].DailyRate);
    }

    [Fact]
    public async Task SearchVehiclesAsync_WithSortByRating_ShouldReturnVehiclesSortedByRating()
    {
        // Arrange
        var request = new VehicleSearchRequest(
            PickupLocationId: Guid.NewGuid(),
            ReturnLocationId: null,
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(3),
            SortBy: "rating");

        var vehicle1Id = Guid.NewGuid();
        var vehicle2Id = Guid.NewGuid();
        var vehicle3Id = Guid.NewGuid();

        var vehicles = new List<Vehicle>
        {
            CreateVehicle(vehicle1Id, "Toyota", "Camry", 100),
            CreateVehicle(vehicle2Id, "Honda", "Civic", 100),
            CreateVehicle(vehicle3Id, "BMW", "X5", 100)
        };

        // Create reviews with different ratings
        var reviews = new List<Review>
        {
            new() { VehicleId = vehicle1Id, Rating = 3 },
            new() { VehicleId = vehicle1Id, Rating = 4 },
            new() { VehicleId = vehicle2Id, Rating = 5 },
            new() { VehicleId = vehicle2Id, Rating = 5 },
            new() { VehicleId = vehicle3Id, Rating = 2 },
            new() { VehicleId = vehicle3Id, Rating = 3 }
        };

        var reviewsQueryable = reviews.AsQueryable().BuildMockDbSet();

        _vehicleRepositoryMock.Setup(x => x.SearchAvailableVehiclesAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<decimal?>(),
                It.IsAny<decimal?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicles);

        _contextMock.Setup(x => x.Reviews)
            .Returns(reviewsQueryable.Object);

        // Act
        var result = await _vehicleService.SearchVehiclesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Data.Count);

        // Should be sorted by rating descending (5.0, 3.5, 2.5)
        Assert.True(result.Data[0].Rating >= result.Data[1].Rating);
        Assert.True(result.Data[1].Rating >= result.Data[2].Rating);
    }

    [Fact]
    public async Task SearchVehiclesAsync_WithPagination_ShouldReturnCorrectPage()
    {
        // Arrange
        var request = new VehicleSearchRequest(
            PickupLocationId: Guid.NewGuid(),
            ReturnLocationId: null,
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(3),
            Page: 2,
            Limit: 5);

        var vehicles = CreateTestVehicles(12); // 12 vehicles, page 2 with limit 5 should return 5 vehicles
        var reviewsQueryable = CreateMockReviewsQueryable();

        _vehicleRepositoryMock.Setup(x => x.SearchAvailableVehiclesAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<decimal?>(),
                It.IsAny<decimal?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicles);

        _contextMock.Setup(x => x.Reviews)
            .Returns(reviewsQueryable);

        // Act
        var result = await _vehicleService.SearchVehiclesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Data.Count); // Should return 5 vehicles for page 2
        Assert.Equal(2, result.Page);
        Assert.Equal(5, result.PageSize);
        Assert.Equal(12, result.TotalCount);
        Assert.Equal(3, result.TotalPages); // 12 items / 5 per page = 3 pages (rounded up)
    }

    [Fact]
    public async Task SearchVehiclesAsync_WithLastPage_ShouldReturnRemainingVehicles()
    {
        // Arrange
        var request = new VehicleSearchRequest(
            PickupLocationId: Guid.NewGuid(),
            ReturnLocationId: null,
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(3),
            Page: 3,
            Limit: 5);

        var vehicles = CreateTestVehicles(12); // 12 vehicles, page 3 with limit 5 should return 2 vehicles
        var reviewsQueryable = CreateMockReviewsQueryable();

        _vehicleRepositoryMock.Setup(x => x.SearchAvailableVehiclesAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<decimal?>(),
                It.IsAny<decimal?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicles);

        _contextMock.Setup(x => x.Reviews)
            .Returns(reviewsQueryable);

        // Act
        var result = await _vehicleService.SearchVehiclesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Data.Count); // Should return remaining 2 vehicles
        Assert.Equal(3, result.Page);
        Assert.Equal(5, result.PageSize);
        Assert.Equal(12, result.TotalCount);
        Assert.Equal(3, result.TotalPages);
    }

    [Fact]
    public async Task SearchVehiclesAsync_WithEmptyResults_ShouldReturnEmptyPagedResult()
    {
        // Arrange
        var request = new VehicleSearchRequest(
            PickupLocationId: Guid.NewGuid(),
            ReturnLocationId: null,
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(3));

        var vehicles = new List<Vehicle>(); // Empty list
        var reviewsQueryable = CreateMockReviewsQueryable();

        _vehicleRepositoryMock.Setup(x => x.SearchAvailableVehiclesAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<decimal?>(),
                It.IsAny<decimal?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicles);

        _contextMock.Setup(x => x.Reviews)
            .Returns(reviewsQueryable);

        // Act
        var result = await _vehicleService.SearchVehiclesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.Data);
        Assert.Equal(1, result.Page);
        Assert.Equal(20, result.PageSize);
        Assert.Equal(0, result.TotalCount);
        Assert.Equal(0, result.TotalPages);
    }

    [Fact]
    public async Task SearchVehiclesAsync_ShouldIncludeVehicleRatingAndReviewCount()
    {
        // Arrange
        var request = new VehicleSearchRequest(
            PickupLocationId: Guid.NewGuid(),
            ReturnLocationId: null,
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(3));

        var vehicleId = Guid.NewGuid();
        var vehicles = new List<Vehicle> { CreateVehicle(vehicleId, "Toyota", "Camry", 100) };

        var reviews = new List<Review>
        {
            new() { VehicleId = vehicleId, Rating = 4 },
            new() { VehicleId = vehicleId, Rating = 5 },
            new() { VehicleId = vehicleId, Rating = 3 }
        };

        var reviewsQueryable = reviews.AsQueryable().BuildMockDbSet();

        _vehicleRepositoryMock.Setup(x => x.SearchAvailableVehiclesAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<decimal?>(),
                It.IsAny<decimal?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicles);

        _contextMock.Setup(x => x.Reviews)
            .Returns(reviewsQueryable.Object);

        // Act
        var result = await _vehicleService.SearchVehiclesAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.Data);

        var vehicleDto = result.Data.First();
        Assert.Equal(4.0, vehicleDto.Rating); // Average of 4, 5, 3
        Assert.Equal(3, vehicleDto.ReviewCount);
    }

    #endregion

    #region GetVehicleDetailsAsync Tests

    [Fact]
    public async Task GetVehicleDetailsAsync_WithExistingVehicle_ShouldReturnCompleteDetails()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var vehicle = CreateVehicleWithDetails(vehicleId, userId);

        var features = new List<VehicleFeature>
        {
            new() { Id = Guid.NewGuid(), VehicleId = vehicleId, FeatureName = "GPS", FeatureDescription = "Navigation system" },
            new() { Id = Guid.NewGuid(), VehicleId = vehicleId, FeatureName = "Bluetooth", FeatureDescription = "Wireless connectivity" }
        };

        var reviews = new List<Review>
        {
            new() { VehicleId = vehicleId, Rating = 4 },
            new() { VehicleId = vehicleId, Rating = 5 }
        };

        var vehiclesQueryable = new List<Vehicle> { vehicle }.AsQueryable().BuildMockDbSet();
        var featuresQueryable = features.AsQueryable().BuildMockDbSet();
        var reviewsQueryable = reviews.AsQueryable().BuildMockDbSet();

        _contextMock.Setup(x => x.Vehicles).Returns(vehiclesQueryable.Object);
        _contextMock.Setup(x => x.VehicleFeatures).Returns(featuresQueryable.Object);
        _contextMock.Setup(x => x.Reviews).Returns(reviewsQueryable.Object);

        // Act
        var result = await _vehicleService.GetVehicleDetailsAsync(vehicleId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(vehicleId, result.VehicleId);
        Assert.Equal("Toyota", result.Make);
        Assert.Equal("Camry", result.Model);
        Assert.Equal(2023, result.Year);
        Assert.Equal("Black", result.Color);
        Assert.Equal("Automatic", result.Transmission);
        Assert.Equal("Gasoline", result.FuelType);
        Assert.Equal(5, result.Seats);
        Assert.Equal(100, result.PricePerDay);
        Assert.Equal("Test City", result.LocationCity);
        Assert.Equal("Test vehicle description", result.Description);
        Assert.Equal("Active", result.Status);
        Assert.Equal("Available", result.AvailabilityStatus);
        Assert.Equal(2, result.Images.Count);
        Assert.Equal(2, result.Features.Count);
        Assert.Equal(4.5, result.AverageRating); // Average of 4 and 5
        Assert.Equal(2, result.ReviewCount);
        Assert.NotNull(result.Supplier);
        Assert.Equal(userId, result.Supplier.Id);
    }

    [Fact]
    public async Task GetVehicleDetailsAsync_WithNonExistentVehicle_ShouldThrowNotFoundException()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var emptyVehiclesQueryable = new List<Vehicle>().AsQueryable().BuildMockDbSet();

        _contextMock.Setup(x => x.Vehicles).Returns(emptyVehiclesQueryable.Object);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _vehicleService.GetVehicleDetailsAsync(vehicleId));

        Assert.Equal($"Vehicle with ID {vehicleId} not found", exception.Message);
    }

    [Fact]
    public async Task GetVehicleDetailsAsync_WithVehicleWithoutReviews_ShouldReturnZeroRating()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var vehicle = CreateVehicleWithDetails(vehicleId, userId);

        var vehiclesQueryable = new List<Vehicle> { vehicle }.AsQueryable().BuildMockDbSet();
        var featuresQueryable = new List<VehicleFeature>().AsQueryable().BuildMockDbSet();
        var reviewsQueryable = new List<Review>().AsQueryable().BuildMockDbSet();

        _contextMock.Setup(x => x.Vehicles).Returns(vehiclesQueryable.Object);
        _contextMock.Setup(x => x.VehicleFeatures).Returns(featuresQueryable.Object);
        _contextMock.Setup(x => x.Reviews).Returns(reviewsQueryable.Object);

        // Act
        var result = await _vehicleService.GetVehicleDetailsAsync(vehicleId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.AverageRating);
        Assert.Equal(0, result.ReviewCount);
    }

    #endregion

    #region GetAvailabilityAsync Tests

    [Fact]
    public async Task GetAvailabilityAsync_WithExistingVehicle_ShouldReturnAvailabilityInfo()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var startDate = DateTime.Today;
        var endDate = DateTime.Today.AddDays(30);
        var vehicle = CreateVehicle(vehicleId, "Toyota", "Camry", 100);

        var bookings = new List<Booking>
        {
            new()
            {
                VehicleId = vehicleId,
                PickupDate = DateTime.Today.AddDays(5),
                ReturnDate = DateTime.Today.AddDays(7),
                Status = BookingStatus.Confirmed
            },
            new()
            {
                VehicleId = vehicleId,
                PickupDate = DateTime.Today.AddDays(15),
                ReturnDate = DateTime.Today.AddDays(18),
                Status = BookingStatus.Confirmed
            }
        };

        var bookingsQueryable = bookings.AsQueryable().BuildMockDbSet();

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _contextMock.Setup(x => x.Bookings).Returns(bookingsQueryable.Object);

        // Act
        var result = await _vehicleService.GetAvailabilityAsync(vehicleId, startDate, endDate);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(vehicleId, result.VehicleId);
        Assert.Equal(2, result.BookedDates.Count);
        Assert.Empty(result.BlockedDates);

        var firstBooking = result.BookedDates.First();
        Assert.Equal(DateTime.Today.AddDays(5), firstBooking.StartDate);
        Assert.Equal(DateTime.Today.AddDays(7), firstBooking.EndDate);
    }

    [Fact]
    public async Task GetAvailabilityAsync_WithNonExistentVehicle_ShouldThrowNotFoundException()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var startDate = DateTime.Today;
        var endDate = DateTime.Today.AddDays(30);

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Vehicle?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _vehicleService.GetAvailabilityAsync(vehicleId, startDate, endDate));

        Assert.Equal($"Vehicle with ID {vehicleId} not found", exception.Message);
    }

    [Fact]
    public async Task GetAvailabilityAsync_ShouldExcludeCancelledBookings()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var startDate = DateTime.Today;
        var endDate = DateTime.Today.AddDays(30);
        var vehicle = CreateVehicle(vehicleId, "Toyota", "Camry", 100);

        var bookings = new List<Booking>
        {
            new()
            {
                VehicleId = vehicleId,
                PickupDate = DateTime.Today.AddDays(5),
                ReturnDate = DateTime.Today.AddDays(7),
                Status = BookingStatus.Confirmed
            },
            new()
            {
                VehicleId = vehicleId,
                PickupDate = DateTime.Today.AddDays(10),
                ReturnDate = DateTime.Today.AddDays(12),
                Status = BookingStatus.Cancelled // This should be excluded
            }
        };

        var bookingsQueryable = bookings.AsQueryable().BuildMockDbSet();

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _contextMock.Setup(x => x.Bookings).Returns(bookingsQueryable.Object);

        // Act
        var result = await _vehicleService.GetAvailabilityAsync(vehicleId, startDate, endDate);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.BookedDates); // Only the confirmed booking should be included
        Assert.Equal(DateTime.Today.AddDays(5), result.BookedDates.First().StartDate);
    }

    [Fact]
    public async Task GetAvailabilityAsync_WithOverlappingDateRange_ShouldReturnOnlyOverlappingBookings()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var startDate = DateTime.Today.AddDays(10);
        var endDate = DateTime.Today.AddDays(20);
        var vehicle = CreateVehicle(vehicleId, "Toyota", "Camry", 100);

        var bookings = new List<Booking>
        {
            new()
            {
                VehicleId = vehicleId,
                PickupDate = DateTime.Today.AddDays(5),
                ReturnDate = DateTime.Today.AddDays(8), // Before range
                Status = BookingStatus.Confirmed
            },
            new()
            {
                VehicleId = vehicleId,
                PickupDate = DateTime.Today.AddDays(15),
                ReturnDate = DateTime.Today.AddDays(17), // Within range
                Status = BookingStatus.Confirmed
            },
            new()
            {
                VehicleId = vehicleId,
                PickupDate = DateTime.Today.AddDays(25),
                ReturnDate = DateTime.Today.AddDays(27), // After range
                Status = BookingStatus.Confirmed
            }
        };

        var bookingsQueryable = bookings.AsQueryable().BuildMockDbSet();

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _contextMock.Setup(x => x.Bookings).Returns(bookingsQueryable.Object);

        // Act
        var result = await _vehicleService.GetAvailabilityAsync(vehicleId, startDate, endDate);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.BookedDates); // Only the booking within the range
        Assert.Equal(DateTime.Today.AddDays(15), result.BookedDates.First().StartDate);
    }

    #endregion

    #region CalculatePricingAsync Tests

    [Fact]
    public async Task CalculatePricingAsync_WithValidRequest_ShouldCalculateCorrectPricing()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var vehicle = CreateVehicle(vehicleId, "Toyota", "Camry", 100);
        var request = new PricingRequest(
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(4), // 3 days
            InsuranceOptions: "basic",
            AdditionalServices: "gps,childseat",
            Currency: "USD"
        );

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        // Act
        var result = await _vehicleService.CalculatePricingAsync(vehicleId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(300, result.BasePrice); // 100 * 3 days
        Assert.Equal(30, result.InsuranceCost); // 10 * 3 days for basic insurance
        Assert.Equal(39, result.AdditionalServicesCost); // (5 + 8) * 3 days for GPS + child seat
        Assert.Equal(369, result.TotalPrice); // 300 + 30 + 39
        Assert.Equal("USD", result.Currency);
        Assert.Equal(3, result.TotalDays);
    }

    [Fact]
    public async Task CalculatePricingAsync_WithInvalidDateRange_ShouldThrowValidationException()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var request = new PricingRequest(
            PickupDate: DateTime.Today.AddDays(5),
            ReturnDate: DateTime.Today.AddDays(3), // Return date before pickup date
            InsuranceOptions: null,
            AdditionalServices: null,
            Currency: "USD"
        );

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _vehicleService.CalculatePricingAsync(vehicleId, request));

        Assert.Equal("One or more validation failures have occurred.", exception.Message);
        Assert.True(exception.Errors.ContainsKey("DateRange"));
        Assert.Equal("Return date must be after pickup date", exception.Errors["DateRange"][0]);
    }

    [Fact]
    public async Task CalculatePricingAsync_WithNonExistentVehicle_ShouldThrowNotFoundException()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var request = new PricingRequest(
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(4),
            InsuranceOptions: null,
            AdditionalServices: null,
            Currency: "USD"
        );

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Vehicle?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _vehicleService.CalculatePricingAsync(vehicleId, request));

        Assert.Equal($"Vehicle with ID {vehicleId} not found", exception.Message);
    }

    [Fact]
    public async Task CalculatePricingAsync_WithNoInsuranceOrServices_ShouldCalculateBasePrice()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var vehicle = CreateVehicle(vehicleId, "Toyota", "Camry", 75);
        var request = new PricingRequest(
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(6), // 5 days
            InsuranceOptions: null,
            AdditionalServices: null,
            Currency: "EUR"
        );

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        // Act
        var result = await _vehicleService.CalculatePricingAsync(vehicleId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(375, result.BasePrice); // 75 * 5 days
        Assert.Equal(0, result.InsuranceCost);
        Assert.Equal(0, result.AdditionalServicesCost);
        Assert.Equal(375, result.TotalPrice);
        Assert.Equal("EUR", result.Currency);
        Assert.Equal(5, result.TotalDays);
    }

    [Fact]
    public async Task CalculatePricingAsync_WithDifferentInsuranceOptions_ShouldCalculateCorrectCosts()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var vehicle = CreateVehicle(vehicleId, "Toyota", "Camry", 100);

        var testCases = new[]
        {
            new { Insurance = "basic", ExpectedCost = 20m }, // 10 * 2 days
            new { Insurance = "standard", ExpectedCost = 40m }, // 20 * 2 days
            new { Insurance = "premium", ExpectedCost = 70m }, // 35 * 2 days
            new { Insurance = "unknown", ExpectedCost = 0m } // Unknown insurance type
        };

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        foreach (var testCase in testCases)
        {
            var request = new PricingRequest(
                PickupDate: DateTime.Today.AddDays(1),
                ReturnDate: DateTime.Today.AddDays(3), // 2 days
                InsuranceOptions: testCase.Insurance,
                AdditionalServices: null,
                Currency: "USD"
            );

            // Act
            var result = await _vehicleService.CalculatePricingAsync(vehicleId, request);

            // Assert
            Assert.Equal(testCase.ExpectedCost, result.InsuranceCost);
        }
    }

    [Fact]
    public async Task CalculatePricingAsync_WithMultipleAdditionalServices_ShouldCalculateCorrectCosts()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var vehicle = CreateVehicle(vehicleId, "Toyota", "Camry", 100);
        var request = new PricingRequest(
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(4), // 3 days
            InsuranceOptions: null,
            AdditionalServices: "gps,childseat,additionaldriver", // 5 + 8 + 15 = 28 per day
            Currency: "USD"
        );

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        // Act
        var result = await _vehicleService.CalculatePricingAsync(vehicleId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(84, result.AdditionalServicesCost); // 28 * 3 days
    }

    [Fact]
    public async Task CalculatePricingAsync_WithUnknownAdditionalServices_ShouldIgnoreUnknownServices()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var vehicle = CreateVehicle(vehicleId, "Toyota", "Camry", 100);
        var request = new PricingRequest(
            PickupDate: DateTime.Today.AddDays(1),
            ReturnDate: DateTime.Today.AddDays(3), // 2 days
            InsuranceOptions: null,
            AdditionalServices: "gps,unknown,childseat", // Only GPS (5) and child seat (8) should be counted
            Currency: "USD"
        );

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        // Act
        var result = await _vehicleService.CalculatePricingAsync(vehicleId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(26, result.AdditionalServicesCost); // (5 + 8) * 2 days
    }

    [Fact]
    public async Task CalculatePricingAsync_WithSameDayRental_ShouldCalculateOneDayPrice()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var vehicle = CreateVehicle(vehicleId, "Toyota", "Camry", 150);
        var pickupDate = DateTime.Today.AddDays(1);
        var request = new PricingRequest(
            PickupDate: pickupDate,
            ReturnDate: pickupDate.AddDays(1), // Same day return (1 day)
            InsuranceOptions: "standard",
            AdditionalServices: "gps",
            Currency: "USD"
        );

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        // Act
        var result = await _vehicleService.CalculatePricingAsync(vehicleId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalDays);
        Assert.Equal(150, result.BasePrice); // 150 * 1 day
        Assert.Equal(20, result.InsuranceCost); // 20 * 1 day
        Assert.Equal(5, result.AdditionalServicesCost); // 5 * 1 day
        Assert.Equal(175, result.TotalPrice);
    }

    #endregion

    #region Admin Vehicle Management Tests

    [Fact]
    public async Task CreateVehicleAsync_WithValidRequest_ShouldCreateVehicleSuccessfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new CreateVehicleRequest(
            UserId: userId,
            Make: "Toyota",
            Model: "Camry",
            Year: 2023,
            Color: "Black",
            LicensePlate: "ABC123",
            Transmission: "Automatic",
            FuelType: "Gasoline",
            Seats: 5,
            PricePerDay: 100.00m,
            LocationCity: "Test City",
            CategoryId: Guid.NewGuid(),
            Description: "Test vehicle description",
            Status: "Active",
            AvailabilityStatus: "Available"
        );

        var user = new ApplicationUser
        {
            Id = userId,
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com"
        };

        var createdVehicle = new Vehicle
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Make = request.Make,
            Model = request.Model,
            Year = request.Year,
            Color = request.Color,
            LicensePlate = request.LicensePlate,
            Transmission = request.Transmission,
            FuelType = request.FuelType,
            Seats = request.Seats,
            PricePerDay = request.PricePerDay,
            LocationCity = request.LocationCity,
            Description = request.Description,
            Status = request.Status,
            AvailabilityStatus = request.AvailabilityStatus,
            IsActive = true,
            ApprovedAt = DateTime.UtcNow
        };

        var usersQueryable = new List<ApplicationUser> { user }.AsQueryable().BuildMockDbSet();
        var vehiclesQueryable = new List<Vehicle>().AsQueryable().BuildMockDbSet();

        _contextMock.Setup(x => x.Users).Returns(usersQueryable.Object);
        _contextMock.Setup(x => x.Vehicles).Returns(vehiclesQueryable.Object);

        _vehicleRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Vehicle>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdVehicle);

        _vehicleRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _vehicleService.CreateVehicleAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(createdVehicle.Id, result.VehicleId);
        Assert.Equal("Vehicle created successfully", result.Message);
        Assert.True(result.Success);

        _vehicleRepositoryMock.Verify(x => x.AddAsync(It.Is<Vehicle>(v =>
            v.UserId == userId &&
            v.Make == request.Make &&
            v.Model == request.Model &&
            v.Year == request.Year &&
            v.Color == request.Color &&
            v.LicensePlate == request.LicensePlate &&
            v.Transmission == request.Transmission &&
            v.FuelType == request.FuelType &&
            v.Seats == request.Seats &&
            v.PricePerDay == request.PricePerDay &&
            v.LocationCity == request.LocationCity &&
            v.Description == request.Description &&
            v.Status == "Pending" &&
            v.AvailabilityStatus == "Unavailable" &&
            v.IsActive == true), It.IsAny<CancellationToken>()), Times.Once);

        _vehicleRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateVehicleAsync_WithNonExistentUser_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new CreateVehicleRequest(
            UserId: userId,
            Make: "Toyota",
            Model: "Camry",
            Year: 2023,
            Color: "Black",
            LicensePlate: "ABC123",
            Transmission: "Automatic",
            FuelType: "Gasoline",
            Seats: 5,
            PricePerDay: 100.00m,
            LocationCity: "Test City",
            CategoryId: Guid.NewGuid(),
            Description: "Test vehicle description"
        );

        var emptyUsersQueryable = new List<ApplicationUser>().AsQueryable().BuildMockDbSet();
        _contextMock.Setup(x => x.Users).Returns(emptyUsersQueryable.Object);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _vehicleService.CreateVehicleAsync(request));

        Assert.Equal($"User with ID {userId} not found", exception.Message);
        _vehicleRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Vehicle>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateVehicleAsync_WithDuplicateLicensePlate_ShouldThrowConflictException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var licensePlate = "ABC123";
        var request = new CreateVehicleRequest(
            UserId: userId,
            Make: "Toyota",
            Model: "Camry",
            Year: 2023,
            Color: "Black",
            LicensePlate: licensePlate,
            Transmission: "Automatic",
            FuelType: "Gasoline",
            Seats: 5,
            PricePerDay: 100.00m,
            LocationCity: "Test City",
            CategoryId: Guid.NewGuid(),
            Description: "Test vehicle description"
        );

        var user = new ApplicationUser { Id = userId, FirstName = "John", LastName = "Doe" };
        var existingVehicle = new Vehicle { Id = Guid.NewGuid(), LicensePlate = licensePlate };

        var usersQueryable = new List<ApplicationUser> { user }.AsQueryable().BuildMockDbSet();
        var vehiclesQueryable = new List<Vehicle> { existingVehicle }.AsQueryable().BuildMockDbSet();

        _contextMock.Setup(x => x.Users).Returns(usersQueryable.Object);
        _contextMock.Setup(x => x.Vehicles).Returns(vehiclesQueryable.Object);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ConflictException>(
            () => _vehicleService.CreateVehicleAsync(request));

        Assert.Equal($"Vehicle with license plate {licensePlate} already exists", exception.Message);
        _vehicleRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Vehicle>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateVehicleAsync_WithValidRequest_ShouldUpdateVehicleSuccessfully()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var existingVehicle = new Vehicle
        {
            Id = vehicleId,
            Make = "Toyota",
            Model = "Camry",
            Year = 2020,
            Color = "White",
            LicensePlate = "OLD123",
            Transmission = "Manual",
            FuelType = "Gasoline",
            Seats = 5,
            PricePerDay = 80.00m,
            LocationCity = "Old City",
            Description = "Old description",
            Status = "Active",
            AvailabilityStatus = "Available"
        };

        var request = new UpdateVehicleRequest(
            Make: "Honda",
            Model: "Accord",
            Year: 2023,
            Color: "Black",
            LicensePlate: "NEW123",
            Transmission: "Automatic",
            FuelType: "Hybrid",
            Seats: 5,
            PricePerDay: 120.00m,
            LocationCity: "New City",
            CategoryId: null,
            Description: "Updated description",
            Status: "Active",
            AvailabilityStatus: "Available"
        );

        var vehiclesQueryable = new List<Vehicle> { existingVehicle }.AsQueryable().BuildMockDbSet();

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingVehicle);

        _contextMock.Setup(x => x.Vehicles).Returns(vehiclesQueryable.Object);

        _vehicleRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Vehicle>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _vehicleRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _vehicleService.UpdateVehicleAsync(vehicleId, request, Guid.Empty, true);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(vehicleId, result.VehicleId);
        Assert.Equal("Vehicle updated successfully", result.Message);
        Assert.True(result.Success);

        // Verify that the vehicle properties were updated
        Assert.Equal("Honda", existingVehicle.Make);
        Assert.Equal("Accord", existingVehicle.Model);
        Assert.Equal(2023, existingVehicle.Year);
        Assert.Equal("Black", existingVehicle.Color);
        Assert.Equal("NEW123", existingVehicle.LicensePlate);
        Assert.Equal("Automatic", existingVehicle.Transmission);
        Assert.Equal("Hybrid", existingVehicle.FuelType);
        Assert.Equal(120.00m, existingVehicle.PricePerDay);
        Assert.Equal("New City", existingVehicle.LocationCity);
        Assert.Equal("Updated description", existingVehicle.Description);

        _vehicleRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateVehicleAsync_WithPartialRequest_ShouldUpdateOnlyProvidedFields()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var existingVehicle = new Vehicle
        {
            Id = vehicleId,
            Make = "Toyota",
            Model = "Camry",
            Year = 2020,
            Color = "White",
            LicensePlate = "OLD123",
            Transmission = "Manual",
            FuelType = "Gasoline",
            Seats = 5,
            PricePerDay = 80.00m,
            LocationCity = "Old City",
            Description = "Old description",
            Status = "Active",
            AvailabilityStatus = "Available"
        };

        var request = new UpdateVehicleRequest(
            Make: "Honda", // Only updating make and price
            Model: null,
            Year: null,
            Color: null,
            LicensePlate: null,
            Transmission: null,
            FuelType: null,
            Seats: null,
            PricePerDay: 120.00m,
            LocationCity: null,
            CategoryId: null,
            Description: null,
            Status: null,
            AvailabilityStatus: null
        );

        var vehiclesQueryable = new List<Vehicle> { existingVehicle }.AsQueryable().BuildMockDbSet();

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingVehicle);

        _contextMock.Setup(x => x.Vehicles).Returns(vehiclesQueryable.Object);

        _vehicleRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Vehicle>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _vehicleRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _vehicleService.UpdateVehicleAsync(vehicleId, request, Guid.Empty, true);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(vehicleId, result.VehicleId);
        Assert.Equal("Vehicle updated successfully", result.Message);

        // Verify only specified fields were updated
        Assert.Equal("Honda", existingVehicle.Make); // Updated
        Assert.Equal(120.00m, existingVehicle.PricePerDay); // Updated

        // Verify other fields remained unchanged
        Assert.Equal("Camry", existingVehicle.Model);
        Assert.Equal(2020, existingVehicle.Year);
        Assert.Equal("White", existingVehicle.Color);
        Assert.Equal("OLD123", existingVehicle.LicensePlate);
        Assert.Equal("Manual", existingVehicle.Transmission);
        Assert.Equal("Gasoline", existingVehicle.FuelType);
        Assert.Equal(5, existingVehicle.Seats);
        Assert.Equal("Old City", existingVehicle.LocationCity);
        Assert.Equal("Old description", existingVehicle.Description);
    }

    [Fact]
    public async Task UpdateVehicleAsync_WithNonExistentVehicle_ShouldThrowNotFoundException()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var request = new UpdateVehicleRequest(
            Make: "Honda",
            Model: null,
            Year: null,
            Color: null,
            LicensePlate: null,
            Transmission: null,
            FuelType: null,
            Seats: null,
            PricePerDay: null,
            LocationCity: null,
            CategoryId: null,
            Description: null,
            Status: null,
            AvailabilityStatus: null
        );

        var vehiclesQueryable = new List<Vehicle>().AsQueryable().BuildMockDbSet();
        _contextMock.Setup(x => x.Vehicles).Returns(vehiclesQueryable.Object);

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Vehicle?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _vehicleService.UpdateVehicleAsync(vehicleId, request, Guid.Empty, true));

        Assert.Equal($"Vehicle with ID {vehicleId} not found", exception.Message);
        _vehicleRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<Vehicle>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateVehicleAsync_WithDuplicateLicensePlate_ShouldThrowConflictException()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var existingVehicle = new Vehicle
        {
            Id = vehicleId,
            LicensePlate = "OLD123"
        };

        var anotherVehicle = new Vehicle
        {
            Id = Guid.NewGuid(),
            LicensePlate = "NEW123"
        };

        var request = new UpdateVehicleRequest(
            Make: null,
            Model: null,
            Year: null,
            Color: null,
            LicensePlate: "NEW123", // Trying to use existing license plate
            Transmission: null,
            FuelType: null,
            Seats: null,
            PricePerDay: null,
            LocationCity: null,
            CategoryId: null,
            Description: null,
            Status: null,
            AvailabilityStatus: null
        );

        var vehiclesQueryable = new List<Vehicle> { existingVehicle, anotherVehicle }.AsQueryable().BuildMockDbSet();

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingVehicle);

        _contextMock.Setup(x => x.Vehicles).Returns(vehiclesQueryable.Object);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ConflictException>(
            () => _vehicleService.UpdateVehicleAsync(vehicleId, request, Guid.Empty, true));

        Assert.Equal("Vehicle with license plate NEW123 already exists", exception.Message);
        _vehicleRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<Vehicle>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteVehicleAsync_WithValidVehicleAndNoActiveBookings_ShouldSoftDeleteVehicle()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var vehicle = new Vehicle
        {
            Id = vehicleId,
            Make = "Toyota",
            Model = "Camry",
            IsActive = true,
            Status = "Active",
            AvailabilityStatus = "Available"
        };

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _bookingRepositoryMock.Setup(x => x.HasActiveBookingsAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _vehicleRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Vehicle>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _vehicleRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _vehicleService.DeleteVehicleAsync(vehicleId, Guid.Empty, true);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(vehicleId, result.VehicleId);
        Assert.Equal("Vehicle deleted successfully", result.Message);
        Assert.True(result.Success);

        // Verify soft delete properties were set
        Assert.False(vehicle.IsActive);
        Assert.Equal("Deleted", vehicle.Status);
        Assert.Equal("Unavailable", vehicle.AvailabilityStatus);

        _vehicleRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _bookingRepositoryMock.Verify(x => x.HasActiveBookingsAsync(vehicleId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteVehicleAsync_WithActiveBookings_ShouldThrowConflictException()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var vehicle = new Vehicle
        {
            Id = vehicleId,
            Make = "Toyota",
            Model = "Camry",
            IsActive = true,
            Status = "Active",
            AvailabilityStatus = "Available"
        };

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _bookingRepositoryMock.Setup(x => x.HasActiveBookingsAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true); // Vehicle has active bookings

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ConflictException>(
            () => _vehicleService.DeleteVehicleAsync(vehicleId, Guid.Empty, true));

        Assert.Equal("Cannot delete vehicle with active bookings", exception.Message);
        _vehicleRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<Vehicle>(), It.IsAny<CancellationToken>()), Times.Never);
        _vehicleRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteVehicleAsync_WithNonExistentVehicle_ShouldThrowNotFoundException()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Vehicle?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _vehicleService.DeleteVehicleAsync(vehicleId, Guid.Empty, true));

        Assert.Equal($"Vehicle with ID {vehicleId} not found", exception.Message);
        _bookingRepositoryMock.Verify(x => x.HasActiveBookingsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        _vehicleRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<Vehicle>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CheckActiveBookingsAsync_WithExistingVehicle_ShouldReturnBookingStatus()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var vehicle = new Vehicle { Id = vehicleId };

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _bookingRepositoryMock.Setup(x => x.HasActiveBookingsAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _vehicleService.CheckActiveBookingsAsync(vehicleId);

        // Assert
        Assert.True(result);
        _vehicleRepositoryMock.Verify(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()), Times.Once);
        _bookingRepositoryMock.Verify(x => x.HasActiveBookingsAsync(vehicleId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CheckActiveBookingsAsync_WithNoActiveBookings_ShouldReturnFalse()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var vehicle = new Vehicle { Id = vehicleId };

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _bookingRepositoryMock.Setup(x => x.HasActiveBookingsAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _vehicleService.CheckActiveBookingsAsync(vehicleId);

        // Assert
        Assert.False(result);
        _vehicleRepositoryMock.Verify(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()), Times.Once);
        _bookingRepositoryMock.Verify(x => x.HasActiveBookingsAsync(vehicleId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CheckActiveBookingsAsync_WithNonExistentVehicle_ShouldThrowNotFoundException()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Vehicle?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _vehicleService.CheckActiveBookingsAsync(vehicleId));

        Assert.Equal($"Vehicle with ID {vehicleId} not found", exception.Message);
        _bookingRepositoryMock.Verify(x => x.HasActiveBookingsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("Admin")]
    [InlineData("Supplier")]
    public async Task CreateVehicleAsync_WithAuthorizedRoles_ShouldAllowCreation(string role)
    {
        // This test verifies that the service method works correctly for different user roles
        // Authorization is tested at the controller level, but we test the service logic here
        // Arrange
        var userId = Guid.NewGuid();
        var request = new CreateVehicleRequest(
            UserId: userId,
            Make: "Toyota",
            Model: "Camry",
            Year: 2023,
            Color: "Black",
            LicensePlate: "TEST123",
            Transmission: "Automatic",
            FuelType: "Gasoline",
            Seats: 5,
            PricePerDay: 100.00m,
            LocationCity: "Test City",
            CategoryId: Guid.NewGuid(),
            Description: "Test vehicle"
        );

        var user = new ApplicationUser { Id = userId, FirstName = "Test", LastName = $"{role}User" };
        var createdVehicle = new Vehicle { Id = Guid.NewGuid() };

        var usersQueryable = new List<ApplicationUser> { user }.AsQueryable().BuildMockDbSet();
        var vehiclesQueryable = new List<Vehicle>().AsQueryable().BuildMockDbSet();

        _contextMock.Setup(x => x.Users).Returns(usersQueryable.Object);
        _contextMock.Setup(x => x.Vehicles).Returns(vehiclesQueryable.Object);
        _vehicleRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Vehicle>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdVehicle);
        _vehicleRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _vehicleService.CreateVehicleAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        _vehicleRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Vehicle>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateVehicleAsync_WithEmptyStringFields_ShouldNotUpdateThoseFields()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var existingVehicle = new Vehicle
        {
            Id = vehicleId,
            Make = "Toyota",
            Model = "Camry",
            Color = "White",
            LicensePlate = "OLD123",
            Description = "Original description"
        };

        var request = new UpdateVehicleRequest(
            Make: "", // Empty string should not update
            Model: "Accord", // Valid update
            Year: null,
            Color: "   ", // Whitespace should not update
            LicensePlate: null,
            Transmission: null,
            FuelType: null,
            Seats: null,
            PricePerDay: null,
            LocationCity: null,
            CategoryId: null,
            Description: "New description", // Valid update
            Status: null,
            AvailabilityStatus: null
        );

        var vehiclesQueryable = new List<Vehicle> { existingVehicle }.AsQueryable().BuildMockDbSet();

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingVehicle);
        _contextMock.Setup(x => x.Vehicles).Returns(vehiclesQueryable.Object);
        _vehicleRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Vehicle>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _vehicleRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _vehicleService.UpdateVehicleAsync(vehicleId, request, Guid.Empty, true);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);

        // Fields with empty/whitespace strings should not be updated
        Assert.Equal("Toyota", existingVehicle.Make); // Should remain unchanged
        Assert.Equal("White", existingVehicle.Color); // Should remain unchanged
        Assert.Equal("OLD123", existingVehicle.LicensePlate); // Should remain unchanged

        // Valid fields should be updated
        Assert.Equal("Accord", existingVehicle.Model);
        Assert.Equal("New description", existingVehicle.Description);
    }

    #endregion

    #region Helper Methods

    private List<Vehicle> CreateTestVehicles(int count)
    {
        var vehicles = new List<Vehicle>();
        var makes = new[] { "Toyota", "Honda", "BMW", "Mercedes", "Audi" };
        var models = new[] { "Camry", "Civic", "X5", "C-Class", "A4" };

        for (int i = 0; i < count; i++)
        {
            vehicles.Add(CreateVehicle(
                Guid.NewGuid(),
                makes[i % makes.Length],
                models[i % models.Length],
                50 + (i * 10) // Varying prices
            ));
        }

        return vehicles;
    }

    private Vehicle CreateVehicle(Guid id, string make, string model, decimal pricePerDay)
    {
        return new Vehicle
        {
            Id = id,
            Make = make,
            Model = model,
            Year = 2023,
            Color = "Black",
            LicensePlate = $"TEST{id.ToString()[..3]}",
            Transmission = "Automatic",
            FuelType = "Gasoline",
            Seats = 5,
            PricePerDay = pricePerDay,
            LocationCity = "Test City",
            Description = "Test vehicle",
            Status = "Active",
            AvailabilityStatus = "Available",
            IsActive = true,
            Images = new List<VehicleImage>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    VehicleId = id,
                    ImageUrl = "https://example.com/image.jpg",
                    ThumbnailUrl = "https://example.com/thumb.jpg",
                    IsPrimary = true
                }
            }
        };
    }

    private Vehicle CreateVehicleWithDetails(Guid vehicleId, Guid userId)
    {
        return new Vehicle
        {
            Id = vehicleId,
            UserId = userId,
            Make = "Toyota",
            Model = "Camry",
            Year = 2023,
            Color = "Black",
            LicensePlate = $"TEST{vehicleId.ToString()[..3]}",
            Transmission = "Automatic",
            FuelType = "Gasoline",
            Seats = 5,
            PricePerDay = 100,
            LocationCity = "Test City",
            Description = "Test vehicle description",
            Status = "Active",
            AvailabilityStatus = "Available",
            IsActive = true,
            User = new ApplicationUser
            {
                Id = userId,
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@example.com"
            },
            Images = new List<VehicleImage>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    VehicleId = vehicleId,
                    ImageUrl = "https://example.com/image1.jpg",
                    ThumbnailUrl = "https://example.com/thumb1.jpg",
                    IsPrimary = true
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    VehicleId = vehicleId,
                    ImageUrl = "https://example.com/image2.jpg",
                    ThumbnailUrl = "https://example.com/thumb2.jpg",
                    IsPrimary = false
                }
            }
        };
    }

    private DbSet<Review> CreateMockReviewsQueryable()
    {
        var reviews = new List<Review>();
        return reviews.AsQueryable().BuildMockDbSet().Object;
    }

    #endregion
}
