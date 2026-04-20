using System.Threading.Tasks;

namespace Backend.Application.Services;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string message);
}
