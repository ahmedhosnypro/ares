using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.UserManagement;

namespace Backend.Application.Services;

/// <summary>
/// Service interface for driver management operations (admin functionality)
/// </summary>
public interface IDriverService
{
    /// <summary>
    /// Enriches driver user records with profile information and aggregate statistics.
    /// </summary>
    Task<List<UserManagementDto>> EnrichDriversAsync(
        List<UserManagementDto> users,
        CancellationToken cancellationToken = default);
}
