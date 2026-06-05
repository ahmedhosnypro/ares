using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Driver;

namespace Backend.Application.Interfaces
{
    public interface IDriverRequestService
    {
        Task<IEnumerable<DriverRequestDto>> GetAvailableRequestsAsync(Guid driverProfileId, CancellationToken cancellationToken = default);
        Task<IEnumerable<DriverRequestDto>> GetMyRequestsAsync(Guid driverProfileId, CancellationToken cancellationToken = default);
        Task AcceptRequestAsync(Guid driverProfileId, Guid requestId, CancellationToken cancellationToken = default);
        Task DeclineRequestAsync(Guid driverProfileId, Guid requestId, CancellationToken cancellationToken = default);
        Task<IEnumerable<PublicDriverDto>> GetInterestedDriversAsync(Guid bookingId, Guid customerId, CancellationToken cancellationToken = default);
        Task RetryRequestAsync(Guid bookingId, Guid customerId, CancellationToken cancellationToken = default);
        Task ProcessExpirationsAsync(CancellationToken cancellationToken = default);
        Task CheckAndEmitRequestAsync(Guid bookingId, CancellationToken cancellationToken = default);
    }
}
