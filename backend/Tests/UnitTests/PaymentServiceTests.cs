using Backend.Application.DTOs.Payment;
using Backend.Application.DTOs.Common;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Application.Settings;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Backend.Tests.UnitTests;

public class PaymentServiceTests
{
    private readonly Mock<IPaymentRepository> _paymentRepositoryMock;
    private readonly Mock<IBookingRepository> _bookingRepositoryMock;
    private readonly Mock<IApplicationDbContext> _contextMock;
    private readonly Mock<IPaymobClient> _paymobMock;
    private readonly Mock<IRefundCalculator> _refundCalculatorMock;
    private readonly Mock<ILogger<PaymentService>> _loggerMock;
    private readonly Mock<MediatR.IMediator> _mediatorMock;
    private readonly Mock<INotificationService> _notificationServiceMock;
    private readonly PaymentService _paymentService;

    public PaymentServiceTests()
    {
        _paymentRepositoryMock = new Mock<IPaymentRepository>();
        _bookingRepositoryMock = new Mock<IBookingRepository>();
        _contextMock = new Mock<IApplicationDbContext>();
        _paymobMock = new Mock<IPaymobClient>();
        _refundCalculatorMock = new Mock<IRefundCalculator>();
        _loggerMock = new Mock<ILogger<PaymentService>>();
        _mediatorMock = new Mock<MediatR.IMediator>();
        _notificationServiceMock = new Mock<INotificationService>();

        _paymentService = new PaymentService(
            _paymentRepositoryMock.Object,
            _bookingRepositoryMock.Object,
            _contextMock.Object,
            _paymobMock.Object,
            _refundCalculatorMock.Object,
            Options.Create(new PaymobSettings()),
            _loggerMock.Object,
            _mediatorMock.Object,
            _notificationServiceMock.Object);
    }

    #region ProcessPaymentAsync Tests

    [Fact]
    public async Task ProcessPaymentAsync_WithValidRequest_ShouldProcessPaymentSuccessfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var paymentMethodId = Guid.NewGuid();

        var request = new PaymentRequest(
            BookingId: bookingId,
            Amount: 150.00m,
            PaymentMethodId: paymentMethodId,
            PaymentMethod: "credit_card"
        );

        var booking = new Booking
        {
            Id = bookingId,
            UserId = userId,
            Status = BookingStatus.PaymentPending,
            TotalPrice = 150.00m
        };

        _bookingRepositoryMock.Setup(x => x.GetByIdAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);

        _bookingRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _paymentRepositoryMock.Setup(x => x.AddAsync(It.IsAny<BookingPayment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<BookingPayment>());

        _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        // Act
        var result = await _paymentService.ProcessPaymentAsync(request, userId);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.TransactionId);
        Assert.Equal("Captured", result.Status);
        Assert.Equal("Payment processed successfully", result.Message);

