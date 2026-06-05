using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Driver;

namespace Backend.Application.Interfaces
{
    public interface IAdminDriverService
    {
        Task<IEnumerable<AdminDriverListItemDto>> GetDriversAsync(string? status, CancellationToken cancellationToken = default);
        Task<IEnumerable<AdminDriverListItemDto>> GetPendingDriversAsync(CancellationToken cancellationToken = default);
        Task<AdminDriverDetailsDto> GetDriverDetailsAsync(Guid driverProfileId, CancellationToken cancellationToken = default);
        Task ApproveDriverAsync(Guid driverProfileId, Guid adminId, CancellationToken cancellationToken = default);
        Task RejectDriverAsync(Guid driverProfileId, AdminRejectDriverRequest request, Guid adminId, CancellationToken cancellationToken = default);
        Task EnableDriverAsync(Guid driverProfileId, Guid adminId, CancellationToken cancellationToken = default);
        Task DisableDriverAsync(Guid driverProfileId, Guid adminId, CancellationToken cancellationToken = default);
    }
}
