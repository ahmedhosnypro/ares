using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace Backend.Application.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendEmailAsync(string to, string subject, string message)
    {
        // قراءة الإعدادات من Configuration
        var host = _configuration["EmailSettings:SmtpHost"];
        var portStr = _configuration["EmailSettings:SmtpPort"];
        var port = string.IsNullOrEmpty(portStr) ? 587 : int.Parse(portStr);
        var senderEmail = _configuration["EmailSettings:SenderEmail"];
        var appPassword = _configuration["EmailSettings:AppPassword"];
        var senderName = _configuration["EmailSettings:SenderName"];

        if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(appPassword))
        {
            throw new InvalidOperationException("Email settings are not fully configured in appsettings.json or environment variables.");
        }

        // إعداد الـ SMTP Client
        using var smtpClient = new SmtpClient(host)
        {
            Port = port,
            Credentials = new NetworkCredential(senderEmail, appPassword),
            EnableSsl = true,
        };

        // تجهيز الرسالة
        using var mailMessage = new MailMessage
        {
            From = new MailAddress(senderEmail, senderName),
            Subject = subject,
            Body = message,
            IsBodyHtml = true, // تفعيل HTML لظهور الروابط بشكل أفضل
        };

        mailMessage.To.Add(to);

        // إرسال الرسالة
        await smtpClient.SendMailAsync(mailMessage);
    }
}