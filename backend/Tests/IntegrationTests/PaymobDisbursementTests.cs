using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Application.Settings;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using Xunit;

namespace Backend.Tests.IntegrationTests;

public class PaymobDisbursementTests : IDisposable
{
    [Fact]
    public async Task CreateDisbursementAsync_Success_ReturnsSuccessResult()
    {
        var jsonResponse = JsonSerializer.Serialize(new
        {
            id = 98765,
            success = true,
            data = new { txn_response_code = "ACCEPTED" }
        });
        var handler = CreateMockHandler(HttpStatusCode.OK, jsonResponse);
        var client = CreatePaymobClient(handler);

        var result = await client.CreateDisbursementAsync("auth-token", 50000, "01012345678", CancellationToken.None);

        Assert.True(result.Success);
        Assert.Equal(98765, result.Id);
        Assert.Null(result.Reason);
    }

    [Fact]
    public async Task CreateDisbursementAsync_ErrorResponse_ReturnsFailureResult()
    {
        var errorBody = "Insufficient funds";
        var handler = CreateMockHandler(HttpStatusCode.UnprocessableEntity, errorBody);
        var client = CreatePaymobClient(handler);

        var result = await client.CreateDisbursementAsync("auth-token", 50000, "01012345678", CancellationToken.None);

        Assert.False(result.Success);
        Assert.Contains("422", result.Reason);
        Assert.Contains("Insufficient funds", result.Reason);
    }

    [Fact]
    public async Task CreateDisbursementAsync_HttpException_ReturnsFailureResult()
    {
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("Connection refused"));

        var client = CreatePaymobClient(handler);

