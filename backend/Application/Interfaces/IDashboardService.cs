using Backend.Application.DTOs.Dashboard;

namespace Backend.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(Guid? supplierId, CancellationToken cancellationToken = default);
}
