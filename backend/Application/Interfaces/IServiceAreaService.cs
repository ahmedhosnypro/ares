using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Driver;

namespace Backend.Application.Interfaces
{
    public interface IServiceAreaService
    {
        Task<IEnumerable<ServiceAreaDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<ServiceAreaDto> CreateAsync(ServiceAreaDto request, CancellationToken cancellationToken = default);
        Task<ServiceAreaDto> UpdateAsync(Guid id, ServiceAreaDto request, CancellationToken cancellationToken = default);
        Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    }
}
