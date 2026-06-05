using System.Security.Cryptography;
using System.Text;
using Backend.Application.DTOs.Payment;
using Backend.Application.DTOs.Common;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Application.Settings;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Backend.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IApplicationDbContext _context;
    private readonly IPaymobClient _paymob;
    private readonly IRefundCalculator _refundCalculator;
    private readonly PaymobSettings _paymobSettings;

    public PaymentService(
        IPaymentRepository paymentRepository,
        IBookingRepository bookingRepository,
        IApplicationDbContext context,
        IPaymobClient paymob,
        IRefundCalculator refundCalculator,
        IOptions<PaymobSettings> paymobSettings)
    {
        _paymentRepository = paymentRepository;
        _bookingRepository = bookingRepository;
        _context = context;
        _paymob = paymob;
        _refundCalculator = refundCalculator;
        _paymobSettings = paymobSettings.Value;
    }

    public async Task<PaymentResponse> ProcessPaymentAsync(
        PaymentRequest request,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Requirement 7.11: Validate payment data
        if (request.Amount <= 0)
        {
            throw new ValidationException("Amount", "Payment amount must be greater than zero");
        }

        // Retrieve booking to validate ownership and status
        var booking = await _bookingRepository.GetByIdAsync(request.BookingId, cancellationToken);
        if (booking == null)
        {
            throw new NotFoundException($"Booking with ID {request.BookingId} not found");
        }

        // Verify booking belongs to the user
        if (booking.UserId != userId)
        {
            throw new ForbiddenException("You do not have permission to pay for this booking");
        }

        // Verify booking is in a payable status
        if (booking.Status == Backend.Domain.Entities.Enums.BookingStatus.Cancelled || booking.Status == Backend.Domain.Entities.Enums.BookingStatus.Completed)
        {
            throw new ValidationException("Status", "This booking cannot be paid");
        }

        // ── Mandatory-driver payment gate (business rule 13) ─────────────────
        // A booking that requires a driver (e.g. the customer has no approved
        // driving license and therefore cannot self-drive) MUST have a driver
        // assigned before payment can be completed. This is the authoritative,
        // server-side enforcement of "payment cannot be completed until a
        // driver is assigned" — it holds even if the client skips or bypasses
        // the driver-selection UI. Driver assignment is recorded on
        // Booking.AssignedDriverProfileId via the request → accept → select
        // workflow (see DriverAssignmentService.SelectDriverAsync).
        if (booking.RequiresDriver && !booking.AssignedDriverProfileId.HasValue)
        {
            throw new BadRequestException(
                "A driver must be assigned to this booking before payment can be completed. " +
                "Please complete driver selection first.");
        }

        // Generate unique transaction ID
        var transactionId = Guid.NewGuid();

        // Requirement 7.10: Create payment record linked to booking
        var payment = new BookingPayment
        {
            PaymentId = Guid.NewGuid(),
            BookingId = request.BookingId,
            TransactionId = transactionId,
            PaymentMethod = request.PaymentMethod,
            Amount = request.Amount,
            Currency = "USD",
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        // Simulate payment processing
        // In a real implementation, this would integrate with a payment gateway
        var paymentSuccessful = await SimulatePaymentProcessingAsync(request, cancellationToken);

        if (paymentSuccessful)
        {
            payment.Status = "Captured";
            payment.ProcessedAt = DateTime.UtcNow;
            payment.AuthorizationCode = GenerateAuthorizationCode();

            // Requirement 7.12: Update booking status after successful payment
            booking.Status = Backend.Domain.Entities.Enums.BookingStatus.Confirmed;
            await _bookingRepository.UpdateAsync(booking, cancellationToken);
        }
        else
        {
            payment.Status = "Failed";
            payment.FailureReason = "Payment processing failed";
        }

        // Requirement 7.13: Store payment method information securely
        // Note: Payment method details are already stored in the PaymentMethod entity
        // We only store the reference and method type in the payment record

        await _paymentRepository.AddAsync(payment, cancellationToken);

        // Save all changes (both booking and payment) since they share the same context
        await _context.SaveChangesAsync(cancellationToken);

        return new PaymentResponse(
            transactionId,
            payment.Status,
            paymentSuccessful
                ? "Payment processed successfully"
                : "Payment processing failed"
        );
    }

    public async Task<PagedResult<PaymentDto>> GetPaymentHistoryAsync(
        Guid userId,
        PaymentHistoryRequest request,
        CancellationToken cancellationToken = default)
    {
        // Requirement 7.1: Get user payments with filters
        var payments = await _paymentRepository.GetUserPaymentsAsync(
            userId,
            request.StartDate,
            request.EndDate,
            request.Status,
            request.PaymentMethod,
            cancellationToken);

        var paymentList = payments.ToList();

        // Apply sorting
        paymentList = ApplySorting(paymentList, request.SortBy, request.SortOrder);

        // Calculate pagination
        var totalCount = paymentList.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);
        var skip = (request.Page - 1) * request.PageSize;
        var pagedPayments = paymentList.Skip(skip).Take(request.PageSize).ToList();

        // Map to DTOs
        var paymentDtos = pagedPayments.Select(p => new PaymentDto(
            p.TransactionId,
            p.BookingId,
            p.Amount,
            p.Currency,
            p.PaymentMethod,
            p.Status,
            p.CreatedAt
        )).ToList();

        return new PagedResult<PaymentDto>(
            paymentDtos,
            request.Page,
            request.PageSize,
            totalCount,
            totalPages
        );
    }

    public async Task<byte[]> GenerateReceiptAsync(
        Guid transactionId,
        string format,
        CancellationToken cancellationToken = default)
    {
        // Requirement 7.5: Generate receipt in specified format
        var payment = await _paymentRepository.GetByTransactionIdAsync(transactionId, cancellationToken);

        if (payment == null)
        {
            throw new NotFoundException($"Payment transaction with ID {transactionId} not found");
        }

        // Generate receipt in specified format with transaction details
        var receiptContent = format.ToLowerInvariant() == "pdf"
            ? GeneratePdfReceipt(payment)
            : GenerateHtmlReceipt(payment);

        return receiptContent;
    }

    /// <summary>
    /// Simulates payment processing with a payment gateway
    /// In production, this would integrate with Stripe, PayPal, etc.
    /// </summary>
    private async Task<bool> SimulatePaymentProcessingAsync(
        PaymentRequest request,
        CancellationToken cancellationToken)
    {
        // Simulate async payment processing delay
        await Task.Delay(100, cancellationToken);

        // For demonstration, assume all payments succeed
        // In production, this would call the actual payment gateway API
        return true;
    }

    /// <summary>
    /// Generates a unique authorization code for successful payments
    /// </summary>
    private string GenerateAuthorizationCode()
    {
        return $"AUTH-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}";
    }

    /// <summary>
    /// Applies sorting to payment list based on request parameters
    /// </summary>
    private List<BookingPayment> ApplySorting(
        List<BookingPayment> payments,
        string sortBy,
        string sortOrder)
    {
        var isDescending = sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase);

        return sortBy.ToLowerInvariant() switch
        {
            "amount" => isDescending
                ? payments.OrderByDescending(p => p.Amount).ToList()
                : payments.OrderBy(p => p.Amount).ToList(),
            "status" => isDescending
                ? payments.OrderByDescending(p => p.Status).ToList()
                : payments.OrderBy(p => p.Status).ToList(),
            "paymentmethod" => isDescending
                ? payments.OrderByDescending(p => p.PaymentMethod).ToList()
                : payments.OrderBy(p => p.PaymentMethod).ToList(),
            _ => isDescending
                ? payments.OrderByDescending(p => p.CreatedAt).ToList()
                : payments.OrderBy(p => p.CreatedAt).ToList()
        };
    }

    /// <summary>
    /// Generates a PDF receipt (placeholder implementation)
    /// In production, use a PDF library like iTextSharp or QuestPDF
    /// </summary>
    private byte[] GeneratePdfReceipt(BookingPayment payment)
    {
        // Placeholder: Convert HTML to PDF or use a PDF library
        var content = $@"
PAYMENT RECEIPT
=====================================

Transaction ID: {payment.TransactionId}
Payment ID: {payment.PaymentId}
Date: {payment.CreatedAt:yyyy-MM-dd HH:mm:ss}

BOOKING DETAILS
-------------------------------------
Booking ID: {payment.BookingId}
Vehicle: {payment.Booking?.Vehicle?.Make} {payment.Booking?.Vehicle?.Model}
Customer: {payment.Booking?.User?.FirstName} {payment.Booking?.User?.LastName}
Period: {payment.Booking?.PickupDate:yyyy-MM-dd} to {payment.Booking?.ReturnDate:yyyy-MM-dd}

PAYMENT DETAILS
-------------------------------------
Amount: {payment.Amount:C} {payment.Currency}
Payment Method: {payment.PaymentMethod}
Status: {payment.Status}
Authorization Code: {payment.AuthorizationCode ?? "N/A"}
Processed At: {payment.ProcessedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "Pending"}

=====================================
Thank you for your business!
";
        return System.Text.Encoding.UTF8.GetBytes(content);
    }

    /// <summary>
    /// Generates an HTML receipt with complete transaction details
    /// </summary>
    private byte[] GenerateHtmlReceipt(BookingPayment payment)
    {
        var html = $@"
<!DOCTYPE html>
<html>
<head>
    <title>Payment Receipt</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
        .header {{ text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }}
        .section {{ margin-bottom: 30px; }}
        .section-title {{ font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }}
        .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }}
        .detail-label {{ font-weight: bold; color: #666; }}
        .detail-value {{ color: #333; }}
        .total {{ font-size: 20px; font-weight: bold; color: #2c5282; margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; }}
        .footer {{ text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>Payment Receipt</h1>
        <p>Transaction ID: {payment.TransactionId}</p>
        <p>Date: {payment.CreatedAt:yyyy-MM-dd HH:mm:ss}</p>
    </div>

    <div class='section'>
        <div class='section-title'>Booking Information</div>
        <div class='detail-row'>
            <span class='detail-label'>Booking ID:</span>
            <span class='detail-value'>{payment.BookingId}</span>
        </div>
        <div class='detail-row'>
            <span class='detail-label'>Vehicle:</span>
            <span class='detail-value'>{payment.Booking?.Vehicle?.Make} {payment.Booking?.Vehicle?.Model}</span>
        </div>
        <div class='detail-row'>
            <span class='detail-label'>Customer:</span>
            <span class='detail-value'>{payment.Booking?.User?.FirstName} {payment.Booking?.User?.LastName}</span>
        </div>
        <div class='detail-row'>
            <span class='detail-label'>Email:</span>
            <span class='detail-value'>{payment.Booking?.User?.Email}</span>
        </div>
        <div class='detail-row'>
            <span class='detail-label'>Pickup Date:</span>
            <span class='detail-value'>{payment.Booking?.PickupDate:yyyy-MM-dd}</span>
        </div>
        <div class='detail-row'>
            <span class='detail-label'>Return Date:</span>
            <span class='detail-value'>{payment.Booking?.ReturnDate:yyyy-MM-dd}</span>
        </div>
    </div>

    <div class='section'>
        <div class='section-title'>Payment Details</div>
        <div class='detail-row'>
            <span class='detail-label'>Payment ID:</span>
            <span class='detail-value'>{payment.PaymentId}</span>
        </div>
        <div class='detail-row'>
            <span class='detail-label'>Payment Method:</span>
            <span class='detail-value'>{payment.PaymentMethod}</span>
        </div>
        <div class='detail-row'>
            <span class='detail-label'>Status:</span>
            <span class='detail-value'>{payment.Status}</span>
        </div>
        <div class='detail-row'>
            <span class='detail-label'>Authorization Code:</span>
            <span class='detail-value'>{payment.AuthorizationCode ?? "N/A"}</span>
        </div>
        <div class='detail-row'>
            <span class='detail-label'>Processed At:</span>
            <span class='detail-value'>{payment.ProcessedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "Pending"}</span>
        </div>
    </div>

    <div class='total'>
        <div class='detail-row'>
            <span class='detail-label'>Total Amount:</span>
            <span class='detail-value'>{payment.Amount:C} {payment.Currency}</span>
        </div>
    </div>

    <div class='footer'>
        <p>Thank you for your business!</p>
        <p>This is an electronic receipt. Please keep it for your records.</p>
    </div>
</body>
</html>";
        return System.Text.Encoding.UTF8.GetBytes(html);
    }

    // ── Task 3: Initiate Paymob payment ─────────────────────────────────

    public async Task<PaymobInitiateResponse> InitiatePaymentAsync(Guid bookingId, Guid userId, CancellationToken ct = default)
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId, ct)
            ?? throw new NotFoundException($"Booking {bookingId} not found");

        if (booking.UserId != userId)
            throw new ForbiddenException("You do not have permission to pay for this booking");

        if (booking.Status == BookingStatus.Cancelled || booking.Status == BookingStatus.Completed || booking.Status == BookingStatus.Active)
            throw new ValidationException("Status", "This booking cannot be paid");

        var amount = booking.TotalPrice ?? 0m;
        var amountCents = (long)(amount * 100);

        var authToken = await _paymob.GetAuthTokenAsync(ct);
        var orderId = await _paymob.CreateOrderAsync(authToken, amountCents, "EGP", bookingId.ToString(), ct);

        // Load user for billing data
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        var billing = new PaymobBillingData(
            FirstName: user?.FirstName ?? "Customer",
            LastName: user?.LastName ?? "Customer",
            Email: user?.Email ?? "customer@email.com",
            PhoneNumber: user?.PhoneNumber ?? "+20000000000"
        );

        var paymentKey = await _paymob.RequestPaymentKeyAsync(authToken, orderId, amountCents, "EGP", _paymobSettings.IntegrationId, billing, ct);

        var payment = new BookingPayment
        {
            PaymentId = Guid.NewGuid(),
            BookingId = bookingId,
            TransactionId = Guid.NewGuid(),
            PaymentMethod = "card",
            Amount = amount,
            Currency = "EGP",
            Status = "Pending",
            PaymobOrderId = orderId,
            CreatedAt = DateTime.UtcNow
        };

        await _paymentRepository.AddAsync(payment, ct);
        await _context.SaveChangesAsync(ct);

        var iframeUrl = $"{_paymobSettings.BaseUrl}/api/acceptance/iframes/{_paymobSettings.IframeId}?payment_token={paymentKey}";
        return new PaymobInitiateResponse(iframeUrl, payment.TransactionId, orderId);
    }

    // ── Task 4: Process Paymob callback/webhook ──────────────────────────

    public async Task<(bool Success, Guid BookingId)> ProcessPaymobCallbackAsync(IReadOnlyDictionary<string, string> queryParams, CancellationToken ct = default)
    {
        if (!queryParams.TryGetValue("hmac", out var receivedHmac) || !VerifyHmac(_paymobSettings.HmacSecret, queryParams, receivedHmac))
            return (false, Guid.Empty);

        var success = queryParams.TryGetValue("success", out var s) && s.Equals("true", StringComparison.OrdinalIgnoreCase);
        queryParams.TryGetValue("order", out var orderId);
        queryParams.TryGetValue("id", out var txIdStr);

        if (string.IsNullOrEmpty(orderId))
            return (false, Guid.Empty);

        var payment = await _context.Payments
            .Include(p => p.Booking)
            .FirstOrDefaultAsync(p => p.PaymobOrderId == orderId, ct);

        if (payment == null)
            return (false, Guid.Empty);

        payment.Status = success ? "Captured" : "Failed";
        payment.ProcessedAt = DateTime.UtcNow;

        if (long.TryParse(txIdStr, out var paymobTxId))
            payment.PaymobTransactionId = paymobTxId;

        if (!success && queryParams.TryGetValue("txn_response_code", out var reason))
            payment.FailureReason = reason;

        if (success && payment.Booking != null)
            payment.Booking.Status = BookingStatus.Confirmed;

        await _context.SaveChangesAsync(ct);
        return (success, payment.BookingId);
    }

    private static readonly string[] HmacFields =
    [
        "amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction",
        "id", "integration_id", "is_3d_secure", "is_auth", "is_capture", "is_refunded",
        "is_standalone_payment", "is_voided", "order", "owner", "pending",
        "source_data_pan", "source_data_sub_type", "source_data_type", "success"
    ];

    private static bool VerifyHmac(string secret, IReadOnlyDictionary<string, string> data, string received)
    {
        // Paymob uses dot-separated keys in the query string but underscore-joined for HMAC
        var concatenated = string.Concat(HmacFields.Select(f =>
        {
            var key = f.Replace("_", ".") == f ? f : f; // keep as-is; Paymob sends them underscore-joined
            return data.TryGetValue(f, out var v) ? v : string.Empty;
        }));

        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var msgBytes = Encoding.UTF8.GetBytes(concatenated);
        var hash = HMACSHA512.HashData(keyBytes, msgBytes);
        var computed = Convert.ToHexString(hash).ToLowerInvariant();
        return computed == received.ToLowerInvariant();
    }

    // ── Task 5: Refund preview + refund ─────────────────────────────────

    public async Task<RefundResult> GetRefundPreviewAsync(Guid bookingId, CancellationToken ct = default)
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId, ct)
            ?? throw new NotFoundException($"Booking {bookingId} not found");

        var payment = await _context.Payments
            .FirstOrDefaultAsync(p => p.BookingId == bookingId && p.Status == "Captured", ct)
            ?? throw new NotFoundException("No captured payment found for this booking");

        return _refundCalculator.Calculate(booking.Status, booking.PickupDate ?? DateTime.UtcNow.AddDays(1), payment.Amount);
    }

    public async Task<RefundResponse> RefundAsync(Guid bookingId, Guid requestedBy, bool isAdmin, decimal? adminOverrideAmount = null, CancellationToken ct = default)
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId, ct)
            ?? throw new NotFoundException($"Booking {bookingId} not found");

        if (!isAdmin && booking.UserId != requestedBy)
            throw new ForbiddenException("You do not have permission to cancel this booking");

        var payment = await _context.Payments
            .FirstOrDefaultAsync(p => p.BookingId == bookingId && p.Status == "Captured", ct)
            ?? throw new NotFoundException("No captured payment found for this booking");

        var result = _refundCalculator.Calculate(booking.Status, booking.PickupDate ?? DateTime.UtcNow.AddDays(1), payment.Amount);
        var refundAmount = isAdmin && adminOverrideAmount.HasValue ? adminOverrideAmount.Value : result.RefundAmount;

        if (refundAmount > 0 && payment.PaymobTransactionId.HasValue)
        {
            var authToken = await _paymob.GetAuthTokenAsync(ct);
            await _paymob.RefundAsync(authToken, payment.PaymobTransactionId.Value, (long)(refundAmount * 100), ct);
        }

        _context.AddBookingCancellation(new BookingCancellation
        {
            BookingId = bookingId,
            CancelledBy = requestedBy,
            PolicyType = result.PolicyType,
            RefundPercentage = result.RefundPercentage,
            OriginalAmount = payment.Amount,
            CancellationFee = payment.Amount - refundAmount,
            Currency = payment.Currency,
            RefundStatus = refundAmount > 0 ? RefundStatus.Processing : RefundStatus.Completed,
            RefundTransactionId = refundAmount > 0 ? Guid.NewGuid() : null,
            RefundProcessedAt = refundAmount > 0 ? DateTime.UtcNow : null,
            RefundMethod = refundAmount > 0 ? payment.PaymentMethod : null
        });

        payment.Status = "Refunded";
        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
        return new RefundResponse(true, refundAmount, result.RefundPercentage, $"Booking cancelled. Refund of {refundAmount:C} ({result.RefundPercentage}%) initiated.");
    }
}
