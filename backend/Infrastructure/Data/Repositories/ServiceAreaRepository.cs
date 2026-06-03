using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Data.Repositories
{
    public class ServiceAreaRepository : IServiceAreaRepository
    {
        private readonly ApplicationDbContext _context;

        public ServiceAreaRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceArea?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.ServiceAreas.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<ServiceArea>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _context.ServiceAreas.ToListAsync(cancellationToken);
        }

        public async Task<ServiceArea> AddAsync(ServiceArea entity, CancellationToken cancellationToken = default)
        {
            await _context.ServiceAreas.AddAsync(entity, cancellationToken);
            return entity;
        }

        public Task UpdateAsync(ServiceArea entity, CancellationToken cancellationToken = default)
        {
            _context.ServiceAreas.Update(entity);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(ServiceArea entity, CancellationToken cancellationToken = default)
        {
            _context.ServiceAreas.Remove(entity);
            return Task.CompletedTask;
        }

        public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.ServiceAreas.AnyAsync(x => x.Id == id, cancellationToken);
        }

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<ServiceArea?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
        {
            return await _context.ServiceAreas.FirstOrDefaultAsync(x => x.Name == name, cancellationToken);
        }

        public async Task<IEnumerable<ServiceArea>> GetActiveAreasAsync(CancellationToken cancellationToken = default)
        {
            return await _context.ServiceAreas.Where(x => x.IsActive).ToListAsync(cancellationToken);
        }
    }
}
