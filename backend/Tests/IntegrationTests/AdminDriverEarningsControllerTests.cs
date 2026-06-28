using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Backend.Api.Controllers;
using Backend.Application.DTOs.Earnings;
using Backend.Application.Interfaces;
using Backend.Domain.Entities.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Backend.Tests.IntegrationTests;

public class AdminDriverEarningsControllerTests : IDisposable
{
    private readonly Mock<IDriverEarningsAdminService> _serviceMock;
    private readonly Mock<ILogger<AdminDriverEarningsController>> _loggerMock;
    private readonly AdminDriverEarningsController _controller;
    private readonly Guid _adminId = Guid.NewGuid();

    public AdminDriverEarningsControllerTests()
    {
        _serviceMock = new Mock<IDriverEarningsAdminService>();
        _loggerMock = new Mock<ILogger<AdminDriverEarningsController>>();
        _controller = new AdminDriverEarningsController(_serviceMock.Object, _loggerMock.Object);

        var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
        {
            new Claim(ClaimTypes.NameIdentifier, _adminId.ToString()),
            new Claim(ClaimTypes.Role, "Admin")
        }, "mock"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
    }

    [Fact]
    public async Task GetOverview_Returns200WithOverviewDto()
    {
        var driverProfileId = Guid.NewGuid();
        var overview = new AdminDriverEarningsOverviewDto(
            DriverProfileId: driverProfileId,
            DriverName: "John Doe",
            ProfilePictureUrl: null,
            TotalEarnings: 5000m,
            AvailableBalance: 300m,
            PendingPayoutAmount: 100m,
            PaidOutAmount: 4600m,
            CompletedTripsCount: 42,
            HasPaymentInfo: true,
            IsWalletVerified: true
        );
        _serviceMock.Setup(s => s.GetDriverEarningsOverviewAsync(driverProfileId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(overview);

        var result = await _controller.GetOverview(driverProfileId, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<AdminDriverEarningsOverviewDto>(ok.Value);
        Assert.Equal(driverProfileId, returned.DriverProfileId);
        Assert.Equal(5000m, returned.TotalEarnings);
    }

    [Fact]
    public async Task GetPendingPayouts_Returns200WithPendingPayouts()
    {
        var payouts = new List<AdminDriverPayoutListItemDto>
        {
            new(Guid.NewGuid(), Guid.NewGuid(), "Jane Driver", 500m, "Requested",
                DateTime.UtcNow, null, null, null, null, "01012345678", true)
        }.AsReadOnly();
        _serviceMock.Setup(s => s.GetPendingPayoutsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(payouts);

        var result = await _controller.GetPendingPayouts(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<AdminDriverPayoutListItemDto>>(ok.Value);
        Assert.Single(returned);
    }

    [Fact]
    public async Task GetPendingVerification_Returns200WithPendingVerifications()
    {
        var pending = new List<AdminDriverPayoutListItemDto>
        {
            new(Guid.Empty, Guid.NewGuid(), "New Driver", 0m, "PendingVerification",
                DateTime.UtcNow, null, null, null, null, "01098765432", false)
        }.AsReadOnly();
        _serviceMock.Setup(s => s.GetPendingVerificationAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(pending);

        var result = await _controller.GetPendingVerification(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<AdminDriverPayoutListItemDto>>(ok.Value);
        Assert.Single(returned);
    }

    [Fact]
    public async Task ApprovePayout_Returns204OnSuccess()
    {
        var payoutId = Guid.NewGuid();
        _serviceMock.Setup(s => s.ApprovePayoutAsync(payoutId, _adminId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _controller.ApprovePayout(payoutId, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        _serviceMock.Verify(s => s.ApprovePayoutAsync(payoutId, _adminId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RejectPayout_Returns204OnSuccess()
    {
        var payoutId = Guid.NewGuid();
        var request = new RejectPayoutRequest("Insufficient balance");
        _serviceMock.Setup(s => s.RejectPayoutAsync(payoutId, _adminId, "Insufficient balance", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _controller.RejectPayout(payoutId, request, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        _serviceMock.Verify(s => s.RejectPayoutAsync(payoutId, _adminId, "Insufficient balance", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RetryFailedPayout_Returns204OnSuccess()
    {
        var payoutId = Guid.NewGuid();
        _serviceMock.Setup(s => s.RetryFailedPayoutAsync(payoutId, _adminId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _controller.RetryFailedPayout(payoutId, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        _serviceMock.Verify(s => s.RetryFailedPayoutAsync(payoutId, _adminId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task VerifyWalletInfo_Returns204OnSuccess()
    {
        var driverProfileId = Guid.NewGuid();
        _serviceMock.Setup(s => s.VerifyWalletInfoAsync(driverProfileId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _controller.VerifyWalletInfo(driverProfileId, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        _serviceMock.Verify(s => s.VerifyWalletInfoAsync(driverProfileId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetEarningsHistory_Returns200WithHistory()
    {
        var driverProfileId = Guid.NewGuid();
        var history = new List<DriverEarningRowDto>
        {
            new(Guid.NewGuid(), "BK-001", DateTime.UtcNow, 200m, 20m, 180m, DriverEarningStatus.Available)
        }.AsReadOnly();
        _serviceMock.Setup(s => s.GetDriverEarningsHistoryAsync(driverProfileId, 1, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(history);

        var result = await _controller.GetEarningsHistory(driverProfileId, 1, 10, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<DriverEarningRowDto>>(ok.Value);
        Assert.Single(returned);
    }

    [Fact]
    public async Task GetPlatformSummary_Returns200WithSummary()
    {
        var summary = new PlatformDriverEarningsSummaryDto(
            TotalDriverEarnings: 100000m,
            TotalPlatformDeduction: 10000m,
            TotalPayoutsCompleted: 80000m,
            TotalPendingPayouts: 5000m,
            TotalActiveDrivers: 150,
            PendingPayoutRequests: 12,
            PendingWalletVerifications: 3
        );
        _serviceMock.Setup(s => s.GetPlatformEarningsSummaryAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(summary);

        var result = await _controller.GetPlatformSummary(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<PlatformDriverEarningsSummaryDto>(ok.Value);
        Assert.Equal(150, returned.TotalActiveDrivers);
        Assert.Equal(12, returned.PendingPayoutRequests);
    }

    [Fact]
    public void Endpoints_WithoutAdminRole_Return401()
    {
        var unauthenticatedController = new AdminDriverEarningsController(_serviceMock.Object, _loggerMock.Object);
        unauthenticatedController.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity())
            }
        };

        Assert.False(unauthenticatedController.User.Identity?.IsAuthenticated);
    }

    public void Dispose()
    {
    }
}
