using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Backend.Application.Interfaces;
using Backend.Application.Settings;
using Microsoft.Extensions.Options;

namespace Backend.Infrastructure.Services;

public class PaymobClient : IPaymobClient
{
    private readonly HttpClient _http;
    private readonly PaymobSettings _settings;

    public PaymobClient(HttpClient http, IOptions<PaymobSettings> options)
    {
        _http = http;
        _settings = options.Value;
        _http.BaseAddress = new Uri(_settings.BaseUrl);
    }

    public async Task<string> GetAuthTokenAsync(CancellationToken ct = default)
    {
        var response = await _http.PostAsJsonAsync("/api/auth/tokens", new { api_key = _settings.ApiKey }, ct);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        return result.GetProperty("token").GetString()!;
    }

    public async Task<string> CreateOrderAsync(string authToken, long amountCents, string currency, string merchantOrderId, CancellationToken ct = default)
    {
        var body = new
        {
            auth_token = authToken,
            delivery_needed = false,
            amount_cents = amountCents,
            currency,
            merchant_order_id = merchantOrderId,
            items = Array.Empty<object>()
        };
        var response = await _http.PostAsJsonAsync("/api/ecommerce/orders", body, ct);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        return result.GetProperty("id").GetInt64().ToString();
    }

    public async Task<string> RequestPaymentKeyAsync(string authToken, string orderId, long amountCents, string currency, int integrationId, PaymobBillingData billing, CancellationToken ct = default)
    {
        var body = new
        {
            auth_token = authToken,
            amount_cents = amountCents,
            expiration = 3600,
            order_id = orderId,
            currency,
            integration_id = integrationId,
            lock_order_when_paid = false,
            billing_data = new
            {
                first_name = billing.FirstName,
                last_name = billing.LastName,
                email = billing.Email,
                phone_number = billing.PhoneNumber,
                country = billing.Country,
                city = billing.City,
                street = billing.Street,
                building = billing.BuildingNumber,
                floor = billing.FloorNumber,
                apartment = billing.ApartmentNumber,
                postal_code = billing.PostalCode,
                state = billing.State
            }
        };
        var response = await _http.PostAsJsonAsync("/api/acceptance/payment_keys", body, ct);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        return result.GetProperty("token").GetString()!;
    }

    public async Task<bool> RefundAsync(string authToken, long paymobTransactionId, long amountCents, CancellationToken ct = default)
    {
        var body = new { auth_token = authToken, transaction_id = paymobTransactionId, amount_cents = amountCents };
        var response = await _http.PostAsJsonAsync("/api/acceptance/void_refund/refund", body, ct);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        return result.TryGetProperty("success", out var s) && s.GetBoolean();
    }

    public async Task<PaymobTransactionResult?> GetTransactionsByOrderIdAsync(string authToken, string orderId, CancellationToken ct = default)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, $"/api/acceptance/transactions?order_id={orderId}");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authToken);

        var response = await _http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
            return null;

        var result = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        if (!result.TryGetProperty("results", out var results) || results.ValueKind != JsonValueKind.Array || results.GetArrayLength() == 0)
            return null;

        // Try to find a successful transaction, otherwise take the first one (most recent usually)
        JsonElement? bestTx = null;
        foreach (var tx in results.EnumerateArray())
        {
            if (tx.TryGetProperty("success", out var s) && s.GetBoolean())
            {
                bestTx = tx;
                break;
            }
            if (bestTx == null) bestTx = tx;
        }

        if (bestTx == null) return null;

        var id = bestTx.Value.GetProperty("id").GetInt64();
        var success = bestTx.Value.GetProperty("success").GetBoolean();
        string? reason = null;
        if (bestTx.Value.TryGetProperty("data", out var data) && data.TryGetProperty("txn_response_code", out var rCode))
        {
            reason = rCode.GetString();
        }

        return new PaymobTransactionResult(id, success, reason);
    }

    public async Task<PaymobDisbursementResult> CreateDisbursementAsync(string authToken, long amountCents, string recipientWalletPhoneNumber, CancellationToken ct = default)
    {
        var body = new
        {
            auth_token = authToken,
            amount_cents = amountCents,
            recipient_wallet_phone = recipientWalletPhoneNumber,
            currency = "EGP"
        };
        var response = await _http.PostAsJsonAsync("/api/acceptance/delifracho/disbursements", body, ct);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(ct);
            return new PaymobDisbursementResult(0, false, $"HTTP {(int)response.StatusCode}: {errorContent}");
        }

        var result = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        var id = result.TryGetProperty("id", out var idProp) ? idProp.GetInt64() : 0;
        var success = result.TryGetProperty("success", out var s) && s.GetBoolean();
        string? reason = null;
        if (result.TryGetProperty("data", out var data) && data.TryGetProperty("txn_response_code", out var rCode))
        {
            reason = rCode.GetString();
        }

        return new PaymobDisbursementResult(id, success, reason);
    }
}
