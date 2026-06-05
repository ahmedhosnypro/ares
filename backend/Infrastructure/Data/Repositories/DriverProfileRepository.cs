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
    public class DriverProfileRepository : IDriverProfileRepository
    {
        private readonly ApplicationDbContext _context;

        public DriverProfileRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DriverProfile?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.DriverProfiles.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<DriverProfile>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _context.DriverProfiles.ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<DriverProfile>> GetAllWithUserAsync(CancellationToken cancellationToken = default)
        {
            return await _context.DriverProfiles
                .Include(x => x.User)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task<DriverProfile> AddAsync(DriverProfile entity, CancellationToken cancellationToken = default)
        {
            await _context.DriverProfiles.AddAsync(entity, cancellationToken);
            return entity;
        }

        public Task UpdateAsync(DriverProfile entity, CancellationToken cancellationToken = default)
        {
            _context.DriverProfiles.Update(entity);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(DriverProfile entity, CancellationToken cancellationToken = default)
        {
            _context.DriverProfiles.Remove(entity);
            return Task.CompletedTask;
        }

        public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.DriverProfiles.AnyAsync(x => x.Id == id, cancellationToken);
        }

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<DriverProfile?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.DriverProfiles
                .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        }

        public async Task<DriverProfile?> GetByUserIdWithWorkAreasAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await _context.DriverProfiles
                .Include(x => x.User)
                .Include(x => x.WorkAreas)
                .ThenInclude(wa => wa.ServiceArea)
                .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        }

        public async Task<DriverProfile?> GetByIdWithWorkAreasAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.DriverProfiles
                .Include(x => x.User)
                .Include(x => x.WorkAreas)
                .ThenInclude(wa => wa.ServiceArea)
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        }

        public async Task<IEnumerable<DriverProfile>> GetPendingVerificationAsync(CancellationToken cancellationToken = default)
        {
            return await _context.DriverProfiles
                .Include(x => x.User)
                .Where(x => x.Status == DriverProfileStatus.PendingVerification)
                .ToListAsync(cancellationToken);
        }

        public async Task<DriverProfile?> GetByIdWithUserAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _context.DriverProfiles
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        }

        public async Task<bool> HasOverlappingAssignmentAsync(Guid driverProfileId, DateTime pickup, DateTime ret, Guid? excludeBookingId = null, CancellationToken cancellationToken = default)
        {
            // Active assignment statuses that should block a new overlapping booking.
            var blocking = new[]
            {
                BookingStatus.Confirmed,
                BookingStatus.Active,
                BookingStatus.PaymentPending
            };

            return await _context.Bookings.AnyAsync(b =>
                b.AssignedDriverProfileId == driverProfileId
                && (excludeBookingId == null || b.Id != excludeBookingId)
                && blocking.Contains(b.Status)
                && b.PickupDate.HasValue && b.ReturnDate.HasValue
                // standard half-open interval overlap: existing.start < new.end && existing.end > new.start
                && b.PickupDate.Value < ret
                && b.ReturnDate.Value > pickup,
                cancellationToken);
        }

        public async Task<IEnumerable<DriverProfile>> GetEligibleDriversForServiceAreaAsync(Guid serviceAreaId, CancellationToken cancellationToken = default)
        {
            return await _context.DriverProfiles
                .Include(x => x.User)
                .Where(x => x.Status == DriverProfileStatus.Verified
                            && x.Availability == DriverAvailability.Available
                            && x.IsActive
                            && x.WorkAreas.Any(wa => wa.ServiceAreaId == serviceAreaId))
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<DriverProfile>> GetAvailableDriversForWindowAsync(DateTime pickup, DateTime ret, CancellationToken cancellationToken = default)
        {
            // Same "active assignment" statuses used by the overlap check, so a
            // driver already committed to an overlapping booking is hidden from
            // the catalog.
            var blocking = new[]
            {
                BookingStatus.Confirmed,
                BookingStatus.Active,
                BookingStatus.PaymentPending
            };

            return await _context.DriverProfiles
                .Include(x => x.User)
                .Where(x => x.Status == DriverProfileStatus.Verified
                            && x.Availability == DriverAvailability.Available
                            && x.IsActive
                            && !_context.Bookings.Any(b =>
                                b.AssignedDriverProfileId == x.Id
                                && blocking.Contains(b.Status)
                                && b.PickupDate.HasValue && b.ReturnDate.HasValue
                                // half-open interval overlap
                                && b.PickupDate.Value < ret
                                && b.ReturnDate.Value > pickup))
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync(cancellationToken);
        }
    }
}
