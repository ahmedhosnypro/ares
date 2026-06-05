using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Domain.Entities;

namespace Backend.Application.Interfaces
{
    public interface IDriverNotificationService
    {
        Task NotifyDriversOfNewRequestAsync(DriverRequest request, IEnumerable<Guid> eligibleDriverUserIds, CancellationToken cancellationToken = default);
        Task NotifyDriverApprovedAsync(Guid driverUserId, CancellationToken cancellationToken = default);
        Task NotifyDriverRejectedAsync(Guid driverUserId, string reason, CancellationToken cancellationToken = default);
        Task NotifyDriverAssignedAsync(Guid driverUserId, Booking booking, CancellationToken cancellationToken = default);
        Task NotifyDriverRemovedAsync(Guid driverUserId, Booking booking, CancellationToken cancellationToken = default);
        Task NotifyCustomerDriverCancelledAsync(Guid customerId, Booking booking, CancellationToken cancellationToken = default);
        Task NotifyCustomerNoDriverAvailableAsync(Guid customerId, Booking booking, CancellationToken cancellationToken = default);
        Task NotifyOtherDriversNotSelectedAsync(IEnumerable<Guid> otherDriverUserIds, Booking booking, CancellationToken cancellationToken = default);
        Task NotifyCustomerDriverAcceptedAsync(Guid customerId, Booking booking, CancellationToken cancellationToken = default);
    }
}