        // Verify booking status was updated to "Paid"
        _bookingRepositoryMock.Verify(x => x.UpdateAsync(It.Is<Booking>(b => b.Status == BookingStatus.Confirmed), It.IsAny<CancellationToken>()), Times.Once);
        _paymentRepositoryMock.Verify(x => x.AddAsync(It.Is<BookingPayment>(p =>
            p.BookingId == bookingId &&
            p.Amount == 150.00m &&
            p.PaymentMethod == "credit_card" &&
            p.Status == "Captured"), It.IsAny<CancellationToken>()), Times.Once);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessPaymentAsync_WithZeroAmount_ShouldThrowValidationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new PaymentRequest(
            BookingId: Guid.NewGuid(),
            Amount: 0m,
            PaymentMethodId: Guid.NewGuid(),
            PaymentMethod: "credit_card"
        );

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _paymentService.ProcessPaymentAsync(request, userId));

        Assert.Contains("Amount", exception.Errors.Keys);
        Assert.Equal("Payment amount must be greater than zero", exception.Errors["Amount"].First());

        _bookingRepositoryMock.Verify(x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessPaymentAsync_WithNegativeAmount_ShouldThrowValidationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new PaymentRequest(
            BookingId: Guid.NewGuid(),
            Amount: -50.00m,
            PaymentMethodId: Guid.NewGuid(),
            PaymentMethod: "credit_card"
        );

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _paymentService.ProcessPaymentAsync(request, userId));

        Assert.Contains("Amount", exception.Errors.Keys);
        Assert.Equal("Payment amount must be greater than zero", exception.Errors["Amount"].First());
    }

    [Fact]
    public async Task ProcessPaymentAsync_WithNonExistentBooking_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var request = new PaymentRequest(
            BookingId: bookingId,
            Amount: 100.00m,
            PaymentMethodId: Guid.NewGuid(),
            PaymentMethod: "credit_card"
        );

        _bookingRepositoryMock.Setup(x => x.GetByIdAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Booking?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _paymentService.ProcessPaymentAsync(request, userId));

        Assert.Equal($"Booking with ID {bookingId} not found", exception.Message);
        _bookingRepositoryMock.Verify(x => x.GetByIdAsync(bookingId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessPaymentAsync_WithUnauthorizedUser_ShouldThrowForbiddenException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var differentUserId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var request = new PaymentRequest(
            BookingId: bookingId,
            Amount: 100.00m,
            PaymentMethodId: Guid.NewGuid(),
            PaymentMethod: "credit_card"
        );

        var booking = new Booking
        {
            Id = bookingId,
            UserId = differentUserId, // Different user ID
            Status = BookingStatus.PaymentPending
        };

        _bookingRepositoryMock.Setup(x => x.GetByIdAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ForbiddenException>(
            () => _paymentService.ProcessPaymentAsync(request, userId));

        Assert.Equal("You do not have permission to pay for this booking", exception.Message);
        _bookingRepositoryMock.Verify(x => x.GetByIdAsync(bookingId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(BookingStatus.Cancelled)]
    [InlineData(BookingStatus.Completed)]
    public async Task ProcessPaymentAsync_WithNonPayableBookingStatus_ShouldThrowValidationException(BookingStatus status)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var request = new PaymentRequest(
            BookingId: bookingId,
            Amount: 100.00m,
            PaymentMethodId: Guid.NewGuid(),
            PaymentMethod: "credit_card"
        );

        var booking = new Booking
        {
            Id = bookingId,
            UserId = userId,
            Status = status
        };

        _bookingRepositoryMock.Setup(x => x.GetByIdAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _paymentService.ProcessPaymentAsync(request, userId));

        Assert.Contains("Status", exception.Errors.Keys);
        Assert.Equal("This booking cannot be paid", exception.Errors["Status"].First());
    }

    [Theory]
    [InlineData("credit_card")]
    [InlineData("debit_card")]
    [InlineData("paypal")]
    public async Task ProcessPaymentAsync_WithDifferentPaymentMethods_ShouldProcessSuccessfully(string paymentMethod)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var request = new PaymentRequest(
            BookingId: bookingId,
            Amount: 200.00m,
            PaymentMethodId: Guid.NewGuid(),
            PaymentMethod: paymentMethod
        );

        var booking = new Booking
        {
            Id = bookingId,
            UserId = userId,
            Status = BookingStatus.PaymentPending
        };

        _bookingRepositoryMock.Setup(x => x.GetByIdAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);

        _bookingRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _paymentRepositoryMock.Setup(x => x.AddAsync(It.IsAny<BookingPayment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<BookingPayment>());

        _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _paymentService.ProcessPaymentAsync(request, userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Captured", result.Status);

        _paymentRepositoryMock.Verify(x => x.AddAsync(It.Is<BookingPayment>(p =>
            p.PaymentMethod == paymentMethod), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessPaymentAsync_ShouldGenerateUniqueTransactionIds()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var request = new PaymentRequest(
            BookingId: bookingId,
            Amount: 100.00m,
            PaymentMethodId: Guid.NewGuid(),
            PaymentMethod: "credit_card"
        );

        var booking = new Booking
        {
            Id = bookingId,
            UserId = userId,
            Status = BookingStatus.PaymentPending
        };

        _bookingRepositoryMock.Setup(x => x.GetByIdAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);

        _bookingRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _paymentRepositoryMock.Setup(x => x.AddAsync(It.IsAny<BookingPayment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<BookingPayment>());

        _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result1 = await _paymentService.ProcessPaymentAsync(request, userId);
        var result2 = await _paymentService.ProcessPaymentAsync(request, userId);

        // Assert
        Assert.NotEqual(result1.TransactionId, result2.TransactionId);
        Assert.NotEqual(Guid.Empty, result1.TransactionId);
        Assert.NotEqual(Guid.Empty, result2.TransactionId);
    }

    [Fact]
    public async Task ProcessPaymentAsync_WhenDriverRequiredButNotAssigned_ShouldThrowBadRequestException()
    {
        // Arrange — booking requires a driver (e.g. unlicensed customer) but
        // none has been assigned yet. Payment must be blocked.
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var request = new PaymentRequest(
            BookingId: bookingId,
            Amount: 150.00m,
            PaymentMethodId: Guid.NewGuid(),
            PaymentMethod: "credit_card"
        );

        var booking = new Booking
        {
            Id = bookingId,
            UserId = userId,
            Status = BookingStatus.PaymentPending,
            RequiresDriver = true,
            AssignedDriverProfileId = null,
            TotalPrice = 150.00m
        };

        _bookingRepositoryMock.Setup(x => x.GetByIdAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);

        // Act & Assert
        await Assert.ThrowsAsync<BadRequestException>(
            () => _paymentService.ProcessPaymentAsync(request, userId));

        // No payment row created, no booking status change persisted.
        _paymentRepositoryMock.Verify(x => x.AddAsync(It.IsAny<BookingPayment>(), It.IsAny<CancellationToken>()), Times.Never);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessPaymentAsync_WhenDriverRequiredAndAssigned_ShouldProcessSuccessfully()
    {
        // Arrange — booking requires a driver AND one is assigned. Payment is
        // allowed (the gate only blocks the unassigned case).
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var request = new PaymentRequest(
            BookingId: bookingId,
            Amount: 150.00m,
            PaymentMethodId: Guid.NewGuid(),
            PaymentMethod: "credit_card"
        );

        var booking = new Booking
        {
            Id = bookingId,
            UserId = userId,
            Status = BookingStatus.Confirmed,
            RequiresDriver = true,
            AssignedDriverProfileId = Guid.NewGuid(),
            TotalPrice = 150.00m
        };

        _bookingRepositoryMock.Setup(x => x.GetByIdAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);
        _bookingRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Booking>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _paymentRepositoryMock.Setup(x => x.AddAsync(It.IsAny<BookingPayment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<BookingPayment>());
        _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _paymentService.ProcessPaymentAsync(request, userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Captured", result.Status);
        _paymentRepositoryMock.Verify(x => x.AddAsync(It.IsAny<BookingPayment>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region GetPaymentHistoryAsync Tests

    [Fact]
    public async Task GetPaymentHistoryAsync_WithValidRequest_ShouldReturnPaginatedPayments()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var transactionId1 = Guid.NewGuid();
        var transactionId2 = Guid.NewGuid();

        var payments = new List<BookingPayment>
        {
            new BookingPayment
            {
                PaymentId = Guid.NewGuid(),
                TransactionId = transactionId1,
                BookingId = Guid.NewGuid(),
                Amount = 150.00m,
                Currency = "USD",
                PaymentMethod = "credit_card",
                Status = "Captured",
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new BookingPayment
            {
                PaymentId = Guid.NewGuid(),
                TransactionId = transactionId2,
                BookingId = Guid.NewGuid(),
                Amount = 200.00m,
                Currency = "USD",
                PaymentMethod = "paypal",
                Status = "Captured",
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            }
        };

        var request = new PaymentHistoryRequest(
            Page: 1,
            PageSize: 10,
            SortBy: "createdAt",
            SortOrder: "desc"
        );

        _paymentRepositoryMock.Setup(x => x.GetUserPaymentsAsync(
            userId, null, null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payments);

        // Act
        var result = await _paymentService.GetPaymentHistoryAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Data.Count);
        Assert.Equal(1, result.Page);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(2, result.TotalCount);
        Assert.Equal(1, result.TotalPages);

        // Verify sorting (most recent first)
        Assert.Equal(transactionId2, result.Data.First().TransactionId);
        Assert.Equal(transactionId1, result.Data.Last().TransactionId);

        _paymentRepositoryMock.Verify(x => x.GetUserPaymentsAsync(
            userId, null, null, null, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetPaymentHistoryAsync_WithFilters_ShouldPassFiltersToRepository()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var startDate = DateTime.UtcNow.AddDays(-30);
        var endDate = DateTime.UtcNow;
        var status = "Captured";
        var paymentMethod = "credit_card";

        var request = new PaymentHistoryRequest(
            StartDate: startDate,
            EndDate: endDate,
            Status: status,
            PaymentMethod: paymentMethod,
            Page: 1,
            PageSize: 20
        );

        _paymentRepositoryMock.Setup(x => x.GetUserPaymentsAsync(
            userId, startDate, endDate, status, paymentMethod, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<BookingPayment>());

        // Act
        var result = await _paymentService.GetPaymentHistoryAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.Data);

        _paymentRepositoryMock.Verify(x => x.GetUserPaymentsAsync(
            userId, startDate, endDate, status, paymentMethod, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("amount", "asc")]
    [InlineData("amount", "desc")]
    [InlineData("status", "asc")]
    [InlineData("status", "desc")]
    [InlineData("paymentmethod", "asc")]
    [InlineData("paymentmethod", "desc")]
    [InlineData("createdAt", "asc")]
    [InlineData("createdAt", "desc")]
    public async Task GetPaymentHistoryAsync_WithDifferentSorting_ShouldSortCorrectly(string sortBy, string sortOrder)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var payments = new List<BookingPayment>
        {
            new BookingPayment
            {
                TransactionId = Guid.NewGuid(),
                BookingId = Guid.NewGuid(),
                Amount = 100.00m,
                Currency = "USD",
                PaymentMethod = "credit_card",
                Status = "Captured",
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new BookingPayment
            {
                TransactionId = Guid.NewGuid(),
                BookingId = Guid.NewGuid(),
                Amount = 200.00m,
                Currency = "USD",
                PaymentMethod = "paypal",
                Status = "Pending",
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            }
        };

        var request = new PaymentHistoryRequest(
            SortBy: sortBy,
            SortOrder: sortOrder
        );

        _paymentRepositoryMock.Setup(x => x.GetUserPaymentsAsync(
            userId, null, null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payments);

        // Act
        var result = await _paymentService.GetPaymentHistoryAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Data.Count);

        // Verify sorting is applied (specific verification depends on sort field and order)
        var firstPayment = result.Data.First();
        var lastPayment = result.Data.Last();

        switch (sortBy.ToLowerInvariant())
        {
            case "amount":
                if (sortOrder == "asc")
                    Assert.True(firstPayment.Amount <= lastPayment.Amount);
                else
                    Assert.True(firstPayment.Amount >= lastPayment.Amount);
                break;
            case "status":
                if (sortOrder == "asc")
                    Assert.True(string.Compare(firstPayment.Status, lastPayment.Status, StringComparison.Ordinal) <= 0);
                else
                    Assert.True(string.Compare(firstPayment.Status, lastPayment.Status, StringComparison.Ordinal) >= 0);
                break;
        }
    }

    [Fact]
    public async Task GetPaymentHistoryAsync_WithPagination_ShouldReturnCorrectPage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var payments = new List<BookingPayment>();

        // Create 25 payments for pagination testing
        for (int i = 0; i < 25; i++)
        {
            payments.Add(new BookingPayment
            {
                TransactionId = Guid.NewGuid(),
                BookingId = Guid.NewGuid(),
                Amount = 100.00m + i,
                Currency = "USD",
                PaymentMethod = "credit_card",
                Status = "Captured",
                CreatedAt = DateTime.UtcNow.AddDays(-i)
            });
        }

        var request = new PaymentHistoryRequest(
            Page: 2,
            PageSize: 10
        );

        _paymentRepositoryMock.Setup(x => x.GetUserPaymentsAsync(
            userId, null, null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payments);

        // Act
        var result = await _paymentService.GetPaymentHistoryAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.Data.Count); // Page size
        Assert.Equal(2, result.Page);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(25, result.TotalCount);
        Assert.Equal(3, result.TotalPages); // 25 items / 10 per page = 3 pages
    }

    #endregion

    #region InitiatePaymentAsync Tests

    [Fact]
    public async Task InitiatePaymentAsync_WithValidRequest_ShouldReturnIframeUrl()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var amount = 150.00m;
        var amountCents = 15000L;
        var authToken = "auth-token-123";
        var orderId = "paymob-order-id-456";
        var paymentKey = "payment-key-789";

        var booking = new Booking
        {
            Id = bookingId,
            UserId = userId,
            Status = BookingStatus.PaymentPending,
            TotalPrice = amount
        };

        var user = new ApplicationUser
        {
            Id = userId,
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "+20123456789"
        };

        var users = new List<ApplicationUser> { user }.AsQueryable();
        // Since IApplicationDbContext.Users is IQueryable<ApplicationUser>, 
        // we can use a simpler mock if we don't need full EF behavior,
        // but for FirstOrDefaultAsync to work, it needs to be an IAsyncEnumerable.
        // We'll use the TestAsyncEnumerable from MockDbSetExtensions indirectly if possible,
        // or just mock the property to return a queryable that supports async.
        
        _contextMock.Setup(x => x.Users).Returns(new TestUtilities.TestAsyncEnumerable<ApplicationUser>(users));

        _bookingRepositoryMock.Setup(x => x.GetByIdAsync(bookingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(booking);

        _paymobMock.Setup(x => x.GetAuthTokenAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(authToken);

        _paymobMock.Setup(x => x.CreateOrderAsync(authToken, amountCents, "EGP", It.Is<string>(s => s.StartsWith(bookingId.ToString())), It.IsAny<CancellationToken>()))
            .ReturnsAsync(orderId);

        _paymobMock.Setup(x => x.RequestPaymentKeyAsync(
            authToken, 
            orderId, 
            amountCents, 
            "EGP", 
            It.IsAny<int>(), 
            It.IsAny<PaymobBillingData>(), 
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(paymentKey);

        _paymentRepositoryMock.Setup(x => x.AddAsync(It.IsAny<BookingPayment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<BookingPayment>());

        _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _paymentService.InitiatePaymentAsync(bookingId, userId);

        // Assert
        Assert.NotNull(result);
        Assert.Contains(paymentKey, result.IframeUrl);
        Assert.Equal(orderId, result.PaymobOrderId);

        _paymobMock.Verify(x => x.GetAuthTokenAsync(It.IsAny<CancellationToken>()), Times.Once);
        _paymobMock.Verify(x => x.CreateOrderAsync(authToken, amountCents, "EGP", It.Is<string>(s => s.StartsWith(bookingId.ToString())), It.IsAny<CancellationToken>()), Times.Once);
        _paymobMock.Verify(x => x.RequestPaymentKeyAsync(
            authToken, 
            orderId, 
            amountCents, 
            "EGP", 
            It.IsAny<int>(), 
            It.Is<PaymobBillingData>(b => b.Email == user.Email), 
            It.IsAny<CancellationToken>()), Times.Once);
        
        _paymentRepositoryMock.Verify(x => x.AddAsync(It.Is<BookingPayment>(p => 
            p.BookingId == bookingId && 
            p.PaymobOrderId == orderId &&
            p.Amount == amount), It.IsAny<CancellationToken>()), Times.Once);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region GenerateReceiptAsync Tests

    [Fact]
    public async Task GenerateReceiptAsync_WithValidTransactionId_ShouldReturnPdfReceipt()
    {
        // Arrange
        var transactionId = Guid.NewGuid();
        var payment = new BookingPayment
        {
            PaymentId = Guid.NewGuid(),
            TransactionId = transactionId,
            BookingId = Guid.NewGuid(),
            Amount = 150.00m,
            Currency = "USD",
            PaymentMethod = "credit_card",
            Status = "Captured",
            AuthorizationCode = "AUTH-12345",
            ProcessedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5)
        };

        _paymentRepositoryMock.Setup(x => x.GetByTransactionIdAsync(transactionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payment);

        // Act
        var result = await _paymentService.GenerateReceiptAsync(transactionId, "pdf");

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Length > 0);

        // Verify the receipt contains expected information
        var receiptContent = System.Text.Encoding.UTF8.GetString(result);
        Assert.Contains("PAYMENT RECEIPT", receiptContent);
        Assert.Contains(transactionId.ToString(), receiptContent);
        Assert.Contains("150.00", receiptContent); // Amount without currency symbol
        Assert.Contains("credit_card", receiptContent);
        Assert.Contains("Captured", receiptContent);
        Assert.Contains("AUTH-12345", receiptContent);

        _paymentRepositoryMock.Verify(x => x.GetByTransactionIdAsync(transactionId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GenerateReceiptAsync_WithValidTransactionId_ShouldReturnHtmlReceipt()
    {
        // Arrange
        var transactionId = Guid.NewGuid();
        var payment = new BookingPayment
        {
            PaymentId = Guid.NewGuid(),
            TransactionId = transactionId,
            BookingId = Guid.NewGuid(),
            Amount = 200.00m,
            Currency = "USD",
            PaymentMethod = "paypal",
            Status = "Captured",
            CreatedAt = DateTime.UtcNow
        };

        _paymentRepositoryMock.Setup(x => x.GetByTransactionIdAsync(transactionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payment);

        // Act
        var result = await _paymentService.GenerateReceiptAsync(transactionId, "html");

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Length > 0);

        // Verify the receipt contains expected HTML structure and information
        var receiptContent = System.Text.Encoding.UTF8.GetString(result);
        Assert.Contains("<!DOCTYPE html>", receiptContent);
        Assert.Contains("<html>", receiptContent);
        Assert.Contains("Payment Receipt", receiptContent);
        Assert.Contains(transactionId.ToString(), receiptContent);
        Assert.Contains("200.00", receiptContent); // Amount without currency symbol
        Assert.Contains("paypal", receiptContent);
        Assert.Contains("Captured", receiptContent);

        _paymentRepositoryMock.Verify(x => x.GetByTransactionIdAsync(transactionId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GenerateReceiptAsync_WithNonExistentTransaction_ShouldThrowNotFoundException()
    {
        // Arrange
        var transactionId = Guid.NewGuid();

        _paymentRepositoryMock.Setup(x => x.GetByTransactionIdAsync(transactionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BookingPayment?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _paymentService.GenerateReceiptAsync(transactionId, "pdf"));

        Assert.Equal($"Payment transaction with ID {transactionId} not found", exception.Message);
        _paymentRepositoryMock.Verify(x => x.GetByTransactionIdAsync(transactionId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("PDF")]
    [InlineData("Html")]
    [InlineData("UNKNOWN")]
    public async Task GenerateReceiptAsync_WithDifferentFormats_ShouldHandleCorrectly(string format)
    {
        // Arrange
        var transactionId = Guid.NewGuid();
        var payment = new BookingPayment
        {
            PaymentId = Guid.NewGuid(),
            TransactionId = transactionId,
            BookingId = Guid.NewGuid(),
            Amount = 100.00m,
            Currency = "USD",
            PaymentMethod = "credit_card",
            Status = "Captured",
            CreatedAt = DateTime.UtcNow
        };

        _paymentRepositoryMock.Setup(x => x.GetByTransactionIdAsync(transactionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payment);

        // Act
        var result = await _paymentService.GenerateReceiptAsync(transactionId, format);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Length > 0);

        var receiptContent = System.Text.Encoding.UTF8.GetString(result);

        if (format.ToLowerInvariant() == "pdf")
        {
            // Should return PDF format (plain text)
            Assert.Contains("PAYMENT RECEIPT", receiptContent);
            Assert.DoesNotContain("<!DOCTYPE html>", receiptContent);
        }
        else
        {
            // Should return HTML format (including "UNKNOWN" format)
            Assert.Contains("<!DOCTYPE html>", receiptContent);
            Assert.Contains("<html>", receiptContent);
            Assert.Contains("Payment Receipt", receiptContent);
        }
    }

    #endregion
}