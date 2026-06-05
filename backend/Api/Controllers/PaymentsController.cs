using Backend.Application.DTOs.Payment;
using Backend.Application.DTOs.Common;
using Backend.Application.Services;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Controller for payment-related operations
/// </summary>
[ApiController]
[Route("api/v1/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(
        IPaymentService paymentService,
        ILogger<PaymentsController> logger)
    {
        _paymentService = paymentService;
        _logger = logger;
    }

    /// <summary>
    /// Gets payment history for the authenticated user
    /// </summary>
    /// <param name="request">Payment history filter parameters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated payment history</returns>
    [HttpGet("history")]
    public async Task<ActionResult<PagedResult<PaymentDto>>> GetPaymentHistory(
        [FromQuery] PaymentHistoryRequest request,
        CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value!);
        var result = await _paymentService.GetPaymentHistoryAsync(userId, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Gets details of a specific payment transaction
    /// Requirement 7.2: Get payment transaction details
    /// </summary>
    /// <param name="transactionId">Transaction ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Payment transaction details</returns>
    [HttpGet("{transactionId}")]
    public async Task<ActionResult<PaymentDto>> GetPaymentDetails(
        Guid transactionId,
        CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value!);

        // Get payment and verify ownership
        var payments = await _paymentService.GetPaymentHistoryAsync(
            userId,
            new PaymentHistoryRequest(),
            cancellationToken);

        var payment = payments.Data.FirstOrDefault(p => p.TransactionId == transactionId);

        if (payment == null)
        {
            return NotFound(new { message = "Payment transaction not found" });
        }

        return Ok(payment);
    }

    /// <summary>
    /// Generates and downloads a receipt for a payment transaction
    /// Requirement 7.5: Generate receipt in specified format (pdf or html)
    /// </summary>
    /// <param name="transactionId">Transaction ID</param>
    /// <param name="format">Receipt format (pdf or html, default: pdf)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Receipt file</returns>
    [HttpGet("{transactionId}/receipt")]
    public async Task<IActionResult> GetReceipt(
        Guid transactionId,
        [FromQuery] string format = "pdf",
        CancellationToken cancellationToken = default)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value!);

        // Verify user owns this transaction
        var payments = await _paymentService.GetPaymentHistoryAsync(
            userId,
            new PaymentHistoryRequest(),
            cancellationToken);

        var payment = payments.Data.FirstOrDefault(p => p.TransactionId == transactionId);

        if (payment == null)
        {
            return NotFound(new { message = "Payment transaction not found" });
        }

        // Generate receipt
        var receiptBytes = await _paymentService.GenerateReceiptAsync(
            transactionId,
            format,
            cancellationToken);

        // Determine content type and file extension
        var contentType = format.ToLowerInvariant() == "pdf"
            ? "application/pdf"
            : "text/html";

        var fileExtension = format.ToLowerInvariant() == "pdf" ? "pdf" : "html";
        var fileName = $"receipt_{transactionId}.{fileExtension}";

        return File(receiptBytes, contentType, fileName);
    }

    /// <summary>
    /// Gets pending payment transactions for the authenticated user
    /// Requirement 7.8: Return pending payment transactions with due dates
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of pending payment transactions</returns>
    [HttpGet("pending")]
    public async Task<ActionResult<IEnumerable<PaymentDto>>> GetPendingPayments(
        CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value!);

        var request = new PaymentHistoryRequest
        {
            Status = "Pending",
            SortBy = "createdAt",
            SortOrder = "asc"
        };

        var result = await _paymentService.GetPaymentHistoryAsync(userId, request, cancellationToken);
        return Ok(result.Data);
    }

    /// <summary>
    /// Gets recent failed payment attempts for the authenticated user
    /// Requirement 7.9: Return recent failed payment attempts with optional limit
    /// </summary>
    /// <param name="limit">Maximum number of failed payments to return (default: 10)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of failed payment transactions</returns>
    [HttpGet("failed")]
    public async Task<ActionResult<IEnumerable<PaymentDto>>> GetFailedPayments(
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value!);

        var request = new PaymentHistoryRequest
        {
            Status = "Failed",
            PageSize = limit,
            Page = 1,
            SortBy = "createdAt",
            SortOrder = "desc"
        };

        var result = await _paymentService.GetPaymentHistoryAsync(userId, request, cancellationToken);
        return Ok(result.Data);
    }
}

/// <summary>
/// Controller for payment creation operations
/// Note: This uses a different route prefix as per API requirements
/// </summary>
[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentCreationController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentCreationController> _logger;

    public PaymentCreationController(
        IPaymentService paymentService,
        ILogger<PaymentCreationController> logger)
    {
        _paymentService = paymentService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new payment for a booking
    /// Requirement 7.10: Create payment record linked to booking
    /// </summary>
    /// <param name="request">Payment request details</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Payment response with transaction details</returns>
    [HttpPost("create")]
    public async Task<ActionResult<PaymentResponse>> CreatePayment(
        [FromBody] PaymentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value!);

        var result = await _paymentService.ProcessPaymentAsync(request, userId, cancellationToken);

        if (result.Status == "Failed")
        {
            return BadRequest(result);
        }

        return CreatedAtAction(
            nameof(PaymentsController.GetPaymentDetails),
            "Payments",
            new { transactionId = result.TransactionId },
            result);
    }

    [HttpPost("initiate")]
    public async Task<ActionResult<PaymobInitiateResponse>> InitiatePayment([FromBody] InitiatePaymentRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value!);
        var result = await _paymentService.InitiatePaymentAsync(request.BookingId, userId, ct);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("callback")]
    public async Task<IActionResult> PaymobCallback([FromQuery] Dictionary<string, string> queryParams, CancellationToken ct)
    {
        var (success, bookingId) = await _paymentService.ProcessPaymobCallbackAsync(queryParams, ct);
        if (success && bookingId != Guid.Empty)
            return Redirect($"http://localhost:3000/bookings/confirmation/{bookingId}");
        return Redirect($"http://localhost:3000/booking/checkout/{bookingId}?payment_failed=1");
    }

    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> PaymobWebhook(CancellationToken ct)
    {
        using var reader = new System.IO.StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync(ct);
        Dictionary<string, string> parsed;
        try
        {
            parsed = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(body)
                     ?? new Dictionary<string, string>();
        }
        catch
        {
            return Ok(); // always 200 so Paymob doesn't retry on bad payload
        }
        await _paymentService.ProcessPaymobCallbackAsync(parsed, ct);
        return Ok();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{bookingId}/refund")]
    public async Task<ActionResult<RefundResponse>> AdminRefund(Guid bookingId, [FromBody] AdminRefundRequest request, CancellationToken ct)
    {
        var adminId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
        var result = await _paymentService.RefundAsync(bookingId, adminId, isAdmin: true, adminOverrideAmount: request.Amount, ct);
        return Ok(result);
    }
}

public record AdminRefundRequest(decimal? Amount);
