using Backend.Application.DTOs.Earnings;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Tests.TestUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage;
using Moq;

namespace Backend.Tests.UnitTests;

public class DriverEarningsServiceTests
{
    private readonly Mock<IApplicationDbContext> _contextMock;
    private readonly DriverEarningsService _service;
    private readonly Guid _driverProfileId = Guid.NewGuid();

    private List<DriverEarning> _earningsData = [];
    private List<DriverPayout> _payoutsData = [];
    private List<DriverProfile> _driverProfilesData = [];
    private List<DriverPaymentInfo> _paymentInfoData = [];
    private List<SystemSetting> _systemSettingsData = [];
    private List<DriverPayoutTransaction> _payoutTransactionsData = [];

    private Mock<DbSet<DriverPayout>> _payoutsDbSetMock = null!;
    private Mock<DbSet<DriverEarning>> _earningsDbSetMock = null!;
    private Mock<DbSet<DriverPayoutTransaction>> _payoutTransactionsDbSetMock = null!;

    public DriverEarningsServiceTests()
    {
        _contextMock = new Mock<IApplicationDbContext>();
        _service = new DriverEarningsService(_contextMock.Object);
        SetupDefaultDbSets();
    }

    private void SetupDefaultDbSets()
    {
        _earningsData = [];
        _payoutsData = [];
        _driverProfilesData = [];
        _paymentInfoData = [];
        _systemSettingsData =
        [
            new SystemSetting { Id = Guid.NewGuid(), Key = "driver.commission_percentage", Value = "15" },
            new SystemSetting { Id = Guid.NewGuid(), Key = "driver.min_payout_amount", Value = "50" }
        ];
        _payoutTransactionsData = [];

        RefreshDbSetMocks();
    }

