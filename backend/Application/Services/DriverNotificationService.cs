using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;

namespace Backend.Application.Services
{
    /// <summary>
    /// Canonical notification type strings for the Driver Module. Kept as
    /// constants so callers and the frontend share one vocabulary.
    /// </summary>
    public static class DriverNotificationTypes
    {
        public const string DriverRequestNew = "DriverRequestNew";
        public const string DriverApproved = "DriverApproved";
        public const string DriverRejected = "DriverRejected";
        public const string DriverAssigned = "DriverAssigned";
        public const string DriverRemoved = "DriverRemoved";
        public const string DriverCancelled = "DriverCancelled";
        public const string NoDriverAvailable = "NoDriverAvailable";
        public const string DriverRequestExpired = "DriverRequestExpired";
        public const string DriverSelected = "DriverSelected";
    }

    /// <summary>
    /// Thin, best-effort wrapper over <see cref="INotificationService"/> for the
    /// Driver Module. Every send is wrapped in try/catch so a notification
    /// failure never rolls back the surrounding business operation (matching the
    /// existing platform pattern).
    /// </summary>
    public class DriverNotificationService : IDriverNotificationService
    {
        private readonly INotificationService _notifications;

        public DriverNotificationService(INotificationService notifications)
        {
            _notifications = notifications;
        }

        private async Task SafeSendAsync(Guid userId, string title, string message, string type, CancellationToken ct)
        {
            try
            {
                await _notifications.CreateNotificationAsync(userId, title, message, type, ct);
            }
            catch
            {
                // best-effort: swallow so the business operation is not rolled back
            }
        }

        public async Task NotifyDriversOfNewRequestAsync(DriverRequest request, IEnumerable<Guid> eligibleDriverUserIds, CancellationToken cancellationToken = default)
        {
            if (eligibleDriverUserIds == null) return;
            foreach (var userId in eligibleDriverUserIds)
            {
                await SafeSendAsync(userId,
                    "New driver request",
                    "A customer is looking for a driver in your work area. Open the request to express interest.",
                    DriverNotificationTypes.DriverRequestNew, cancellationToken);
            }
        }

        public Task NotifyDriverApprovedAsync(Guid driverUserId, CancellationToken cancellationToken = default) =>
            SafeSendAsync(driverUserId,
                "Profile approved",
                "Your driver profile has been verified. Set yourself Available to start receiving requests.",
                DriverNotificationTypes.DriverApproved, cancellationToken);

        public Task NotifyDriverRejectedAsync(Guid driverUserId, string reason, CancellationToken cancellationToken = default) =>
            SafeSendAsync(driverUserId,
                "Profile rejected",
                string.IsNullOrWhiteSpace(reason)
                    ? "Your driver profile was rejected. Please review and resubmit."
                    : $"Your driver profile was rejected: {reason}. Please correct and resubmit.",
                DriverNotificationTypes.DriverRejected, cancellationToken);

        public Task NotifyDriverAssignedAsync(Guid driverUserId, Booking booking, CancellationToken cancellationToken = default) =>
            SafeSendAsync(driverUserId,
                "You've been selected",
                $"A customer selected you for a booking starting {booking?.PickupDate:yyyy-MM-dd}. Check your assignments.",
                DriverNotificationTypes.DriverAssigned, cancellationToken);

        public Task NotifyDriverRemovedAsync(Guid driverUserId, Booking booking, CancellationToken cancellationToken = default) =>
            SafeSendAsync(driverUserId,
                "Assignment removed",
                "The customer changed their driver selection. You are no longer assigned to this booking.",
                DriverNotificationTypes.DriverRemoved, cancellationToken);

        public Task NotifyCustomerDriverCancelledAsync(Guid customerId, Booking booking, CancellationToken cancellationToken = default) =>
            SafeSendAsync(customerId,
                "Driver cancelled",
                "Your assigned driver cancelled. We've re-opened the search so another driver can be selected.",
                DriverNotificationTypes.DriverCancelled, cancellationToken);

        public Task NotifyCustomerNoDriverAvailableAsync(Guid customerId, Booking booking, CancellationToken cancellationToken = default) =>
            SafeSendAsync(customerId,
                "No driver available",
                "No driver accepted your request in time. You can retry the driver search from your booking.",
                DriverNotificationTypes.NoDriverAvailable, cancellationToken);

        public async Task NotifyOtherDriversNotSelectedAsync(IEnumerable<Guid> otherDriverUserIds, Booking booking, CancellationToken cancellationToken = default)
        {
            if (otherDriverUserIds == null) return;
            foreach (var userId in otherDriverUserIds)
            {
                await SafeSendAsync(userId,
                    "Request closed",
                    "The customer selected another driver for this request. Thanks for your interest.",
                    DriverNotificationTypes.DriverSelected, cancellationToken);
            }
        }

        public Task NotifyCustomerDriverAcceptedAsync(Guid customerId, Booking booking, CancellationToken cancellationToken = default) =>
            SafeSendAsync(customerId,
                "Driver Available",
                "A driver has accepted your request! You can now review their profile and select them for your booking.",
                DriverNotificationTypes.DriverRequestNew, cancellationToken);
    }
}
