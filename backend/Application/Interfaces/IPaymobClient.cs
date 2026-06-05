namespace Backend.Application.Interfaces;

public record PaymobBillingData(
    string FirstName,
    string LastName,
    string Email,
    string PhoneNumber,
    string Country = "EG",
    string City = "Cairo",
    string Street = "NA",
    string BuildingNumber = "NA",
    string FloorNumber = "NA",
    string ApartmentNumber = "NA",
    string PostalCode = "NA",
    string State = "NA"
);

public interface IPaymobClient
{
    Task<string> GetAuthTokenAsync(CancellationToken ct = default);
    Task<string> CreateOrderAsync(string authToken, long amountCents, string currency, string merchantOrderId, CancellationToken ct = default);
    Task<string> RequestPaymentKeyAsync(string authToken, string orderId, long amountCents, string currency, int integrationId, PaymobBillingData billing, CancellationToken ct = default);
    Task<bool> RefundAsync(string authToken, long paymobTransactionId, long amountCents, CancellationToken ct = default);
}
