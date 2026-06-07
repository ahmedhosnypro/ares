using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Domain.Events;
using MediatR;

namespace Backend.Application.Handlers.Bookings
{
    public class SupplierNewBookingHandler : INotificationHandler<BookingCompletedEvent>
    {
        private readonly IEmailService _emailService;

        public SupplierNewBookingHandler(IEmailService emailService)
        {
            _emailService = emailService;
        }

        public async Task Handle(BookingCompletedEvent notification, CancellationToken cancellationToken)
        {
            var subject = "Action Required: New Booking Confirmed - Ares Car Rental";
            var title = "You have a new vehicle booking!";

            var body = $@"
                <p>Hello,</p>
                <p>A new booking has been confirmed for your vehicle <strong>{notification.VehicleName}</strong>.</p>
                <p><strong>Booking Summary:</strong></p>
                <ul>
                    <li><strong>Customer Name:</strong> {notification.CustomerName}</li>
                    <li><strong>Start Date:</strong> {notification.StartDate:MMMM dd, yyyy}</li>
                    <li><strong>End Date:</strong> {notification.EndDate:MMMM dd, yyyy}</li>
                    <li><strong>Your Share / Total Value:</strong> ${notification.TotalAmount:F2}</li>
                </ul>
                <p>Please review and prepare the vehicle for pick-up according to the scheduled start date.</p>";

            var buttonText = "Manage Booking";
            var buttonUrl = $"https://arescarrental.com/bookings/{notification.BookingId}";

            await _emailService.SendHtmlEmailAsync(
                notification.SupplierEmail,
                subject,
                title,
                body,
                buttonText,
                buttonUrl);
        }
    }
}
