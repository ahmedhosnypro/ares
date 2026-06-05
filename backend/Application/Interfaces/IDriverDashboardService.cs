using System;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Driver;

namespace Backend.Application.Interfaces
{
    public interface IDriverDashboardService
    {
        Task<DriverDashboardSummaryDto> GetSummaryAsync(Guid driverProfileId, CancellationToken cancellationToken = default);
    }
}
