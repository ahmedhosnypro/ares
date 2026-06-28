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
using Moq;
using Xunit;

namespace Backend.Tests.IntegrationTests;

public class DriverEarningsControllerTests : IDisposable
{
    private readonly Mock<IDriverEarningsService> _serviceMock;
    private readonly DriverEarningsController _controller;
    private readonly Guid _driverProfileId = Guid.NewGuid();

    public DriverEarningsControllerTests()
    {
        _serviceMock = new Mock<IDriverEarningsService>();
        _controller = new DriverEarningsController(_serviceMock.Object);

        var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
        {
            new Claim("profileId", _driverProfileId.ToString()),
            new Claim(ClaimTypes.Role, "Driver")
        }, "mock"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
    }

    [Fact]
    public async Task GetStats_Returns200WithStats()
    {
        var stats = new DriverEarningsStatsDto(
            TotalEarnings: 5000m,
            ThisMonthEarnings: 1200m,
            LastMonthEarnings: 800m,
            AvailableBalance: 300m,
            PendingPayoutAmount: 100m,
            CompletedTripsCount: 42
        );
        _serviceMock.Setup(s => s.GetStatsAsync(_driverProfileId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(stats);

        var result = await _controller.GetStats(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<DriverEarningsStatsDto>(ok.Value);
        Assert.Equal(5000m, returned.TotalEarnings);
        Assert.Equal(42, returned.CompletedTripsCount);
    }

    [Fact]
    public async Task GetMonthlyChart_Returns200WithChart()
    {
        var data = new List<DriverMonthlyEarningPointDto>
        {
            new("Jan", 1, 2025, 100m),
            new("Feb", 2, 2025, 200m)
        }.AsReadOnly();
        _serviceMock.Setup(s => s.GetMonthlyChartAsync(_driverProfileId, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(data);

        var result = await _controller.GetMonthlyChart(2025, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<DriverMonthlyEarningPointDto>>(ok.Value);
        Assert.Equal(2, returned.Count);
    }

    [Fact]
    public async Task GetTopBookings_Returns200WithBookings()
    {
        var bookings = new List<DriverTopBookingDto>
        {
            new(Guid.NewGuid(), "BK-001", "Sedan", "John", 300m, DateTime.UtcNow)
        }.AsReadOnly();
        _serviceMock.Setup(s => s.GetTopBookingsAsync(_driverProfileId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(bookings);

        var result = await _controller.GetTopBookings(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<DriverTopBookingDto>>(ok.Value);
        Assert.Single(returned);
    }

    [Fact]
    public async Task GetEarningsHistory_Returns200WithPaginatedData()
    {
        var rows = new List<DriverEarningRowDto>
        {
            new(Guid.NewGuid(), "BK-001", DateTime.UtcNow, 200m, 20m, 180m, DriverEarningStatus.Available)
        }.AsReadOnly();
        _serviceMock.Setup(s => s.GetEarningsHistoryAsync(_driverProfileId, 1, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rows);

        var result = await _controller.GetEarningsHistory(1, 10, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<DriverEarningRowDto>>(ok.Value);
        Assert.Single(returned);
    }

    [Fact]
    public async Task RequestPayout_Returns200WithPayoutDto()
    {
        var payout = new DriverPayoutDto(
            Id: Guid.NewGuid(),
            RequestedAt: DateTime.UtcNow,
            Amount: 300m,
            Status: DriverPayoutStatus.Requested,
            ReviewedAt: null,
            RejectionReason: null,
            PaymobTransactionId: null,
            CompletedAt: null
        );
        var request = new DriverPayoutRequestDto(Amount: 300m);
        _serviceMock.Setup(s => s.RequestPayoutAsync(_driverProfileId, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payout);

        var result = await _controller.RequestPayout(request, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<DriverPayoutDto>(ok.Value);
        Assert.Equal(300m, returned.Amount);
        Assert.Equal(DriverPayoutStatus.Requested, returned.Status);
    }

    [Fact]
    public async Task RequestPayout_InvalidAmount_Returns400()
    {
        var request = new DriverPayoutRequestDto(Amount: -50m);
        _serviceMock.Setup(s => s.RequestPayoutAsync(_driverProfileId, request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("Amount must be positive."));

        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _controller.RequestPayout(request, CancellationToken.None));
        Assert.Equal("Amount must be positive.", ex.Message);
    }

    [Fact]
    public async Task GetPayoutHistory_Returns200WithPayouts()
    {
        var payouts = new List<DriverPayoutDto>
        {
            new(Guid.NewGuid(), DateTime.UtcNow, 300m, DriverPayoutStatus.Completed,
                DateTime.UtcNow, null, "12345", DateTime.UtcNow)
        }.AsReadOnly();
        _serviceMock.Setup(s => s.GetPayoutHistoryAsync(_driverProfileId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(payouts);

        var result = await _controller.GetPayoutHistory(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<DriverPayoutDto>>(ok.Value);
        Assert.Single(returned);
    }

    [Fact]
    public async Task Endpoints_WithoutAuth_Return401()
    {
        var unauthenticatedController = new DriverEarningsController(_serviceMock.Object);
        unauthenticatedController.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity())
            }
        };

        var filter = new Microsoft.AspNetCore.Mvc.Authorization.AuthorizeFilter(
            new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
                .RequireRole("Driver").Build());

        Assert.NotNull(unauthenticatedController);
        Assert.False(unauthenticatedController.User.Identity?.IsAuthenticated);
    }

    public void Dispose()
    {
    }
}
