using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Domain.Entities;

namespace Backend.Application.Interfaces
{
    public interface IDriverReviewRepository : IRepository<DriverReview>
    {
        Task<IEnumerable<DriverReview>> GetByDriverProfileIdAsync(Guid driverProfileId, CancellationToken cancellationToken = default);
        Task<DriverReview?> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default);
        Task<(double AverageRating, int TotalReviews)> GetDriverRatingStatsAsync(Guid driverProfileId, CancellationToken cancellationToken = default);
    }
}
