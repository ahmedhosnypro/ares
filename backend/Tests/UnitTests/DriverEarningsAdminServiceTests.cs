using Backend.Application.DTOs.Earnings;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Tests.TestUtilities;
using Microsoft.Extensions.Logging;
using Moq;

namespace Backend.Tests.UnitTests;

public class DriverEarningsAdminServiceTests
{
    private readonly Mock<IApplicationDbContext> _contextMock;
    private readonly Mock<IPaymobClient> _paymobMock;
    private readonly Mock<IDriverNotificationService> _notificationMock;
    private readonly Mock<ILogger<DriverEarningsAdminService>> _loggerMock;
    private readonly DriverEarningsAdminService _sut;

    private readonly Guid _driverProfileId = Guid.NewGuid();
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _adminUserId = Guid.NewGuid();

    public DriverEarningsAdminServiceTests()
    {
        _contextMock = new Mock<IApplicationDbContext>();
        _paymobMock = new Mock<IPaymobClient>();
        _notificationMock = new Mock<IDriverNotificationService>();
        _loggerMock = new Mock<ILogger<DriverEarningsAdminService>>();

        _sut = new DriverEarningsAdminService(
            _contextMock.Object,
            _paymobMock.Object,
            _notificationMock.Object,
            _loggerMock.Object);
    }

    private DriverProfile CreateDriverProfile(bool withPaymentInfo = false, bool walletVerified = false)
    {
        return new DriverProfile
        {
            Id = _driverProfileId,
            UserId = _userId,
            IsActive = true,
            Status = DriverProfileStatus.Verified,
            User = new ApplicationUser
            {
                Id = _userId,
                FirstName = "Test",
                LastName = "Driver",
                ProfileImage = "https://img.test/pic.png"
            },
            PaymentInfo = withPaymentInfo
                ? new DriverPaymentInfo
                {
                    Id = Guid.NewGuid(),
                    DriverProfileId = _driverProfileId,
                    WalletPhoneNumber = "+201000000000",
                    IsVerified = walletVerified
                }
                : null
        };
    }

    private List<DriverEarning> CreateEarnings(params (DriverEarningStatus Status, decimal NetEarning)[] items)
    {
        return items.Select((item, i) => new DriverEarning
        {
            Id = Guid.NewGuid(),
            DriverProfileId = _driverProfileId,
            BookingId = Guid.NewGuid(),
            Status = item.Status,
            NetEarning = item.NetEarning,
            GrossEarning = item.NetEarning + 5m,
            PlatformDeduction = 5m,
            EarnedAt = DateTime.UtcNow.AddDays(-i)
        }).ToList();
    }

    #region GetDriverEarningsOverviewAsync

    [Fact]
    public async Task GetDriverEarningsOverviewAsync_ReturnsCorrectAggregates()
    {
        #region Arrange
        var driver = CreateDriverProfile(withPaymentInfo: true, walletVerified: true);
        var drivers = new List<DriverProfile> { driver }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);

