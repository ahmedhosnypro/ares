using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Domain.Events;
using MediatR;

namespace Backend.Application.Handlers.Bookings
{
    public class CustomerCancellationHandler : INotificationHandler<BookingCanceledEvent>
    {
        private readonly IEmailService _emailService;

        public CustomerCancellationHandler(IEmailService emailService)
        {
            _emailService = emailService;
        }

        public async Task Handle(BookingCanceledEvent notification, CancellationToken cancellationToken)
        {
            var subject = "Booking Cancellation Confirmed - Ares Car Rental";
            var title = "Your booking cancellation is complete";

            var body = $@"
                <p>Hello {notification.CustomerName},</p>
                <p>As requested, your booking for the vehicle <strong>{notification.VehicleName}</strong> has been cancelled.</p>
                <p><strong>Refund Details:</strong></p>
                <ul>
                    <li><strong>Refund Amount:</strong> ${notification.RefundAmount:F2}</li>
                </ul>
                <p>Refunds are usually processed within 5-10 business days depending on your financial institution.</p>
                <p>If you have any questions or need further assistance, please contact support.</p>";

            var buttonText = "Go to Dashboard";
            var buttonUrl = "https://arescarrental.com/dashboard";

            await _emailService.SendHtmlEmailAsync(
                notification.CustomerEmail,
                subject,
                title,
                body,
                buttonText,
                buttonUrl);
        }
    }
}