    private void RefreshDbSetMocks()
    {
        var earningsQueryable = _earningsData.AsQueryable();
        _earningsDbSetMock = earningsQueryable.BuildMockDbSet();
        _contextMock.Setup(x => x.DriverEarnings).Returns(_earningsDbSetMock.Object);

        var payoutsQueryable = _payoutsData.AsQueryable();
        _payoutsDbSetMock = payoutsQueryable.BuildMockDbSet();
        _contextMock.Setup(x => x.DriverPayouts).Returns(_payoutsDbSetMock.Object);

        _contextMock.Setup(x => x.DriverProfiles).Returns(_driverProfilesData.AsQueryable().BuildMockDbSet().Object);
        _contextMock.Setup(x => x.DriverPaymentInfo).Returns(_paymentInfoData.AsQueryable().BuildMockDbSet().Object);
        _contextMock.Setup(x => x.SystemSettings).Returns(_systemSettingsData.AsQueryable().BuildMockDbSet().Object);

        var transactionsQueryable = _payoutTransactionsData.AsQueryable();
        _payoutTransactionsDbSetMock = transactionsQueryable.BuildMockDbSet();
        _contextMock.Setup(x => x.DriverPayoutTransactions).Returns(_payoutTransactionsDbSetMock.Object);

        _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var mockTransaction = new Mock<IDbContextTransaction>();
        mockTransaction.Setup(t => t.CommitAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        mockTransaction.Setup(t => t.DisposeAsync()).Returns(ValueTask.CompletedTask);
        _contextMock.Setup(x => x.BeginTransactionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(mockTransaction.Object);
    }

    private DriverEarning CreateEarning(
        Guid? bookingId = null,
        Guid? driverProfileId = null,
        decimal grossEarning = 100m,
        decimal platformDeduction = 15m,
        decimal netEarning = 85m,
        DriverEarningStatus status = DriverEarningStatus.Available,
        DateTime? earnedAt = null,
        Guid? payoutId = null)
    {
        var bid = bookingId ?? Guid.NewGuid();
        return new DriverEarning
        {
            Id = Guid.NewGuid(),
            BookingId = bid,
            DriverProfileId = driverProfileId ?? _driverProfileId,
            GrossEarning = grossEarning,
            PlatformDeduction = platformDeduction,
            NetEarning = netEarning,
            Status = status,
            EarnedAt = earnedAt ?? DateTime.UtcNow,
            PayoutId = payoutId,
            Booking = new Booking
            {
                Id = bid,
                BookingNumber = "BK-00001",
                Vehicle = new Vehicle { Make = "Toyota", Model = "Camry" },
                User = new ApplicationUser { FirstName = "John", LastName = "Doe" }
            }
        };
    }

    #region GetStatsAsync Tests

    [Fact]
    public async Task GetStatsAsync_WithMultipleEarnings_ReturnsCorrectTotals()
    {
        // Arrange
        _earningsData =
        [
            CreateEarning(netEarning: 100m, status: DriverEarningStatus.Available),
            CreateEarning(netEarning: 200m, status: DriverEarningStatus.PendingPayout),
            CreateEarning(netEarning: 150m, status: DriverEarningStatus.Paid),
        ];
        RefreshDbSetMocks();

        // Act
        var result = await _service.GetStatsAsync(_driverProfileId);

        // Assert
        Assert.Equal(450m, result.TotalEarnings);
        Assert.Equal(450m, result.ThisMonthEarnings);
        Assert.Equal(0m, result.LastMonthEarnings);
        Assert.Equal(3, result.CompletedTripsCount);
    }

    [Fact]
    public async Task GetStatsAsync_WithNoEarnings_ReturnsZeros()
    {
        // Arrange
        _earningsData = [];
        RefreshDbSetMocks();

        // Act
        var result = await _service.GetStatsAsync(_driverProfileId);

        // Assert
        Assert.Equal(0m, result.TotalEarnings);
        Assert.Equal(0m, result.ThisMonthEarnings);
        Assert.Equal(0m, result.LastMonthEarnings);
        Assert.Equal(0m, result.AvailableBalance);
        Assert.Equal(0m, result.PendingPayoutAmount);
        Assert.Equal(0, result.CompletedTripsCount);
    }

    [Fact]
    public async Task GetStatsAsync_ExcludesReversedEarningsFromCompletedCount()
    {
        // Arrange
        _earningsData =
        [
            CreateEarning(netEarning: 100m, status: DriverEarningStatus.Available),
            CreateEarning(netEarning: 200m, status: DriverEarningStatus.Reversed),
        ];
        RefreshDbSetMocks();

        // Act
        var result = await _service.GetStatsAsync(_driverProfileId);

        // Assert
        Assert.Equal(1, result.CompletedTripsCount);
        Assert.Equal(100m, result.AvailableBalance);
    }

    [Fact]
    public async Task GetStatsAsync_AvailableBalance_OnlyCountsAvailableStatusEarnings()
    {
        // Arrange
        _earningsData =
        [
            CreateEarning(netEarning: 100m, status: DriverEarningStatus.Available),
            CreateEarning(netEarning: 200m, status: DriverEarningStatus.PendingPayout),
            CreateEarning(netEarning: 300m, status: DriverEarningStatus.Paid),
        ];
        RefreshDbSetMocks();

        // Act
        var result = await _service.GetStatsAsync(_driverProfileId);

        // Assert
        Assert.Equal(100m, result.AvailableBalance);
        Assert.Equal(200m, result.PendingPayoutAmount);
    }

    #endregion

    #region GetMonthlyChartAsync Tests

    [Fact]
    public async Task GetMonthlyChartAsync_Returns12PointsWithZeroFill()
    {
        // Arrange
        _earningsData = [];
        RefreshDbSetMocks();

        // Act
        var result = await _service.GetMonthlyChartAsync(_driverProfileId, 2026);

        // Assert
        Assert.Equal(12, result.Count);
        Assert.All(result, point => Assert.Equal(0m, point.Earnings));
        Assert.Equal(2026, result[0].Year);
        Assert.Equal(1, result[0].MonthNumber);
        Assert.Equal(12, result[11].MonthNumber);
    }

    [Fact]
    public async Task GetMonthlyChartAsync_ReturnsCorrectEarningsForMonths()
    {
        // Arrange
        _earningsData =
        [
            CreateEarning(netEarning: 100m, earnedAt: new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc)),
            CreateEarning(netEarning: 200m, earnedAt: new DateTime(2026, 3, 10, 0, 0, 0, DateTimeKind.Utc)),
            CreateEarning(netEarning: 150m, earnedAt: new DateTime(2026, 3, 20, 0, 0, 0, DateTimeKind.Utc)),
        ];
        RefreshDbSetMocks();

        // Act
        var result = await _service.GetMonthlyChartAsync(_driverProfileId, 2026);

        // Assert
        Assert.Equal(100m, result[0].Earnings);
        Assert.Equal(0m, result[1].Earnings);
        Assert.Equal(350m, result[2].Earnings);
    }

    [Fact]
    public async Task GetMonthlyChartAsync_ExcludesReversedEarnings()
    {
        // Arrange
        _earningsData =
        [
            CreateEarning(netEarning: 100m, status: DriverEarningStatus.Available, earnedAt: new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc)),
            CreateEarning(netEarning: 200m, status: DriverEarningStatus.Reversed, earnedAt: new DateTime(2026, 1, 20, 0, 0, 0, DateTimeKind.Utc)),
        ];
        RefreshDbSetMocks();

        // Act
        var result = await _service.GetMonthlyChartAsync(_driverProfileId, 2026);

        // Assert
        Assert.Equal(100m, result[0].Earnings);
    }

