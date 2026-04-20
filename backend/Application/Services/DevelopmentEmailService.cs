using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

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
        // For development/simulation purposes, log the email to the console.
        _logger.LogInformation("========== SIMULATED EMAIL ==========");
        _logger.LogInformation("To: {ToEmail}", toEmail);
        _logger.LogInformation("Subject: {Subject}", subject);
        _logger.LogInformation("Message:\n{Message}", message);
        _logger.LogInformation("=====================================");

        return Task.CompletedTask;
    }
}
