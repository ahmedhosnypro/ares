using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Backend.Infrastructure.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public SmtpEmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string message)
        {
            var (smtpClient, mailMessage) = CreateMailMessage(toEmail, subject, message, isHtml: true);
            using (smtpClient)
            using (mailMessage)
            {
                await smtpClient.SendMailAsync(mailMessage);
            }
        }

        public async Task SendHtmlEmailAsync(string toEmail, string subject, string title, string body, string buttonText, string buttonUrl)
        {
            var formattedBody = WrapInHtmlTemplate(title, body, buttonText, buttonUrl);
            var (smtpClient, mailMessage) = CreateMailMessage(toEmail, subject, formattedBody, isHtml: true);
            using (smtpClient)
            using (mailMessage)
            {
                await smtpClient.SendMailAsync(mailMessage);
            }
        }

        private (SmtpClient SmtpClient, MailMessage MailMessage) CreateMailMessage(string toEmail, string subject, string body, bool isHtml)
        {
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

            var smtpClient = new SmtpClient(host)
            {
                Port = port,
                Credentials = new NetworkCredential(senderEmail, appPassword),
                EnableSsl = true,
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml,
            };

            mailMessage.To.Add(toEmail);

            return (smtpClient, mailMessage);
        }

        private string WrapInHtmlTemplate(string title, string body, string buttonText, string buttonUrl)
        {
            var ctaButtonHtml = string.Empty;
            if (!string.IsNullOrEmpty(buttonText) && !string.IsNullOrEmpty(buttonUrl))
            {
                ctaButtonHtml = $@"
                    <div class=""cta-container"">
                        <a href=""{buttonUrl}"" class=""cta-button"">{buttonText}</a>
                    </div>";
            }

            return $@"<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>{title}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            color: #333333;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }}
        .wrapper {{
            width: 100%;
            table-layout: fixed;
            background-color: #f8f9fa;
            padding: 40px 0;
        }}
        .container {{
            max-width: 600px;
            background-color: #ffffff;
            margin: 0 auto;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            border: 1px solid #e9ecef;
            overflow: hidden;
        }}
        .header {{
            background-color: #1a252f;
            padding: 30px;
            text-align: center;
            color: #ffffff;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            letter-spacing: 1px;
        }}
        .content {{
            padding: 40px 30px;
            line-height: 1.6;
        }}
        .content h2 {{
            margin-top: 0;
            color: #1a252f;
            font-size: 20px;
            font-weight: 600;
        }}
        .content p {{
            font-size: 16px;
            color: #495057;
            margin: 0 0 20px 0;
        }}
        .cta-container {{
            text-align: center;
            margin: 35px 0 15px 0;
        }}
        .cta-button {{
            display: inline-block;
            background-color: #ff5a5f;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 30px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(255, 90, 95, 0.2);
        }}
        .footer {{
            background-color: #f1f3f5;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #868e96;
            border-top: 1px solid #e9ecef;
        }}
        .footer p {{
            margin: 5px 0;
        }}
    </style>
</head>
<body>
    <div class=""wrapper"">
        <div class=""container"">
            <div class=""header"">
                <h1>ARES CAR RENTAL</h1>
            </div>
            <div class=""content"">
                <h2>{title}</h2>
                <div>{body}</div>
                {ctaButtonHtml}
            </div>
            <div class=""footer"">
                <p>&copy; 2026 Ares Car Rental. All rights reserved.</p>
                <p>If you have any questions, please contact our support team.</p>
            </div>
        </div>
    </div>
</body>
</html>";
        }
    }
}
