using Backend.Application.Interfaces;
using Backend.Domain.Entities.Enums;

namespace Backend.Application.Services;

public class RefundCalculator : IRefundCalculator
{
    private const int HoursThreshold = 48;

    public RefundResult Calculate(BookingStatus status, DateTime pickupDate, decimal totalAmount, DateTime? cancellationTime = null)
    {
        var now = cancellationTime ?? DateTime.UtcNow;
        var hoursUntilPickup = (pickupDate - now).TotalHours;
        var isBeforeThreshold = hoursUntilPickup > HoursThreshold;

        decimal percentage = status switch
        {
            BookingStatus.Draft or BookingStatus.PaymentPending => 100m,
            BookingStatus.Confirmed => isBeforeThreshold ? 100m : 75m,
            BookingStatus.Active or BookingStatus.Completed =>
                throw new InvalidOperationException("Cannot cancel an active or completed booking"),
            _ => 100m
        };

        var policyType = percentage switch
        {
            100m => PolicyType.Free,
            0m => PolicyType.NoRefund,
            _ => PolicyType.Partial
        };

        var refundAmount = Math.Round(totalAmount * percentage / 100m, 2);
        var cancellationFee = totalAmount - refundAmount;

        return new RefundResult(percentage, refundAmount, cancellationFee, policyType);
    }
}