    #endregion

    #region GetTopBookingsAsync Tests

    [Fact]
    public async Task GetTopBookingsAsync_ReturnsTop5ByNetEarning()
    {
        // Arrange
        _earningsData =
        [
            CreateEarning(netEarning: 500m, bookingId: Guid.NewGuid()),
            CreateEarning(netEarning: 400m, bookingId: Guid.NewGuid()),
            CreateEarning(netEarning: 300m, bookingId: Guid.NewGuid()),
            CreateEarning(netEarning: 200m, bookingId: Guid.NewGuid()),
            CreateEarning(netEarning: 100m, bookingId: Guid.NewGuid()),
            CreateEarning(netEarning: 50m, bookingId: Guid.NewGuid()),
        ];
        RefreshDbSetMocks();

        // Act
        var result = await _service.GetTopBookingsAsync(_driverProfileId);

        // Assert
        Assert.Equal(5, result.Count);
        Assert.Equal(500m, result[0].NetEarning);
        Assert.Equal(400m, result[1].NetEarning);
        Assert.Equal(300m, result[2].NetEarning);
        Assert.Equal(200m, result[3].NetEarning);
        Assert.Equal(100m, result[4].NetEarning);
    }

    [Fact]
    public async Task GetTopBookingsAsync_ExcludesReversedEarnings()
    {
        // Arrange
        _earningsData =
        [
            CreateEarning(netEarning: 500m, status: DriverEarningStatus.Available),
            CreateEarning(netEarning: 400m, status: DriverEarningStatus.Reversed),
        ];
        RefreshDbSetMocks();

        // Act
        var result = await _service.GetTopBookingsAsync(_driverProfileId);

        // Assert
        Assert.Single(result);
        Assert.Equal(500m, result[0].NetEarning);
    }

    [Fact]
    public async Task GetTopBookingsAsync_WithNoEarnings_ReturnsEmptyList()
    {
        // Arrange
        _earningsData = [];
        RefreshDbSetMocks();

        // Act
        var result = await _service.GetTopBookingsAsync(_driverProfileId);

        // Assert
        Assert.Empty(result);
    }

    #endregion

    #region GetEarningsHistoryAsync Tests

    [Fact]
    public async Task GetEarningsHistoryAsync_ReturnsPaginatedResults()
    {
        // Arrange
        _earningsData = Enumerable.Range(0, 15)
            .Select(i => CreateEarning(earnedAt: DateTime.UtcNow.AddDays(-i)))
            .ToList();
        RefreshDbSetMocks();

        // Act
        var page1 = await _service.GetEarningsHistoryAsync(_driverProfileId, 1, 10);
        var page2 = await _service.GetEarningsHistoryAsync(_driverProfileId, 2, 10);

        // Assert
        Assert.Equal(10, page1.Count);
        Assert.Equal(5, page2.Count);
    }

