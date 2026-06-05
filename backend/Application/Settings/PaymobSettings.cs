namespace Backend.Application.Settings;

public class PaymobSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public int IntegrationId { get; set; }
    public int IframeId { get; set; }
    public string HmacSecret { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://accept.paymob.com";
}