        var earnings = CreateEarnings(
            (DriverEarningStatus.Available, 100m),
            (DriverEarningStatus.PendingPayout, 200m),
            (DriverEarningStatus.Paid, 300m),
            (DriverEarningStatus.Reversed, 999m)
        );
        var earningsMock = earnings.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverEarnings).Returns(earningsMock.Object);
        #endregion

        #region Act
        var result = await _sut.GetDriverEarningsOverviewAsync(_driverProfileId);
        #endregion

        #region Assert
        Assert.Equal(_driverProfileId, result.DriverProfileId);
        Assert.Equal("Test Driver", result.DriverName);
        Assert.Equal("https://img.test/pic.png", result.ProfilePictureUrl);
        Assert.Equal(600m, result.TotalEarnings);
        Assert.Equal(100m, result.AvailableBalance);
        Assert.Equal(200m, result.PendingPayoutAmount);
        Assert.Equal(300m, result.PaidOutAmount);
        Assert.Equal(3, result.CompletedTripsCount);
        Assert.True(result.HasPaymentInfo);
        Assert.True(result.IsWalletVerified);
        #endregion
    }

    [Fact]
    public async Task GetDriverEarningsOverviewAsync_ReturnsZerosForDriverWithNoEarnings()
    {
        #region Arrange
        var driver = CreateDriverProfile(withPaymentInfo: false, walletVerified: false);
        var drivers = new List<DriverProfile> { driver }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);

        var earningsMock = new List<DriverEarning>().AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverEarnings).Returns(earningsMock.Object);
        #endregion

        #region Act
        var result = await _sut.GetDriverEarningsOverviewAsync(_driverProfileId);
        #endregion

        #region Assert
        Assert.Equal(0m, result.TotalEarnings);
        Assert.Equal(0m, result.AvailableBalance);
        Assert.Equal(0m, result.PendingPayoutAmount);
        Assert.Equal(0m, result.PaidOutAmount);
        Assert.Equal(0, result.CompletedTripsCount);
        #endregion
    }

    [Fact]
    public async Task GetDriverEarningsOverviewAsync_ShowsHasPaymentInfoAndIsWalletVerifiedCorrectly()
    {
        #region Arrange
        var driver = CreateDriverProfile(withPaymentInfo: true, walletVerified: false);
        var drivers = new List<DriverProfile> { driver }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);

        var earningsMock = new List<DriverEarning>().AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverEarnings).Returns(earningsMock.Object);
        #endregion

        #region Act
        var result = await _sut.GetDriverEarningsOverviewAsync(_driverProfileId);
        #endregion

        #region Assert
        Assert.True(result.HasPaymentInfo);
        Assert.False(result.IsWalletVerified);
        #endregion
    }

    [Fact]
    public async Task GetDriverEarningsOverviewAsync_ThrowsWhenDriverNotFound()
    {
        #region Arrange
        var drivers = new List<DriverProfile>().AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);
        #endregion

        #region Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.GetDriverEarningsOverviewAsync(Guid.NewGuid()));
        #endregion
    }

    #endregion

    #region GetPendingPayoutsAsync

    [Fact]
    public async Task GetPendingPayoutsAsync_ReturnsOnlyPayoutsWithRequestedStatus()
    {
        #region Arrange
        var driver = CreateDriverProfile(withPaymentInfo: true, walletVerified: true);
        var requestedPayout = new DriverPayout
        {
            Id = Guid.NewGuid(),
            DriverProfileId = _driverProfileId,
            Amount = 150m,
            Status = DriverPayoutStatus.Requested,
            RequestedAt = DateTime.UtcNow,
            DriverProfile = driver
        };
        var completedPayout = new DriverPayout
        {
            Id = Guid.NewGuid(),
            DriverProfileId = _driverProfileId,
            Amount = 200m,
            Status = DriverPayoutStatus.Completed,
            RequestedAt = DateTime.UtcNow,
            DriverProfile = driver
        };
        var payouts = new List<DriverPayout> { requestedPayout, completedPayout }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPayouts).Returns(payouts.Object);
        #endregion

        #region Act
        var result = await _sut.GetPendingPayoutsAsync();
        #endregion

        #region Assert
        Assert.Single(result);
        Assert.Equal(requestedPayout.Id, result[0].PayoutId);
        Assert.Equal("Requested", result[0].Status);
        Assert.Equal(150m, result[0].Amount);
        #endregion
    }

    [Fact]
    public async Task GetPendingPayoutsAsync_ReturnsEmptyListWhenNoPendingPayouts()
    {
        #region Arrange
        var payouts = new List<DriverPayout>().AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPayouts).Returns(payouts.Object);
        #endregion

        #region Act
        var result = await _sut.GetPendingPayoutsAsync();
        #endregion

        #region Assert
        Assert.Empty(result);
        #endregion
    }

    #endregion

    #region GetPendingVerificationAsync

    [Fact]
    public async Task GetPendingVerificationAsync_ReturnsOnlyUnverifiedPaymentInfoRecords()
    {
        #region Arrange
        var driver = CreateDriverProfile(withPaymentInfo: true, walletVerified: false);
        var unverified = new DriverPaymentInfo
        {
            Id = Guid.NewGuid(),
            DriverProfileId = _driverProfileId,
            WalletPhoneNumber = "+201000000000",
            IsVerified = false,
            CreatedAt = DateTime.UtcNow,
            DriverProfile = driver
        };
        var verified = new DriverPaymentInfo
        {
            Id = Guid.NewGuid(),
            DriverProfileId = Guid.NewGuid(),
            WalletPhoneNumber = "+201111111111",
            IsVerified = true,
            CreatedAt = DateTime.UtcNow
        };
        var paymentInfos = new List<DriverPaymentInfo> { unverified, verified }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPaymentInfo).Returns(paymentInfos.Object);
        #endregion

        #region Act
        var result = await _sut.GetPendingVerificationAsync();
        #endregion

        #region Assert
        Assert.Single(result);
        Assert.Equal(_driverProfileId, result[0].DriverProfileId);
        Assert.Equal("PendingVerification", result[0].Status);
        Assert.False(result[0].IsWalletVerified);
        Assert.Equal("+201000000000", result[0].WalletPhoneNumber);
        #endregion
    }

    [Fact]
    public async Task GetPendingVerificationAsync_ReturnsEmptyListWhenAllVerified()
    {
        #region Arrange
        var verified = new DriverPaymentInfo
        {
            Id = Guid.NewGuid(),
            DriverProfileId = Guid.NewGuid(),
            WalletPhoneNumber = "+201000000000",
            IsVerified = true,
            CreatedAt = DateTime.UtcNow
        };
        var paymentInfos = new List<DriverPaymentInfo> { verified }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPaymentInfo).Returns(paymentInfos.Object);
        #endregion

        #region Act
        var result = await _sut.GetPendingVerificationAsync();
        #endregion

        #region Assert
        Assert.Empty(result);
        #endregion
    }

    #endregion

    #region ApprovePayoutAsync

    [Fact]
    public async Task ApprovePayoutAsync_ThrowsWhenPayoutNotFound()
    {
        #region Arrange
        var payouts = new List<DriverPayout>().AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPayouts).Returns(payouts.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        #endregion

        #region Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.ApprovePayoutAsync(Guid.NewGuid(), _adminUserId));
        Assert.Contains("not found", ex.Message);
        #endregion
    }

    [Fact]
    public async Task ApprovePayoutAsync_ThrowsWhenPayoutNotInRequestedStatus()
    {
        #region Arrange
        var payout = new DriverPayout
        {
            Id = Guid.NewGuid(),
            DriverProfileId = _driverProfileId,
            Amount = 100m,
            Status = DriverPayoutStatus.Completed
        };
        var payouts = new List<DriverPayout> { payout }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPayouts).Returns(payouts.Object);
        #endregion

        #region Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.ApprovePayoutAsync(payout.Id, _adminUserId));
        Assert.Contains("not in Requested status", ex.Message);
        #endregion
    }

    [Fact]
    public async Task ApprovePayoutAsync_ThrowsWhenConcurrentApprovalDetected()
    {
        #region Arrange
        var payoutId = Guid.NewGuid();
        var payout = new DriverPayout
        {
            Id = payoutId,
            DriverProfileId = _driverProfileId,
            Amount = 100m,
            Status = DriverPayoutStatus.Requested
        };
        var trackedPayouts = new List<DriverPayout> { payout }.AsQueryable().BuildMockDbSet();

        var concurrentPayout = new DriverPayout
        {
            Id = payoutId,
            Status = DriverPayoutStatus.Processing
        };
        var freshPayouts = new List<DriverPayout> { concurrentPayout }.AsQueryable().BuildMockDbSet();
        _contextMock.SetupSequence(c => c.DriverPayouts)
            .Returns(trackedPayouts.Object)
            .Returns(freshPayouts.Object);
        #endregion

        #region Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.ApprovePayoutAsync(payoutId, _adminUserId));
        Assert.Contains("no longer in Requested status", ex.Message);
        #endregion
    }

    [Fact]
    public async Task ApprovePayoutAsync_OnPaymobSuccess_MarksCompletedAndEarningsPaid()
    {
        #region Arrange
        var payoutId = Guid.NewGuid();
        var payout = new DriverPayout
        {
            Id = payoutId,
            DriverProfileId = _driverProfileId,
            Amount = 100m,
            Status = DriverPayoutStatus.Requested
        };
        var payoutsWithSame = new List<DriverPayout> { payout }.AsQueryable().BuildMockDbSet();

        var driver = CreateDriverProfile(withPaymentInfo: true, walletVerified: true);
        var drivers = new List<DriverProfile> { driver }.AsQueryable().BuildMockDbSet();

        var earning1 = new DriverEarning
        {
            Id = Guid.NewGuid(),
            DriverProfileId = _driverProfileId,
            PayoutId = payoutId,
            Status = DriverEarningStatus.PendingPayout,
            NetEarning = 60m,
            GrossEarning = 70m,
            PlatformDeduction = 10m,
            BookingId = Guid.NewGuid(),
            EarnedAt = DateTime.UtcNow
        };
        var earning2 = new DriverEarning
        {
            Id = Guid.NewGuid(),
            DriverProfileId = _driverProfileId,
            PayoutId = payoutId,
            Status = DriverEarningStatus.PendingPayout,
            NetEarning = 40m,
            GrossEarning = 50m,
            PlatformDeduction = 10m,
            BookingId = Guid.NewGuid(),
            EarnedAt = DateTime.UtcNow
        };
        var earnings = new List<DriverEarning> { earning1, earning2 }.AsQueryable().BuildMockDbSet();

        var paymentInfoList = new List<DriverPaymentInfo> { driver.PaymentInfo! }.AsQueryable().BuildMockDbSet();

        _contextMock.SetupSequence(c => c.DriverPayouts)
            .Returns(payoutsWithSame.Object)
            .Returns(payoutsWithSame.Object)
            .Returns(payoutsWithSame.Object);
        _contextMock.Setup(c => c.DriverPaymentInfo).Returns(paymentInfoList.Object);
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);
        _contextMock.Setup(c => c.DriverEarnings).Returns(earnings.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _paymobMock.Setup(p => p.GetAuthTokenAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync("auth-token");
        _paymobMock.Setup(p => p.CreateDisbursementAsync(
                It.IsAny<string>(), It.IsAny<long>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymobDisbursementResult(12345L, true, null));
        #endregion

        #region Act
        await _sut.ApprovePayoutAsync(payoutId, _adminUserId);
        #endregion

        #region Assert
        Assert.Equal(DriverPayoutStatus.Completed, payout.Status);
        Assert.Equal("12345", payout.PaymobTransactionId);
        Assert.Equal(12345L, payout.PaymobPayoutId);
        Assert.Equal(_adminUserId, payout.ReviewedBy);
        Assert.NotNull(payout.ProcessedAt);
        Assert.Null(payout.FailureReason);
        Assert.Equal(DriverEarningStatus.Paid, earning1.Status);
        Assert.Equal(DriverEarningStatus.Paid, earning2.Status);
        _notificationMock.Verify(n => n.NotifyDriverPayoutCompletedAsync(
            _userId, 100m, It.IsAny<CancellationToken>()), Times.Once);
        #endregion
    }

    [Fact]
    public async Task ApprovePayoutAsync_OnPaymobFailure_MarksFailedAndRevertsEarnings()
    {
        #region Arrange
        var payoutId = Guid.NewGuid();
        var payout = new DriverPayout
        {
            Id = payoutId,
            DriverProfileId = _driverProfileId,
            Amount = 100m,
            Status = DriverPayoutStatus.Requested
        };
        var payoutsWithSame = new List<DriverPayout> { payout }.AsQueryable().BuildMockDbSet();

        var driver = CreateDriverProfile(withPaymentInfo: true, walletVerified: true);
        var drivers = new List<DriverProfile> { driver }.AsQueryable().BuildMockDbSet();

        var earning = new DriverEarning
        {
            Id = Guid.NewGuid(),
            DriverProfileId = _driverProfileId,
            PayoutId = payoutId,
            Status = DriverEarningStatus.PendingPayout,
            NetEarning = 100m,
            GrossEarning = 120m,
            PlatformDeduction = 20m,
            BookingId = Guid.NewGuid(),
            EarnedAt = DateTime.UtcNow
        };
        var earnings = new List<DriverEarning> { earning }.AsQueryable().BuildMockDbSet();

        var paymentInfoList = new List<DriverPaymentInfo> { driver.PaymentInfo! }.AsQueryable().BuildMockDbSet();

        _contextMock.SetupSequence(c => c.DriverPayouts)
            .Returns(payoutsWithSame.Object)
            .Returns(payoutsWithSame.Object)
            .Returns(payoutsWithSame.Object);
        _contextMock.Setup(c => c.DriverPaymentInfo).Returns(paymentInfoList.Object);
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);
        _contextMock.Setup(c => c.DriverEarnings).Returns(earnings.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _paymobMock.Setup(p => p.GetAuthTokenAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync("auth-token");
        _paymobMock.Setup(p => p.CreateDisbursementAsync(
                It.IsAny<string>(), It.IsAny<long>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymobDisbursementResult(0L, false, "Insufficient funds"));
        #endregion

        #region Act
        await _sut.ApprovePayoutAsync(payoutId, _adminUserId);
        #endregion

        #region Assert
        Assert.Equal(DriverPayoutStatus.Failed, payout.Status);
        Assert.Equal("Insufficient funds", payout.FailureReason);
        Assert.Equal(DriverEarningStatus.Available, earning.Status);
        Assert.Null(earning.PayoutId);
        #endregion
    }

    [Fact]
    public async Task ApprovePayoutAsync_OnPaymobException_MarksFailedAndRevertsEarnings()
    {
        #region Arrange
        var payoutId = Guid.NewGuid();
        var payout = new DriverPayout
        {
            Id = payoutId,
            DriverProfileId = _driverProfileId,
            Amount = 100m,
            Status = DriverPayoutStatus.Requested
        };
        var payoutsWithSame = new List<DriverPayout> { payout }.AsQueryable().BuildMockDbSet();

        var driver = CreateDriverProfile(withPaymentInfo: true, walletVerified: true);
        var drivers = new List<DriverProfile> { driver }.AsQueryable().BuildMockDbSet();

        var earning = new DriverEarning
        {
            Id = Guid.NewGuid(),
            DriverProfileId = _driverProfileId,
            PayoutId = payoutId,
            Status = DriverEarningStatus.PendingPayout,
            NetEarning = 100m,
            GrossEarning = 120m,
            PlatformDeduction = 20m,
            BookingId = Guid.NewGuid(),
            EarnedAt = DateTime.UtcNow
        };
        var earnings = new List<DriverEarning> { earning }.AsQueryable().BuildMockDbSet();

        var paymentInfoList = new List<DriverPaymentInfo> { driver.PaymentInfo! }.AsQueryable().BuildMockDbSet();

        _contextMock.SetupSequence(c => c.DriverPayouts)
            .Returns(payoutsWithSame.Object)
            .Returns(payoutsWithSame.Object)
            .Returns(payoutsWithSame.Object);
        _contextMock.Setup(c => c.DriverPaymentInfo).Returns(paymentInfoList.Object);
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);
        _contextMock.Setup(c => c.DriverEarnings).Returns(earnings.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _paymobMock.Setup(p => p.GetAuthTokenAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("Network error"));
        #endregion

        #region Act
        await _sut.ApprovePayoutAsync(payoutId, _adminUserId);
        #endregion

        #region Assert
        Assert.Equal(DriverPayoutStatus.Failed, payout.Status);
        Assert.Equal("Network error", payout.FailureReason);
        Assert.Equal(DriverEarningStatus.Available, earning.Status);
        Assert.Null(earning.PayoutId);
        #endregion
    }

    [Fact]
    public async Task ApprovePayoutAsync_SendsPayoutCompletedNotificationOnSuccess()
    {
        #region Arrange
        var payoutId = Guid.NewGuid();
        var payout = new DriverPayout
        {
            Id = payoutId,
            DriverProfileId = _driverProfileId,
            Amount = 250m,
            Status = DriverPayoutStatus.Requested
        };
        var payoutsWithSame = new List<DriverPayout> { payout }.AsQueryable().BuildMockDbSet();

        var driver = CreateDriverProfile(withPaymentInfo: true, walletVerified: true);
        var drivers = new List<DriverProfile> { driver }.AsQueryable().BuildMockDbSet();

        var earnings = new List<DriverEarning>().AsQueryable().BuildMockDbSet();
        var paymentInfoList = new List<DriverPaymentInfo> { driver.PaymentInfo! }.AsQueryable().BuildMockDbSet();

        _contextMock.SetupSequence(c => c.DriverPayouts)
            .Returns(payoutsWithSame.Object)
            .Returns(payoutsWithSame.Object)
            .Returns(payoutsWithSame.Object);
        _contextMock.Setup(c => c.DriverPaymentInfo).Returns(paymentInfoList.Object);
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);
        _contextMock.Setup(c => c.DriverEarnings).Returns(earnings.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _paymobMock.Setup(p => p.GetAuthTokenAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync("auth-token");
        _paymobMock.Setup(p => p.CreateDisbursementAsync(
                It.IsAny<string>(), It.IsAny<long>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymobDisbursementResult(999L, true, null));
        #endregion

        #region Act
        await _sut.ApprovePayoutAsync(payoutId, _adminUserId);
        #endregion

        #region Assert
        _notificationMock.Verify(n => n.NotifyDriverPayoutCompletedAsync(
            _userId, 250m, It.IsAny<CancellationToken>()), Times.Once);
        #endregion
    }

    #endregion

    #region RejectPayoutAsync

    [Fact]
    public async Task RejectPayoutAsync_SetsStatusToRejectedWithReason()
    {
        #region Arrange
        var payoutId = Guid.NewGuid();
        var payout = new DriverPayout
        {
            Id = payoutId,
            DriverProfileId = _driverProfileId,
            Amount = 100m,
            Status = DriverPayoutStatus.Requested
        };
        var payouts = new List<DriverPayout> { payout }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPayouts).Returns(payouts.Object);

        var driver = CreateDriverProfile();
        var drivers = new List<DriverProfile> { driver }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);

        var earnings = new List<DriverEarning>().AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverEarnings).Returns(earnings.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        #endregion

        #region Act
        await _sut.RejectPayoutAsync(payoutId, _adminUserId, "Invalid wallet");
        #endregion

        #region Assert
        Assert.Equal(DriverPayoutStatus.Rejected, payout.Status);
        Assert.Equal("Invalid wallet", payout.RejectionReason);
        #endregion
    }

    [Fact]
    public async Task RejectPayoutAsync_RevertsLinkedEarningsToAvailableAndClearsPayoutId()
    {
        #region Arrange
        var payoutId = Guid.NewGuid();
        var payout = new DriverPayout
        {
            Id = payoutId,
            DriverProfileId = _driverProfileId,
            Amount = 100m,
            Status = DriverPayoutStatus.Requested
        };
        var payouts = new List<DriverPayout> { payout }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPayouts).Returns(payouts.Object);

        var driver = CreateDriverProfile();
        var drivers = new List<DriverProfile> { driver }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);

        var earning = new DriverEarning
        {
            Id = Guid.NewGuid(),
            DriverProfileId = _driverProfileId,
            PayoutId = payoutId,
            Status = DriverEarningStatus.PendingPayout,
            NetEarning = 100m,
            GrossEarning = 120m,
            PlatformDeduction = 20m,
            BookingId = Guid.NewGuid(),
            EarnedAt = DateTime.UtcNow
        };
        var earnings = new List<DriverEarning> { earning }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverEarnings).Returns(earnings.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        #endregion

        #region Act
        await _sut.RejectPayoutAsync(payoutId, _adminUserId, "Invalid wallet");
        #endregion

        #region Assert
        Assert.Equal(DriverEarningStatus.Available, earning.Status);
        Assert.Null(earning.PayoutId);
        #endregion
    }

    [Fact]
    public async Task RejectPayoutAsync_SetsReviewedByAndReviewedAt()
    {
        #region Arrange
        var payoutId = Guid.NewGuid();
        var payout = new DriverPayout
        {
            Id = payoutId,
            DriverProfileId = _driverProfileId,
            Amount = 100m,
            Status = DriverPayoutStatus.Requested
        };
        var payouts = new List<DriverPayout> { payout }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPayouts).Returns(payouts.Object);

        var driver = CreateDriverProfile();
        var drivers = new List<DriverProfile> { driver }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);

        var earnings = new List<DriverEarning>().AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverEarnings).Returns(earnings.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        #endregion

        #region Act
        await _sut.RejectPayoutAsync(payoutId, _adminUserId, "Duplicate request");
        #endregion

        #region Assert
        Assert.Equal(_adminUserId, payout.ReviewedBy);
        Assert.NotNull(payout.ReviewedAt);
        #endregion
    }

    [Fact]
    public async Task RejectPayoutAsync_SendsPayoutRejectedNotification()
    {
        #region Arrange
        var payoutId = Guid.NewGuid();
        var payout = new DriverPayout
        {
            Id = payoutId,
            DriverProfileId = _driverProfileId,
            Amount = 100m,
            Status = DriverPayoutStatus.Requested
        };
        var payouts = new List<DriverPayout> { payout }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPayouts).Returns(payouts.Object);

        var driver = CreateDriverProfile();
        var drivers = new List<DriverProfile> { driver }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);

        var earnings = new List<DriverEarning>().AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverEarnings).Returns(earnings.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        #endregion

        #region Act
        await _sut.RejectPayoutAsync(payoutId, _adminUserId, "Invalid wallet");
        #endregion

        #region Assert
        _notificationMock.Verify(n => n.NotifyDriverPayoutRejectedAsync(
            _userId, 100m, "Invalid wallet", It.IsAny<CancellationToken>()), Times.Once);
        #endregion
    }

    #endregion

    #region RetryFailedPayoutAsync

    [Fact]
    public async Task RetryFailedPayoutAsync_ThrowsWhenPayoutNotInFailedStatus()
    {
        #region Arrange
        var payout = new DriverPayout
        {
            Id = Guid.NewGuid(),
            DriverProfileId = _driverProfileId,
            Amount = 100m,
            Status = DriverPayoutStatus.Requested
        };
        var payouts = new List<DriverPayout> { payout }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPayouts).Returns(payouts.Object);
        #endregion

        #region Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.RetryFailedPayoutAsync(payout.Id, _adminUserId));
        Assert.Contains("not in Failed status", ex.Message);
        #endregion
    }

    [Fact]
    public async Task RetryFailedPayoutAsync_OnSuccess_TransitionsToCompleted()
    {
        #region Arrange
        var payoutId = Guid.NewGuid();
        var payout = new DriverPayout
        {
            Id = payoutId,
            DriverProfileId = _driverProfileId,
            Amount = 100m,
            Status = DriverPayoutStatus.Failed,
            FailureReason = "Previous error"
        };
        var payoutsWithSame = new List<DriverPayout> { payout }.AsQueryable().BuildMockDbSet();

        var driver = CreateDriverProfile(withPaymentInfo: true, walletVerified: true);
        var drivers = new List<DriverProfile> { driver }.AsQueryable().BuildMockDbSet();

        var earning = new DriverEarning
        {
            Id = Guid.NewGuid(),
            DriverProfileId = _driverProfileId,
            PayoutId = payoutId,
            Status = DriverEarningStatus.PendingPayout,
            NetEarning = 100m,
            GrossEarning = 120m,
            PlatformDeduction = 20m,
            BookingId = Guid.NewGuid(),
            EarnedAt = DateTime.UtcNow
        };
        var earnings = new List<DriverEarning> { earning }.AsQueryable().BuildMockDbSet();

        var paymentInfoList = new List<DriverPaymentInfo> { driver.PaymentInfo! }.AsQueryable().BuildMockDbSet();

        _contextMock.SetupSequence(c => c.DriverPayouts)
            .Returns(payoutsWithSame.Object)
            .Returns(payoutsWithSame.Object)
            .Returns(payoutsWithSame.Object);
        _contextMock.Setup(c => c.DriverPaymentInfo).Returns(paymentInfoList.Object);
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);
        _contextMock.Setup(c => c.DriverEarnings).Returns(earnings.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _paymobMock.Setup(p => p.GetAuthTokenAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync("auth-token");
        _paymobMock.Setup(p => p.CreateDisbursementAsync(
                It.IsAny<string>(), It.IsAny<long>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymobDisbursementResult(55555L, true, null));
        #endregion

        #region Act
        await _sut.RetryFailedPayoutAsync(payoutId, _adminUserId);
        #endregion

        #region Assert
        Assert.Equal(DriverPayoutStatus.Completed, payout.Status);
        Assert.Equal("55555", payout.PaymobTransactionId);
        Assert.Equal(55555L, payout.PaymobPayoutId);
        Assert.Null(payout.FailureReason);
        Assert.Equal(DriverEarningStatus.Paid, earning.Status);
        #endregion
    }

    [Fact]
    public async Task RetryFailedPayoutAsync_OnFailure_RevertsEarningsToAvailable()
    {
        #region Arrange
        var payoutId = Guid.NewGuid();
        var payout = new DriverPayout
        {
            Id = payoutId,
            DriverProfileId = _driverProfileId,
            Amount = 100m,
            Status = DriverPayoutStatus.Failed
        };
        var payoutsWithSame = new List<DriverPayout> { payout }.AsQueryable().BuildMockDbSet();

        var driver = CreateDriverProfile(withPaymentInfo: true, walletVerified: true);
        var drivers = new List<DriverProfile> { driver }.AsQueryable().BuildMockDbSet();

        var earning = new DriverEarning
        {
            Id = Guid.NewGuid(),
            DriverProfileId = _driverProfileId,
            PayoutId = payoutId,
            Status = DriverEarningStatus.PendingPayout,
            NetEarning = 100m,
            GrossEarning = 120m,
            PlatformDeduction = 20m,
            BookingId = Guid.NewGuid(),
            EarnedAt = DateTime.UtcNow
        };
        var earnings = new List<DriverEarning> { earning }.AsQueryable().BuildMockDbSet();

        var paymentInfoList = new List<DriverPaymentInfo> { driver.PaymentInfo! }.AsQueryable().BuildMockDbSet();

        _contextMock.SetupSequence(c => c.DriverPayouts)
            .Returns(payoutsWithSame.Object)
            .Returns(payoutsWithSame.Object)
            .Returns(payoutsWithSame.Object);
        _contextMock.Setup(c => c.DriverPaymentInfo).Returns(paymentInfoList.Object);
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);
        _contextMock.Setup(c => c.DriverEarnings).Returns(earnings.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        _paymobMock.Setup(p => p.GetAuthTokenAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync("auth-token");
        _paymobMock.Setup(p => p.CreateDisbursementAsync(
                It.IsAny<string>(), It.IsAny<long>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymobDisbursementResult(0L, false, "Bank rejected"));
        #endregion

        #region Act
        await _sut.RetryFailedPayoutAsync(payoutId, _adminUserId);
        #endregion

        #region Assert
        Assert.Equal(DriverPayoutStatus.Failed, payout.Status);
        Assert.Equal("Bank rejected", payout.FailureReason);
        Assert.Equal(DriverEarningStatus.Available, earning.Status);
        Assert.Null(earning.PayoutId);
        #endregion
    }

    #endregion

    #region VerifyWalletInfoAsync

    [Fact]
    public async Task VerifyWalletInfoAsync_SetsIsVerifiedTrue()
    {
        #region Arrange
        var paymentInfo = new DriverPaymentInfo
        {
            Id = Guid.NewGuid(),
            DriverProfileId = _driverProfileId,
            WalletPhoneNumber = "+201000000000",
            IsVerified = false
        };
        var paymentInfos = new List<DriverPaymentInfo> { paymentInfo }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPaymentInfo).Returns(paymentInfos.Object);
        _contextMock.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        #endregion

        #region Act
        await _sut.VerifyWalletInfoAsync(_driverProfileId);
        #endregion

        #region Assert
        Assert.True(paymentInfo.IsVerified);
        _contextMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        #endregion
    }

    [Fact]
    public async Task VerifyWalletInfoAsync_ThrowsWhenPaymentInfoNotFound()
    {
        #region Arrange
        var paymentInfos = new List<DriverPaymentInfo>().AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPaymentInfo).Returns(paymentInfos.Object);
        #endregion

        #region Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.VerifyWalletInfoAsync(Guid.NewGuid()));
        Assert.Contains("Payment info not found", ex.Message);
        #endregion
    }

    #endregion

    #region GetPlatformEarningsSummaryAsync

    [Fact]
    public async Task GetPlatformEarningsSummaryAsync_ReturnsCorrectPlatformWideStatistics()
    {
        #region Arrange
        var earnings = new List<DriverEarning>
        {
            new()
            {
                Id = Guid.NewGuid(), NetEarning = 100m, PlatformDeduction = 20m,
                Status = DriverEarningStatus.Available, DriverProfileId = Guid.NewGuid(),
                BookingId = Guid.NewGuid(), GrossEarning = 120m, EarnedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(), NetEarning = 200m, PlatformDeduction = 40m,
                Status = DriverEarningStatus.Paid, DriverProfileId = Guid.NewGuid(),
                BookingId = Guid.NewGuid(), GrossEarning = 240m, EarnedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(), NetEarning = 999m, PlatformDeduction = 1m,
                Status = DriverEarningStatus.Reversed, DriverProfileId = Guid.NewGuid(),
                BookingId = Guid.NewGuid(), GrossEarning = 1000m, EarnedAt = DateTime.UtcNow
            }
        }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverEarnings).Returns(earnings.Object);

        var payouts = new List<DriverPayout>
        {
            new()
            {
                Id = Guid.NewGuid(), Amount = 150m, Status = DriverPayoutStatus.Completed,
                DriverProfileId = Guid.NewGuid()
            },
            new()
            {
                Id = Guid.NewGuid(), Amount = 75m, Status = DriverPayoutStatus.Requested,
                DriverProfileId = Guid.NewGuid()
            }
        }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPayouts).Returns(payouts.Object);

        var drivers = new List<DriverProfile>
        {
            new()
            {
                Id = Guid.NewGuid(), IsActive = true, Status = DriverProfileStatus.Verified,
                UserId = Guid.NewGuid()
            },
            new()
            {
                Id = Guid.NewGuid(), IsActive = true, Status = DriverProfileStatus.Incomplete,
                UserId = Guid.NewGuid()
            },
            new()
            {
                Id = Guid.NewGuid(), IsActive = false, Status = DriverProfileStatus.Verified,
                UserId = Guid.NewGuid()
            }
        }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverProfiles).Returns(drivers.Object);

        var paymentInfos = new List<DriverPaymentInfo>
        {
            new() { Id = Guid.NewGuid(), DriverProfileId = Guid.NewGuid(), IsVerified = true },
            new() { Id = Guid.NewGuid(), DriverProfileId = Guid.NewGuid(), IsVerified = false }
        }.AsQueryable().BuildMockDbSet();
        _contextMock.Setup(c => c.DriverPaymentInfo).Returns(paymentInfos.Object);
        #endregion

        #region Act
        var result = await _sut.GetPlatformEarningsSummaryAsync();
        #endregion

        #region Assert
        Assert.Equal(300m, result.TotalDriverEarnings);
        Assert.Equal(60m, result.TotalPlatformDeduction);
        Assert.Equal(150m, result.TotalPayoutsCompleted);
        Assert.Equal(75m, result.TotalPendingPayouts);
        Assert.Equal(1, result.TotalActiveDrivers);
        Assert.Equal(1, result.PendingPayoutRequests);
        Assert.Equal(1, result.PendingWalletVerifications);
        #endregion
    }

    #endregion
}