    [Fact]
    public async Task GetEarningsHistoryAsync_OrdersByEarnedAtDescending()
    {
        // Arrange
        var earliest = CreateEarning(earnedAt: new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        var middle = CreateEarning(earnedAt: new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc));
        var latest = CreateEarning(earnedAt: new DateTime(2026, 12, 1, 0, 0, 0, DateTimeKind.Utc));
        _earningsData = [earliest, middle, latest];
        RefreshDbSetMocks();

        // Act
        var result = await _service.GetEarningsHistoryAsync(_driverProfileId, 1, 10);

        // Assert
        Assert.Equal(3, result.Count);
        Assert.Equal(latest.EarnedAt.Date, result[0].CompletedAt.Date);
        Assert.Equal(middle.EarnedAt.Date, result[1].CompletedAt.Date);
        Assert.Equal(earliest.EarnedAt.Date, result[2].CompletedAt.Date);
    }

    #endregion

    #region RequestPayoutAsync Tests

    [Fact]
    public async Task RequestPayoutAsync_ThrowsWhenDriverProfileNotFound()
    {
        // Arrange
        _driverProfilesData = [];
        _earningsData = [];
        RefreshDbSetMocks();

        var request = new DriverPayoutRequestDto(Amount: 100m);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.RequestPayoutAsync(_driverProfileId, request));
        Assert.Equal("Driver profile not found.", ex.Message);
    }

    [Fact]
    public async Task RequestPayoutAsync_ThrowsWhenPaymentInfoNotSetUp()
    {
        // Arrange
        _driverProfilesData = [new DriverProfile { Id = _driverProfileId, PaymentInfo = null }];
        _earningsData = [];
        RefreshDbSetMocks();

        var request = new DriverPayoutRequestDto(Amount: 100m);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.RequestPayoutAsync(_driverProfileId, request));
        Assert.Equal("Payout information is not verified.", ex.Message);
    }

    [Fact]
    public async Task RequestPayoutAsync_ThrowsWhenWalletNotVerified()
    {
        // Arrange
        var driver = new DriverProfile { Id = _driverProfileId };
        driver.PaymentInfo = new DriverPaymentInfo { IsVerified = false };
        _driverProfilesData = [driver];
        _earningsData = [];
        RefreshDbSetMocks();

        var request = new DriverPayoutRequestDto(Amount: 100m);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.RequestPayoutAsync(_driverProfileId, request));
        Assert.Equal("Payout information is not verified.", ex.Message);
    }

    [Fact]
    public async Task RequestPayoutAsync_ThrowsWhenAmountBelowOrEqualToZero()
    {
        // Arrange
        var driver = new DriverProfile { Id = _driverProfileId };
        driver.PaymentInfo = new DriverPaymentInfo { IsVerified = true };
        _driverProfilesData = [driver];
        _earningsData =
        [
            CreateEarning(netEarning: 200m, status: DriverEarningStatus.Available),
        ];
        RefreshDbSetMocks();

        var request = new DriverPayoutRequestDto(Amount: -10m);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.RequestPayoutAsync(_driverProfileId, request));
        Assert.Equal("Payout amount must be positive.", ex.Message);
    }

    [Fact]
    public async Task RequestPayoutAsync_ThrowsWhenAmountExceedsAvailableBalance()
    {
        // Arrange
        var driver = new DriverProfile { Id = _driverProfileId };
        driver.PaymentInfo = new DriverPaymentInfo { IsVerified = true };
        _driverProfilesData = [driver];
        _earningsData =
        [
            CreateEarning(netEarning: 100m, status: DriverEarningStatus.Available),
        ];
        RefreshDbSetMocks();

        var request = new DriverPayoutRequestDto(Amount: 200m);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.RequestPayoutAsync(_driverProfileId, request));
        Assert.Equal("Requested amount exceeds available balance.", ex.Message);
    }

    [Fact]
    public async Task RequestPayoutAsync_ThrowsWhenAmountBelowMinimumPayout()
    {
        // Arrange
        var driver = new DriverProfile { Id = _driverProfileId };
        driver.PaymentInfo = new DriverPaymentInfo { IsVerified = true };
        _driverProfilesData = [driver];
        _earningsData =
        [
            CreateEarning(netEarning: 200m, status: DriverEarningStatus.Available),
        ];
        RefreshDbSetMocks();

        var request = new DriverPayoutRequestDto(Amount: 10m);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.RequestPayoutAsync(_driverProfileId, request));
        Assert.Equal("Requested amount is below the minimum payout threshold.", ex.Message);
    }

    [Fact]
    public async Task RequestPayoutAsync_CreatesPayoutAndLinksAvailableEarnings()
    {
        // Arrange
        var driver = new DriverProfile { Id = _driverProfileId };
        driver.PaymentInfo = new DriverPaymentInfo { IsVerified = true };
        _driverProfilesData = [driver];
        _earningsData =
        [
            CreateEarning(netEarning: 60m, status: DriverEarningStatus.Available, earnedAt: new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)),
            CreateEarning(netEarning: 40m, status: DriverEarningStatus.Available, earnedAt: new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc)),
        ];
        RefreshDbSetMocks();

        _payoutsDbSetMock
            .Setup(s => s.AddAsync(It.IsAny<DriverPayout>(), It.IsAny<CancellationToken>()))
            .Callback<DriverPayout, CancellationToken>((p, _) => _payoutsData.Add(p))
            .Returns((DriverPayout p, CancellationToken _) => new ValueTask<EntityEntry<DriverPayout>>());

        _payoutTransactionsDbSetMock
            .Setup(s => s.AddAsync(It.IsAny<DriverPayoutTransaction>(), It.IsAny<CancellationToken>()))
            .Callback<DriverPayoutTransaction, CancellationToken>((t, _) => _payoutTransactionsData.Add(t))
            .Returns((DriverPayoutTransaction t, CancellationToken _) => new ValueTask<EntityEntry<DriverPayoutTransaction>>());

        var request = new DriverPayoutRequestDto(Amount: 100m);

        // Act
        var result = await _service.RequestPayoutAsync(_driverProfileId, request);

        // Assert
        Assert.Equal(100m, result.Amount);
        Assert.Equal(DriverPayoutStatus.Requested, result.Status);
        Assert.Equal(DriverEarningStatus.PendingPayout, _earningsData[0].Status);
        Assert.Equal(DriverEarningStatus.PendingPayout, _earningsData[1].Status);
        Assert.Equal(_earningsData[0].PayoutId, _earningsData[1].PayoutId);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task RequestPayoutAsync_SetsLinkedEarningsStatusToPendingPayout()
    {
        // Arrange
        var driver = new DriverProfile { Id = _driverProfileId };
        driver.PaymentInfo = new DriverPaymentInfo { IsVerified = true };
        _driverProfilesData = [driver];

        var earning1 = CreateEarning(netEarning: 70m, status: DriverEarningStatus.Available, earnedAt: new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        var earning2 = CreateEarning(netEarning: 30m, status: DriverEarningStatus.Available, earnedAt: new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc));
        var paidEarning = CreateEarning(netEarning: 50m, status: DriverEarningStatus.Paid);
        _earningsData = [earning1, earning2, paidEarning];
        RefreshDbSetMocks();

        _payoutsDbSetMock
            .Setup(s => s.AddAsync(It.IsAny<DriverPayout>(), It.IsAny<CancellationToken>()))
            .Callback<DriverPayout, CancellationToken>((p, _) => _payoutsData.Add(p))
            .Returns((DriverPayout p, CancellationToken _) => new ValueTask<EntityEntry<DriverPayout>>());

        _payoutTransactionsDbSetMock
            .Setup(s => s.AddAsync(It.IsAny<DriverPayoutTransaction>(), It.IsAny<CancellationToken>()))
            .Callback<DriverPayoutTransaction, CancellationToken>((t, _) => _payoutTransactionsData.Add(t))
            .Returns((DriverPayoutTransaction t, CancellationToken _) => new ValueTask<EntityEntry<DriverPayoutTransaction>>());

        var request = new DriverPayoutRequestDto(Amount: 70m);

        // Act
        await _service.RequestPayoutAsync(_driverProfileId, request);

        // Assert
        Assert.Equal(DriverEarningStatus.PendingPayout, earning1.Status);
        Assert.NotNull(earning1.PayoutId);
        Assert.Equal(DriverEarningStatus.Available, earning2.Status);
        Assert.Null(earning2.PayoutId);
        Assert.Equal(DriverEarningStatus.Paid, paidEarning.Status);
    }

    #endregion

    #region GetPayoutHistoryAsync Tests

    [Fact]
    public async Task GetPayoutHistoryAsync_ReturnsPayoutsForDriver()
    {
        // Arrange
        _payoutsData =
        [
            new DriverPayout
            {
                Id = Guid.NewGuid(),
                DriverProfileId = _driverProfileId,
                Amount = 100m,
                Status = DriverPayoutStatus.Requested,
                RequestedAt = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new DriverPayout
            {
                Id = Guid.NewGuid(),
                DriverProfileId = _driverProfileId,
                Amount = 200m,
                Status = DriverPayoutStatus.Completed,
                RequestedAt = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
                ProcessedAt = new DateTime(2026, 5, 3, 0, 0, 0, DateTimeKind.Utc)
            },
        ];
        RefreshDbSetMocks();

        // Act
        var result = await _service.GetPayoutHistoryAsync(_driverProfileId);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Equal(100m, result[0].Amount);
    }

    #endregion

    #region GetEarningsCountAsync Tests

    [Fact]
    public async Task GetEarningsCountAsync_ReturnsCorrectCount()
    {
        // Arrange
        _earningsData =
        [
            CreateEarning(driverProfileId: _driverProfileId),
            CreateEarning(driverProfileId: _driverProfileId),
            CreateEarning(driverProfileId: _driverProfileId),
        ];
        RefreshDbSetMocks();

        // Act
        var result = await _service.GetEarningsCountAsync(_driverProfileId);

        // Assert
        Assert.Equal(3, result);
    }

    #endregion

    #region CreateEarningForBookingAsync Tests

    [Fact]
    public async Task CreateEarningForBookingAsync_CalculatesCommissionCorrectly()
    {
        // Arrange
        var driverProfileId = Guid.NewGuid();
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            AssignedDriverProfileId = driverProfileId,
            DriverFee = 100m
        };

        _earningsData = [];
        RefreshDbSetMocks();

        _earningsDbSetMock
            .Setup(s => s.AddAsync(It.IsAny<DriverEarning>(), It.IsAny<CancellationToken>()))
            .Callback<DriverEarning, CancellationToken>((e, _) => { e.Id = Guid.NewGuid(); _earningsData.Add(e); })
            .Returns((DriverEarning e, CancellationToken _) => new ValueTask<EntityEntry<DriverEarning>>());

        // Act
        var result = await _service.CreateEarningForBookingAsync(booking);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(100m, result.GrossEarning);
        Assert.Equal(15m, result.PlatformDeduction);
        Assert.Equal(85m, result.NetEarning);
    }

    [Fact]
    public async Task CreateEarningForBookingAsync_CreatesWithAvailableStatus()
    {
        // Arrange
        var driverProfileId = Guid.NewGuid();
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            AssignedDriverProfileId = driverProfileId,
            DriverFee = 200m
        };

        _earningsData = [];
        RefreshDbSetMocks();

        _earningsDbSetMock
            .Setup(s => s.AddAsync(It.IsAny<DriverEarning>(), It.IsAny<CancellationToken>()))
            .Callback<DriverEarning, CancellationToken>((e, _) => { e.Id = Guid.NewGuid(); _earningsData.Add(e); })
            .Returns((DriverEarning e, CancellationToken _) => new ValueTask<EntityEntry<DriverEarning>>());

        // Act
        var result = await _service.CreateEarningForBookingAsync(booking);

        // Assert
        Assert.Equal(DriverEarningStatus.Available, result.Status);
    }

    [Fact]
    public async Task CreateEarningForBookingAsync_ReturnsExistingEarning_WhenOneAlreadyExists()
    {
        // Arrange
        var driverProfileId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var existingEarning = CreateEarning(bookingId: bookingId, driverProfileId: driverProfileId, netEarning: 85m);
        _earningsData = [existingEarning];
        RefreshDbSetMocks();

        var booking = new Booking
        {
            Id = bookingId,
            AssignedDriverProfileId = driverProfileId,
            DriverFee = 200m
        };

        // Act
        var result = await _service.CreateEarningForBookingAsync(booking);

        // Assert
        Assert.Equal(existingEarning.Id, result.Id);
        _contextMock.Verify(x => x.DriverEarnings.AddAsync(It.IsAny<DriverEarning>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateEarningForBookingAsync_ThrowsWhenNoAssignedDriver()
    {
        // Arrange
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            AssignedDriverProfileId = null,
            DriverFee = 100m
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CreateEarningForBookingAsync(booking));
        Assert.Equal("Booking has no assigned driver.", ex.Message);
    }

    #endregion

    #region ReverseEarningForBookingAsync Tests

    [Fact]
    public async Task ReverseEarningForBookingAsync_ReversesAvailableEarning()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var earning = CreateEarning(bookingId: bookingId, status: DriverEarningStatus.Available);
        _earningsData = [earning];
        RefreshDbSetMocks();

        // Act
        await _service.ReverseEarningForBookingAsync(bookingId);

        // Assert
        Assert.Equal(DriverEarningStatus.Reversed, earning.Status);
        Assert.NotNull(earning.ReversedAt);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ReverseEarningForBookingAsync_DoesNotReversePaidEarning()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var earning = CreateEarning(bookingId: bookingId, status: DriverEarningStatus.Paid);
        _earningsData = [earning];
        RefreshDbSetMocks();

        // Act
        await _service.ReverseEarningForBookingAsync(bookingId);

        // Assert
        Assert.Equal(DriverEarningStatus.Paid, earning.Status);
        Assert.Null(earning.ReversedAt);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ReverseEarningForBookingAsync_MarksLinkedPayoutAsFailed_WhenReversingPendingPayout()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var payoutId = Guid.NewGuid();
        var payout = new DriverPayout
        {
            Id = payoutId,
            DriverProfileId = _driverProfileId,
            Amount = 100m,
            Status = DriverPayoutStatus.Requested
        };
        var earning = CreateEarning(bookingId: bookingId, status: DriverEarningStatus.PendingPayout, payoutId: payoutId);
        _earningsData = [earning];
        _payoutsData = [payout];
        RefreshDbSetMocks();

        // Act
        await _service.ReverseEarningForBookingAsync(bookingId);

        // Assert
        Assert.Equal(DriverEarningStatus.Reversed, earning.Status);
        Assert.Equal(DriverPayoutStatus.Failed, payout.Status);
        Assert.Equal("Booking was cancelled while payout was pending.", payout.FailureReason);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ReverseEarningForBookingAsync_DoesNothingForAlreadyReversedEarning()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var earning = CreateEarning(bookingId: bookingId, status: DriverEarningStatus.Reversed);
        _earningsData = [earning];
        RefreshDbSetMocks();

        // Act
        await _service.ReverseEarningForBookingAsync(bookingId);

        // Assert
        Assert.Equal(DriverEarningStatus.Reversed, earning.Status);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ReverseEarningForBookingAsync_DoesNothingWhenNoEarningExists()
    {
        // Arrange
        _earningsData = [];
        RefreshDbSetMocks();

        // Act
        await _service.ReverseEarningForBookingAsync(Guid.NewGuid());

        // Assert
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion
}
