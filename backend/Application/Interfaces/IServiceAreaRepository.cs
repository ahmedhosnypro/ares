using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Domain.Entities;

namespace Backend.Application.Interfaces
{
    public interface IServiceAreaRepository : IRepository<ServiceArea>
    {
        Task<ServiceArea?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
        Task<IEnumerable<ServiceArea>> GetActiveAreasAsync(CancellationToken cancellationToken = default);
    }
}
