using Backend.Application.DTOs.Review;
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

public class ReviewServiceTests
{
    private readonly Mock<IReviewRepository> _reviewRepositoryMock;
    private readonly Mock<IBookingRepository> _bookingRepositoryMock;
    private readonly Mock<IVehicleRepository> _vehicleRepositoryMock;
    private readonly Mock<IApplicationDbContext> _contextMock;
    private readonly ReviewService _reviewService;

    public ReviewServiceTests()
    {
        _reviewRepositoryMock = new Mock<IReviewRepository>();
        _bookingRepositoryMock = new Mock<IBookingRepository>();
        _vehicleRepositoryMock = new Mock<IVehicleRepository>();
        _contextMock = new Mock<IApplicationDbContext>();

        _reviewService = new ReviewService(
            _reviewRepositoryMock.Object,
            _bookingRepositoryMock.Object,
            _vehicleRepositoryMock.Object,
            _contextMock.Object);

        var emptyReviews = new List<Review>().AsQueryable();
        var mockReviewsDbSet = emptyReviews.BuildMockDbSet();
        _contextMock.Setup(x => x.Reviews).Returns(mockReviewsDbSet.Object);
    }

    #region GetVehicleReviewsAsync Tests

    [Fact]
    public async Task GetVehicleReviewsAsync_WithValidVehicleId_ShouldReturnPagedReviews()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var page = 1;
        var pageSize = 10;
        var sortBy = "date";
        var vehicle = CreateTestVehicle(vehicleId);
        var reviews = CreateTestReviews(vehicleId, 3);
        var totalCount = 3;

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _reviewRepositoryMock.Setup(x => x.GetVehicleReviewsAsync(
                vehicleId, page, pageSize, sortBy, It.IsAny<CancellationToken>()))
            .ReturnsAsync(reviews);

        var reviewsQueryable = reviews.AsQueryable();
        var mockReviewsDbSet = reviewsQueryable.BuildMockDbSet();
        _contextMock.Setup(x => x.Reviews).Returns(mockReviewsDbSet.Object);

