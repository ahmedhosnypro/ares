using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Domain.Entities;

namespace Backend.Application.Interfaces
{
    public interface IDriverRequestRepository : IRepository<DriverRequest>
    {
        Task<DriverRequest?> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default);
        Task<IEnumerable<DriverRequest>> GetOpenRequestsForServiceAreaAsync(Guid serviceAreaId, CancellationToken cancellationToken = default);
        Task<IEnumerable<DriverRequest>> GetExpiredRequestsAsync(CancellationToken cancellationToken = default);
        Task<DriverRequest?> GetByIdWithResponsesAsync(Guid id, CancellationToken cancellationToken = default);
        Task<IEnumerable<DriverRequest>> GetRequestsRespondedByDriverAsync(Guid driverProfileId, CancellationToken cancellationToken = default);
    }
}
