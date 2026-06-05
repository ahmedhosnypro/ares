using Backend.Application.Services;
using Backend.Domain.Entities.Enums;
using Xunit;

namespace Backend.Tests.UnitTests;

public class RefundCalculatorTests
{
    private readonly RefundCalculator _calc = new();
    private static readonly DateTime Pickup = new(2026, 8, 1, 12, 0, 0, DateTimeKind.Utc);

    // >48h before pickup
    private static readonly DateTime Before48h = Pickup.AddHours(-72);
    // ≤48h before pickup
    private static readonly DateTime Within48h = Pickup.AddHours(-24);

    [Theory]
    [InlineData(BookingStatus.Draft, true, 100, PolicyType.Free)]
    [InlineData(BookingStatus.PaymentPending, true, 100, PolicyType.Free)]
    [InlineData(BookingStatus.Confirmed, true, 100, PolicyType.Free)]
    [InlineData(BookingStatus.Confirmed, false, 75, PolicyType.Partial)]
    public void Calculate_ShouldReturnCorrectPercentageAndPolicy(BookingStatus status, bool isBeforeThreshold, decimal expectedPercentage, PolicyType expectedPolicy)
    {
        var cancelAt = isBeforeThreshold ? Before48h : Within48h;
        var result = _calc.Calculate(status, Pickup, 200m, cancelAt);

        Assert.Equal(expectedPercentage, result.RefundPercentage);
        Assert.Equal(expectedPolicy, result.PolicyType);
        Assert.Equal(Math.Round(200m * expectedPercentage / 100m, 2), result.RefundAmount);
        Assert.Equal(200m - result.RefundAmount, result.CancellationFee);
    }

    [Theory]
    [InlineData(BookingStatus.Active)]
    [InlineData(BookingStatus.Completed)]
    public void Calculate_ActiveOrCompleted_Throws(BookingStatus status)
    {
        Assert.Throws<InvalidOperationException>(() => _calc.Calculate(status, Pickup, 200m, Before48h));
    }
}
