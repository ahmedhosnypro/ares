using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Backend.Application.Interfaces;

namespace Backend.Application.Services;

public class DevelopmentEmailService : IEmailService
{
    private readonly ILogger<DevelopmentEmailService> _logger;

    public DevelopmentEmailService(ILogger<DevelopmentEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendEmailAsync(string toEmail, string subject, string message)
    {
        _logger.LogInformation("========== SIMULATED EMAIL ==========");
        _logger.LogInformation("To: {ToEmail}", toEmail);
        _logger.LogInformation("Subject: {Subject}", subject);
        _logger.LogInformation("Message:\n{Message}", message);
        _logger.LogInformation("=====================================");

        return Task.CompletedTask;
    }

    public Task SendHtmlEmailAsync(string toEmail, string subject, string title, string body, string buttonText, string buttonUrl)
    {
        _logger.LogInformation("========== SIMULATED HTML EMAIL ==========");
        _logger.LogInformation("To: {ToEmail}", toEmail);
        _logger.LogInformation("Subject: {Subject}", subject);
        _logger.LogInformation("Title: {Title}", title);
        _logger.LogInformation("Body: {Body}", body);
        _logger.LogInformation("Button: {ButtonText} ({ButtonUrl})", buttonText, buttonUrl);
        _logger.LogInformation("==========================================");

        return Task.CompletedTask;
    }
}
