using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Data.Repositories
{
    public class DriverRequestRepository : IDriverRequestRepository
    {
        private readonly ApplicationDbContext _context;

        public DriverRequestRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DriverRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.DriverRequests.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<DriverRequest>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _context.DriverRequests.ToListAsync(cancellationToken);
        }

        public async Task<DriverRequest> AddAsync(DriverRequest entity, CancellationToken cancellationToken = default)
        {
            await _context.DriverRequests.AddAsync(entity, cancellationToken);
            return entity;
        }

        public Task UpdateAsync(DriverRequest entity, CancellationToken cancellationToken = default)
        {
            _context.DriverRequests.Update(entity);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(DriverRequest entity, CancellationToken cancellationToken = default)
        {
            _context.DriverRequests.Remove(entity);
            return Task.CompletedTask;
        }

        public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.DriverRequests.AnyAsync(x => x.Id == id, cancellationToken);
        }

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<DriverRequest?> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
        {
            return await _context.DriverRequests
                .Include(x => x.PickupServiceArea)
                .Include(x => x.Booking)
                .FirstOrDefaultAsync(x => x.BookingId == bookingId && x.Status == DriverRequestStatus.Open, cancellationToken);
        }

        public async Task<IEnumerable<DriverRequest>> GetOpenRequestsForServiceAreaAsync(Guid serviceAreaId, CancellationToken cancellationToken = default)
        {
            return await _context.DriverRequests
                .Include(x => x.Booking)
                .Where(x => x.Status == DriverRequestStatus.Open && x.PickupServiceAreaId == serviceAreaId && x.ExpiresAt > DateTime.UtcNow)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<DriverRequest>> GetExpiredRequestsAsync(CancellationToken cancellationToken = default)
        {
            return await _context.DriverRequests
                .Where(x => x.Status == DriverRequestStatus.Open && x.ExpiresAt <= DateTime.UtcNow)
                .ToListAsync(cancellationToken);
        }

        public async Task<DriverRequest?> GetByIdWithResponsesAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.DriverRequests
                .Include(x => x.Responses)
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<DriverRequest>> GetRequestsRespondedByDriverAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            return await _context.DriverRequests
                .Include(x => x.Booking)
                .Where(x => x.Responses.Any(r => r.DriverProfileId == driverProfileId))
                .ToListAsync(cancellationToken);
        }
    }
}
