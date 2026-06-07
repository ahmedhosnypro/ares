using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Domain.Events;
using MediatR;

namespace Backend.Application.Handlers.Bookings
{
    public class CustomerBookingConfirmationHandler : INotificationHandler<BookingCompletedEvent>
    {
        private readonly IEmailService _emailService;

        public CustomerBookingConfirmationHandler(IEmailService emailService)
        {
            _emailService = emailService;
        }

        public async Task Handle(BookingCompletedEvent notification, CancellationToken cancellationToken)
        {
            var subject = "Booking Confirmation - Ares Car Rental";
            var title = $"Thank you for your booking, {notification.CustomerName}!";
            
            var body = $@"
                <p>Your booking for the vehicle <strong>{notification.VehicleName}</strong> has been successfully confirmed.</p>
                <p><strong>Booking Details:</strong></p>
                <ul>
                    <li><strong>Start Date:</strong> {notification.StartDate:MMMM dd, yyyy}</li>
                    <li><strong>End Date:</strong> {notification.EndDate:MMMM dd, yyyy}</li>
                    <li><strong>Total Amount Paid:</strong> ${notification.TotalAmount:F2}</li>
                </ul>
                <p>You can view your booking details and manage your trip anytime by clicking the link below.</p>";

            var buttonText = "View Booking Details";
            var buttonUrl = $"https://arescarrental.com/bookings/{notification.BookingId}";

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
