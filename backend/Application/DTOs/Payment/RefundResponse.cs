namespace Backend.Application.DTOs.Payment;

public record RefundResponse(bool Success, decimal RefundAmount, decimal RefundPercentage, string Message);
