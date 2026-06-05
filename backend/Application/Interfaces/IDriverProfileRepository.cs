using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Domain.Entities;

namespace Backend.Application.Interfaces
{
    public interface IDriverProfileRepository : IRepository<DriverProfile>
    {
        Task<IEnumerable<DriverProfile>> GetAllWithUserAsync(CancellationToken cancellationToken = default);
        Task<DriverProfile?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<DriverProfile?> GetByUserIdWithWorkAreasAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<DriverProfile?> GetByIdWithWorkAreasAsync(Guid id, CancellationToken cancellationToken = default);
        Task<DriverProfile?> GetByIdWithUserAsync(Guid id, CancellationToken cancellationToken = default);
        Task<IEnumerable<DriverProfile>> GetPendingVerificationAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// True if the driver already has a non-cancelled booking whose
        /// [PickupDate, ReturnDate] window overlaps the supplied window.
        /// Used to prevent double-booking / overlapping assignments.
        /// </summary>
        Task<bool> HasOverlappingAssignmentAsync(Guid driverProfileId, DateTime pickup, DateTime ret, Guid? excludeBookingId = null, CancellationToken cancellationToken = default);

        /// <summary>
        /// Verified, available, active drivers whose work areas include the
        /// given service area. Includes the owning User so callers can notify.
        /// </summary>
        Task<IEnumerable<DriverProfile>> GetEligibleDriversForServiceAreaAsync(Guid serviceAreaId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Verified, available, active drivers who do NOT already have a
        /// non-cancelled assignment overlapping the supplied [pickup, return]
        /// window. Includes the owning User. Powers the customer-facing driver
        /// catalog shown during checkout (direct-pick model). Unlike
        /// <see cref="GetEligibleDriversForServiceAreaAsync"/> this is not scoped
        /// to a single service area so the customer sees every selectable driver.
        /// </summary>
        Task<IEnumerable<DriverProfile>> GetAvailableDriversForWindowAsync(DateTime pickup, DateTime ret, CancellationToken cancellationToken = default);
    }
}
