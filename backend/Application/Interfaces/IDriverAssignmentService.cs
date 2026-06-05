using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Driver;

namespace Backend.Application.Interfaces
{
    public interface IDriverAssignmentService
    {
        Task<IEnumerable<DriverAssignmentDto>> GetDriverAssignmentsAsync(Guid driverProfileId, CancellationToken cancellationToken = default);
        Task SelectDriverAsync(Guid bookingId, Guid driverProfileId, Guid customerId, CancellationToken cancellationToken = default);
        Task ChangeDriverAsync(Guid bookingId, ChangeDriverRequest request, Guid customerId, CancellationToken cancellationToken = default);
        Task CancelDriverAsync(Guid bookingId, Guid customerId, CancellationToken cancellationToken = default);
        Task DriverCancelAssignmentAsync(Guid bookingId, Guid driverProfileId, CancellationToken cancellationToken = default);
    }
}