        await Assert.ThrowsAsync<HttpRequestException>(
            () => client.CreateDisbursementAsync("auth-token", 50000, "01012345678", CancellationToken.None));
    }

    [Fact]
    public async Task CreateDisbursementAsync_PassCorrectAmountCents()
    {
        HttpRequestMessage? capturedRequest = null;
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, _) => capturedRequest = req)
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(new { id = 1, success = true }), Encoding.UTF8, "application/json")
            });

        var client = CreatePaymobClient(handler);
        await client.CreateDisbursementAsync("test-token", 25075, "01012345678", CancellationToken.None);

        Assert.NotNull(capturedRequest);
        var body = await capturedRequest.Content!.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(25075, doc.RootElement.GetProperty("amount_cents").GetInt64());
        Assert.Equal("test-token", doc.RootElement.GetProperty("auth_token").GetString());
        Assert.Equal("01012345678", doc.RootElement.GetProperty("recipient_wallet_phone").GetString());
    }

    [Fact]
    public async Task ApprovePayoutAsync_CallsPaymobWithCorrectAmountAndWallet()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var context = new ApplicationDbContext(options);

        var driverUserId = Guid.NewGuid();
        var driverProfileId = Guid.NewGuid();
        var payoutId = Guid.NewGuid();

        var user = new ApplicationUser
        {
            Id = driverUserId,
            FirstName = "Test",
            LastName = "Driver",
            Email = "driver@test.com",
            Status = "Active"
        };
        context.Users.Add(user);

        var driverProfile = new DriverProfile
        {
            Id = driverProfileId,
            UserId = driverUserId,
            User = user,
            IsActive = true,
            Status = DriverProfileStatus.Verified
        };
        context.DriverProfiles.Add(driverProfile);

        var paymentInfo = new DriverPaymentInfo
        {
            Id = Guid.NewGuid(),
            DriverProfileId = driverProfileId,
            WalletPhoneNumber = "01098765432",
            IsVerified = true
        };
        context.DriverPaymentInfo.Add(paymentInfo);

        var payout = new DriverPayout
        {
            Id = payoutId,
            DriverProfileId = driverProfileId,
            Amount = 250.75m,
            Status = DriverPayoutStatus.Requested,
            RequestedAt = DateTime.UtcNow
        };
        context.DriverPayouts.Add(payout);
        await context.SaveChangesAsync();

        var paymobMock = new Mock<IPaymobClient>();
        paymobMock.Setup(p => p.GetAuthTokenAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync("mock-auth-token");
        paymobMock.Setup(p => p.CreateDisbursementAsync(
                "mock-auth-token",
                It.IsAny<long>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymobDisbursementResult(123, true, null));

        var notificationMock = new Mock<IDriverNotificationService>();
        var loggerMock = new Mock<ILogger<DriverEarningsAdminService>>();

        var service = new DriverEarningsAdminService(
            context, paymobMock.Object, notificationMock.Object, loggerMock.Object);

        await service.ApprovePayoutAsync(payoutId, Guid.NewGuid(), CancellationToken.None);

        paymobMock.Verify(p => p.CreateDisbursementAsync(
            "mock-auth-token",
            25075,
            "01098765432",
            It.IsAny<CancellationToken>()), Times.Once);

        var updatedPayout = await context.DriverPayouts.FindAsync(payoutId);
        Assert.Equal(DriverPayoutStatus.Completed, updatedPayout!.Status);
    }

    [Fact]
    public async Task ApprovePayoutAsync_FailedDisbursement_SetsPayoutStatusToFailed()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var context = new ApplicationDbContext(options);

        var driverUserId = Guid.NewGuid();
        var driverProfileId = Guid.NewGuid();
        var payoutId = Guid.NewGuid();

        var user = new ApplicationUser
        {
            Id = driverUserId,
            FirstName = "Test",
            LastName = "Driver",
            Email = "driver@test.com",
            Status = "Active"
        };
        context.Users.Add(user);

        context.DriverProfiles.Add(new DriverProfile
        {
            Id = driverProfileId,
            UserId = driverUserId,
            User = user,
            IsActive = true,
            Status = DriverProfileStatus.Verified
        });

        context.DriverPaymentInfo.Add(new DriverPaymentInfo
        {
            Id = Guid.NewGuid(),
            DriverProfileId = driverProfileId,
            WalletPhoneNumber = "01098765432",
            IsVerified = true
        });

        context.DriverPayouts.Add(new DriverPayout
        {
            Id = payoutId,
            DriverProfileId = driverProfileId,
            Amount = 100m,
            Status = DriverPayoutStatus.Requested,
            RequestedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var paymobMock = new Mock<IPaymobClient>();
        paymobMock.Setup(p => p.GetAuthTokenAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync("mock-auth-token");
        paymobMock.Setup(p => p.CreateDisbursementAsync(
                It.IsAny<string>(), It.IsAny<long>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PaymobDisbursementResult(0, false, "Insufficient funds"));

        var service = new DriverEarningsAdminService(
            context,
            paymobMock.Object,
            new Mock<IDriverNotificationService>().Object,
            new Mock<ILogger<DriverEarningsAdminService>>().Object);

        await service.ApprovePayoutAsync(payoutId, Guid.NewGuid(), CancellationToken.None);

        var updatedPayout = await context.DriverPayouts.FindAsync(payoutId);
        Assert.Equal(DriverPayoutStatus.Failed, updatedPayout!.Status);
        Assert.Equal("Insufficient funds", updatedPayout.FailureReason);
    }

    private static Mock<HttpMessageHandler> CreateMockHandler(HttpStatusCode statusCode, string responseBody)
    {
        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(statusCode)
            {
                Content = new StringContent(responseBody, Encoding.UTF8, "application/json")
            });
        return handler;
    }

    private static PaymobClient CreatePaymobClient(Mock<HttpMessageHandler> handler)
    {
        var httpClient = new HttpClient(handler.Object);
        var settings = new PaymobSettings
        {
            ApiKey = "test-api-key",
            BaseUrl = "https://accept.paymob.com"
        };
        var options = Options.Create(settings);
        return new PaymobClient(httpClient, options);
    }

    public void Dispose()
    {
    }
}
