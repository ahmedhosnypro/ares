using Backend.Application.DTOs.Payment;
using Backend.Application.DTOs.Common;
using Backend.Application.Interfaces;

namespace Backend.Application.Services;

/// <summary>
/// Service interface for payment-related operations
/// </summary>
public interface IPaymentService
{
    /// <summary>
    /// Processes a payment for a booking
    /// </summary>
    /// <param name="request">Payment request details</param>
    /// <param name="userId">ID of the user making the payment</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Payment response with transaction details</returns>
    Task<PaymentResponse> ProcessPaymentAsync(
        PaymentRequest request,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets paginated payment history for a user with filters
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="request">Payment history request with filters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated payment history</returns>
    Task<PagedResult<PaymentDto>> GetPaymentHistoryAsync(
        Guid userId,
        PaymentHistoryRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a receipt for a payment transaction
    /// </summary>
    /// <param name="transactionId">Transaction ID</param>
    /// <param name="format">Receipt format (pdf or html)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Receipt file as byte array</returns>
    Task<byte[]> GenerateReceiptAsync(
        Guid transactionId,
        string format,
        CancellationToken cancellationToken = default);

    Task<PaymobInitiateResponse> InitiatePaymentAsync(Guid bookingId, Guid userId, CancellationToken ct = default);

    Task<(bool Success, Guid BookingId)> ProcessPaymobCallbackAsync(IReadOnlyDictionary<string, string> queryParams, CancellationToken ct = default);

    Task<RefundResult> GetRefundPreviewAsync(Guid bookingId, CancellationToken ct = default);

    Task<RefundResponse> RefundAsync(Guid bookingId, Guid requestedBy, bool isAdmin, decimal? adminOverrideAmount = null, CancellationToken ct = default);
}
