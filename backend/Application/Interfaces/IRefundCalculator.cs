using Backend.Domain.Entities.Enums;

namespace Backend.Application.Interfaces;

public record RefundResult(
    decimal RefundPercentage,
    decimal RefundAmount,
    decimal CancellationFee,
    PolicyType PolicyType
);

public interface IRefundCalculator
{
    RefundResult Calculate(BookingStatus status, DateTime pickupDate, decimal totalAmount, DateTime? cancellationTime = null);
}
