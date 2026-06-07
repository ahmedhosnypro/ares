using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Domain.Events;
using MediatR;

namespace Backend.Application.Handlers.Bookings
{
    public class CustomerReviewReminderHandler : INotificationHandler<TripEndedEvent>
    {
        private readonly IEmailService _emailService;

        public CustomerReviewReminderHandler(IEmailService emailService)
        {
            _emailService = emailService;
        }

        public async Task Handle(TripEndedEvent notification, CancellationToken cancellationToken)
        {
            var subject = "How was your ride? Share your review! - Ares Car Rental";
            var title = $"How was your trip with {notification.VehicleName}?";

            var body = $@"
                <p>Hello {notification.CustomerName},</p>
                <p>We hope you had a safe and comfortable trip using Ares Car Rental!</p>
                <p>Your feedback is highly valuable to us and the car owner. Please take a quick moment to rate your experience and write a review.</p>";

            var buttonText = "Write a Review";
            var buttonUrl = $"https://arescarrental.com/bookings/{notification.BookingId}/review";

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