        // Act
        var result = await _reviewService.GetVehicleReviewsAsync(vehicleId, page, pageSize, sortBy);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Data.Count);
        Assert.Equal(page, result.Page);
        Assert.Equal(pageSize, result.PageSize);
        Assert.Equal(totalCount, result.TotalCount);
        Assert.Equal(1, result.TotalPages);

        // Verify review data
        var firstReview = result.Data.First();
        Assert.Equal(vehicleId, firstReview.VehicleId);
        Assert.Equal(5, firstReview.Rating);
        Assert.Equal("Great car!", firstReview.Comment);
        Assert.Equal("John Doe", firstReview.UserName);

        _vehicleRepositoryMock.Verify(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()), Times.Once);
        _reviewRepositoryMock.Verify(x => x.GetVehicleReviewsAsync(
            vehicleId, page, pageSize, sortBy, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetVehicleReviewsAsync_WithNonExistentVehicle_ShouldThrowNotFoundException()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var page = 1;
        var pageSize = 10;
        var sortBy = "date";

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Vehicle?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _reviewService.GetVehicleReviewsAsync(vehicleId, page, pageSize, sortBy));

        Assert.Equal($"Vehicle with ID {vehicleId} not found", exception.Message);
        _vehicleRepositoryMock.Verify(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()), Times.Once);
        _reviewRepositoryMock.Verify(x => x.GetVehicleReviewsAsync(
            It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(1, 5, 10, 2)] // 10 reviews, page 1, size 5 = 2 pages
    [InlineData(2, 5, 10, 2)] // 10 reviews, page 2, size 5 = 2 pages
    [InlineData(1, 10, 15, 2)] // 15 reviews, page 1, size 10 = 2 pages
    [InlineData(1, 20, 5, 1)] // 5 reviews, page 1, size 20 = 1 page
    public async Task GetVehicleReviewsAsync_WithDifferentPaginationParameters_ShouldCalculateCorrectTotalPages(
        int page, int pageSize, int totalReviews, int expectedTotalPages)
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var sortBy = "date";
        var vehicle = CreateTestVehicle(vehicleId);
        var reviews = CreateTestReviews(vehicleId, Math.Min(pageSize, totalReviews));

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _reviewRepositoryMock.Setup(x => x.GetVehicleReviewsAsync(
                vehicleId, page, pageSize, sortBy, It.IsAny<CancellationToken>()))
            .ReturnsAsync(reviews);

        var allReviews = CreateTestReviews(vehicleId, totalReviews);
        var reviewsQueryable = allReviews.AsQueryable();
        var mockReviewsDbSet = reviewsQueryable.BuildMockDbSet();
        _contextMock.Setup(x => x.Reviews).Returns(mockReviewsDbSet.Object);

        // Act
        var result = await _reviewService.GetVehicleReviewsAsync(vehicleId, page, pageSize, sortBy);

        // Assert
        Assert.Equal(expectedTotalPages, result.TotalPages);
        Assert.Equal(totalReviews, result.TotalCount);
    }

    [Theory]
    [InlineData("date")]
    [InlineData("rating")]
    [InlineData("helpfulness")]
    public async Task GetVehicleReviewsAsync_WithDifferentSortOptions_ShouldPassSortParameterToRepository(
        string sortBy)
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var page = 1;
        var pageSize = 10;
        var vehicle = CreateTestVehicle(vehicleId);
        var reviews = CreateTestReviews(vehicleId, 2);

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _reviewRepositoryMock.Setup(x => x.GetVehicleReviewsAsync(
                vehicleId, page, pageSize, sortBy, It.IsAny<CancellationToken>()))
            .ReturnsAsync(reviews);

        var reviewsQueryable = reviews.AsQueryable();
        var mockReviewsDbSet = reviewsQueryable.BuildMockDbSet();
        _contextMock.Setup(x => x.Reviews).Returns(mockReviewsDbSet.Object);

        // Act
        await _reviewService.GetVehicleReviewsAsync(vehicleId, page, pageSize, sortBy);

        // Assert
        _reviewRepositoryMock.Verify(x => x.GetVehicleReviewsAsync(
            vehicleId, page, pageSize, sortBy, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetVehicleReviewsAsync_WithEmptyReviews_ShouldReturnEmptyPagedResult()
    {
        // Arrange
        var vehicleId = Guid.NewGuid();
        var page = 1;
        var pageSize = 10;
        var sortBy = "date";
        var vehicle = CreateTestVehicle(vehicleId);
        var emptyReviews = new List<Review>();

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _reviewRepositoryMock.Setup(x => x.GetVehicleReviewsAsync(
                vehicleId, page, pageSize, sortBy, It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyReviews);

        var reviewsQueryable = emptyReviews.AsQueryable();
        var mockReviewsDbSet = reviewsQueryable.BuildMockDbSet();
        _contextMock.Setup(x => x.Reviews).Returns(mockReviewsDbSet.Object);

        // Act
        var result = await _reviewService.GetVehicleReviewsAsync(vehicleId, page, pageSize, sortBy);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.Data);
        Assert.Equal(0, result.TotalCount);
        Assert.Equal(0, result.TotalPages);
    }

    #endregion

    #region CreateReviewAsync Tests

    [Fact]
    public async Task CreateReviewAsync_WithValidData_ShouldCreateReviewSuccessfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var request = new CreateReviewRequest(vehicleId, bookingId, 5, "Excellent car!");

        var vehicle = CreateTestVehicle(vehicleId);
        var booking = CreateTestCompletedBooking(bookingId, userId, vehicleId);
        var createdReview = CreateTestReview(vehicleId, userId, bookingId, 5, "Excellent car!");

        SetupCreateReviewMocks(vehicle, booking, createdReview, hasExistingReview: false);

        // Act
        var result = await _reviewService.CreateReviewAsync(request, userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(createdReview.Id, result.ReviewId);
        Assert.Equal(vehicleId, result.VehicleId);
        Assert.Equal(5, result.Rating);
        Assert.Equal("Review created successfully", result.Message);

        VerifyCreateReviewMocks(vehicleId, bookingId, userId);
    }

    [Fact]
    public async Task CreateReviewAsync_WithNonExistentVehicle_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var request = new CreateReviewRequest(vehicleId, bookingId, 5, "Great car!");

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Vehicle?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _reviewService.CreateReviewAsync(request, userId));

        Assert.Equal($"Vehicle with ID {vehicleId} not found", exception.Message);
        _vehicleRepositoryMock.Verify(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateReviewAsync_WithNonExistentBooking_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var request = new CreateReviewRequest(vehicleId, bookingId, 5, "Great car!");
        var vehicle = CreateTestVehicle(vehicleId);

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _bookingRepositoryMock.Setup(x => x.GetBookingWithDetailsAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Booking?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _reviewService.CreateReviewAsync(request, userId));

        Assert.Equal($"Booking with ID {bookingId} not found", exception.Message);
    }

    [Fact]
    public async Task CreateReviewAsync_WithBookingFromDifferentUser_ShouldThrowForbiddenException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var request = new CreateReviewRequest(vehicleId, bookingId, 5, "Great car!");

        var vehicle = CreateTestVehicle(vehicleId);
        var booking = CreateTestCompletedBooking(bookingId, otherUserId, vehicleId); // Different user

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _bookingRepositoryMock.Setup(x => x.GetBookingWithDetailsAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ForbiddenException>(
            () => _reviewService.CreateReviewAsync(request, userId));

        Assert.Equal("You can only review vehicles from your own bookings", exception.Message);
    }

    [Fact]
    public async Task CreateReviewAsync_WithMismatchedVehicleInBooking_ShouldThrowValidationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var differentVehicleId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var request = new CreateReviewRequest(vehicleId, bookingId, 5, "Great car!");

        var vehicle = CreateTestVehicle(vehicleId);
        var booking = CreateTestCompletedBooking(bookingId, userId, differentVehicleId); // Different vehicle

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _bookingRepositoryMock.Setup(x => x.GetBookingWithDetailsAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _reviewService.CreateReviewAsync(request, userId));

        Assert.Contains("BookingId", exception.Errors.Keys);
        Assert.Equal("The booking does not match the vehicle being reviewed", exception.Errors["BookingId"].First());
    }

    [Theory]
    [InlineData(BookingStatus.Draft)]
    [InlineData(BookingStatus.Cancelled)]
    public async Task CreateReviewAsync_WithNonCompletedBooking_ShouldThrowValidationException(BookingStatus status)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var request = new CreateReviewRequest(vehicleId, bookingId, 5, "Great car!");

        var vehicle = CreateTestVehicle(vehicleId);
        var booking = CreateTestBooking(bookingId, userId, vehicleId, status);

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _bookingRepositoryMock.Setup(x => x.GetBookingWithDetailsAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _reviewService.CreateReviewAsync(request, userId));

        Assert.Contains("BookingId", exception.Errors.Keys);
        Assert.Equal("You can only review vehicles from completed bookings", exception.Errors["BookingId"].First());
    }



    [Fact]
    public async Task CreateReviewAsync_WithExistingReview_ShouldThrowConflictException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var request = new CreateReviewRequest(vehicleId, bookingId, 5, "Great car!");

        var vehicle = CreateTestVehicle(vehicleId);
        var booking = CreateTestCompletedBooking(bookingId, userId, vehicleId);
        var existingReview = CreateTestReview(vehicleId, userId, bookingId, 4, "Good car");

        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _bookingRepositoryMock.Setup(x => x.GetBookingWithDetailsAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);

        var reviews = new List<Review> { existingReview }.AsQueryable();
        var mockReviewsDbSet = reviews.BuildMockDbSet();
        _contextMock.Setup(x => x.Reviews).Returns(mockReviewsDbSet.Object);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ConflictException>(
            () => _reviewService.CreateReviewAsync(request, userId));

        Assert.Equal("A review already exists for this booking", exception.Message);
    }

    [Theory]
    [InlineData(BookingStatus.Completed)]
    public async Task CreateReviewAsync_WithValidCompletedStatuses_ShouldCreateReviewSuccessfully(BookingStatus status)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var request = new CreateReviewRequest(vehicleId, bookingId, 4, "Good car!");

        var vehicle = CreateTestVehicle(vehicleId);
        var booking = CreateTestBooking(bookingId, userId, vehicleId, status);
        booking.ReturnDate = DateTime.UtcNow.AddDays(-1); // Past date
        var createdReview = CreateTestReview(vehicleId, userId, bookingId, 4, "Good car!");

        SetupCreateReviewMocks(vehicle, booking, createdReview, hasExistingReview: false);

        // Act
        var result = await _reviewService.CreateReviewAsync(request, userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(4, result.Rating);
        Assert.Equal("Review created successfully", result.Message);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public async Task CreateReviewAsync_WithValidRatingRange_ShouldCreateReviewSuccessfully(int rating)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var request = new CreateReviewRequest(vehicleId, bookingId, rating, "Test comment");

        var vehicle = CreateTestVehicle(vehicleId);
        var booking = CreateTestCompletedBooking(bookingId, userId, vehicleId);
        var createdReview = CreateTestReview(vehicleId, userId, bookingId, rating, "Test comment");

        SetupCreateReviewMocks(vehicle, booking, createdReview, hasExistingReview: false);

        // Act
        var result = await _reviewService.CreateReviewAsync(request, userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(rating, result.Rating);
    }

    [Fact]
    public async Task CreateReviewAsync_WithNullComment_ShouldCreateReviewSuccessfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var request = new CreateReviewRequest(vehicleId, bookingId, 5, null);

        var vehicle = CreateTestVehicle(vehicleId);
        var booking = CreateTestCompletedBooking(bookingId, userId, vehicleId);
        var createdReview = CreateTestReview(vehicleId, userId, bookingId, 5, null);

        SetupCreateReviewMocks(vehicle, booking, createdReview, hasExistingReview: false);

        // Act
        var result = await _reviewService.CreateReviewAsync(request, userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Rating);
        Assert.Equal("Review created successfully", result.Message);
    }

    #endregion

    #region Helper Methods

    private Vehicle CreateTestVehicle(Guid vehicleId)
    {
        return new Vehicle
        {
            Id = vehicleId,
            Make = "Toyota",
            Model = "Camry",
            Year = 2023,
            Status = "Available"
        };
    }

    private List<Review> CreateTestReviews(Guid vehicleId, int count)
    {
        var reviews = new List<Review>();
        for (int i = 0; i < count; i++)
        {
            var userId = Guid.NewGuid();
            reviews.Add(new Review
            {
                Id = Guid.NewGuid(),
                VehicleId = vehicleId,
                UserId = userId,
                BookingId = Guid.NewGuid(),
                Rating = 5,
                Comment = "Great car!",
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                User = new ApplicationUser
                {
                    Id = userId,
                    FirstName = "John",
                    LastName = "Doe"
                }
            });
        }
        return reviews;
    }

    private Review CreateTestReview(Guid vehicleId, Guid userId, Guid bookingId, int rating, string? comment)
    {
        return new Review
        {
            Id = Guid.NewGuid(),
            VehicleId = vehicleId,
            UserId = userId,
            BookingId = bookingId,
            Rating = rating,
            Comment = comment,
            CreatedAt = DateTime.UtcNow
        };
    }

    private Booking CreateTestCompletedBooking(Guid bookingId, Guid userId, Guid vehicleId)
    {
        return CreateTestBooking(bookingId, userId, vehicleId, BookingStatus.Completed);
    }

    private Booking CreateTestBooking(Guid bookingId, Guid userId, Guid vehicleId, BookingStatus status)
    {
        return new Booking
        {
            Id = bookingId,
            UserId = userId,
            VehicleId = vehicleId,
            Status = status,
            PickupDate = DateTime.UtcNow.AddDays(-10),
            ReturnDate = DateTime.UtcNow.AddDays(-1),
            BookingNumber = "BK123456"
        };
    }

    private void SetupCreateReviewMocks(Vehicle vehicle, Booking booking, Review createdReview, bool hasExistingReview)
    {
        _vehicleRepositoryMock.Setup(x => x.GetByIdAsync(vehicle.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(vehicle);

        _bookingRepositoryMock.Setup(x => x.GetBookingWithDetailsAsync(booking.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);

        var existingReviews = hasExistingReview
            ? new List<Review> { createdReview }.AsQueryable()
            : new List<Review>().AsQueryable();
        var mockReviewsDbSet = existingReviews.BuildMockDbSet();
        _contextMock.Setup(x => x.Reviews).Returns(mockReviewsDbSet.Object);

        _reviewRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Review>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdReview);

        _reviewRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
    }

    private void VerifyCreateReviewMocks(Guid vehicleId, Guid bookingId, Guid userId)
    {
        _vehicleRepositoryMock.Verify(x => x.GetByIdAsync(vehicleId, It.IsAny<CancellationToken>()), Times.Once);
        _bookingRepositoryMock.Verify(x => x.GetBookingWithDetailsAsync(bookingId, It.IsAny<CancellationToken>()), Times.Once);
        _reviewRepositoryMock.Verify(x => x.AddAsync(It.Is<Review>(r =>
            r.VehicleId == vehicleId &&
            r.UserId == userId &&
            r.BookingId == bookingId), It.IsAny<CancellationToken>()), Times.Once);
        _reviewRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion
}