namespace Backend.Application.DTOs.Payment;

public record PaymobInitiateResponse(
    string IframeUrl,
    Guid InternalTransactionId,
    string PaymobOrderId
);

public record InitiatePaymentRequest(Guid BookingId);
