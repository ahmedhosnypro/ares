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
    public class DriverReviewRepository : IDriverReviewRepository
    {
        private readonly ApplicationDbContext _context;

        public DriverReviewRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DriverReview?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.DriverReviews.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<DriverReview>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _context.DriverReviews.ToListAsync(cancellationToken);
        }

        public async Task<DriverReview> AddAsync(DriverReview entity, CancellationToken cancellationToken = default)
        {
            await _context.DriverReviews.AddAsync(entity, cancellationToken);
            return entity;
        }

        public Task UpdateAsync(DriverReview entity, CancellationToken cancellationToken = default)
        {
            _context.DriverReviews.Update(entity);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(DriverReview entity, CancellationToken cancellationToken = default)
        {
            _context.DriverReviews.Remove(entity);
            return Task.CompletedTask;
        }

        public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.DriverReviews.AnyAsync(x => x.Id == id, cancellationToken);
        }

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<IEnumerable<DriverReview>> GetByDriverProfileIdAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            return await _context.DriverReviews
                .Include(x => x.Customer)
                .Where(x => x.DriverProfileId == driverProfileId)
                .ToListAsync(cancellationToken);
        }

        public async Task<DriverReview?> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
        {
            return await _context.DriverReviews.FirstOrDefaultAsync(x => x.BookingId == bookingId, cancellationToken);
        }

        public async Task<(double AverageRating, int TotalReviews)> GetDriverRatingStatsAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            var query = _context.DriverReviews.Where(x => x.DriverProfileId == driverProfileId);
            var count = await query.CountAsync(cancellationToken);
            if (count == 0) return (0, 0);

            var avg = await query.AverageAsync(x => (double)x.Rating, cancellationToken);
            return (avg, count);
        }
    }
}
