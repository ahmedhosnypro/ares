using System.Threading.Tasks;

namespace Backend.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string message);
        Task SendHtmlEmailAsync(string toEmail, string subject, string title, string body, string buttonText, string buttonUrl);
    }
}
