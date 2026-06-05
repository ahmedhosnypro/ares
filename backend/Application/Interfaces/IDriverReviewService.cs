using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Driver;

namespace Backend.Application.Interfaces
{
    public interface IDriverReviewService
    {
        Task<IEnumerable<DriverReviewDto>> GetReviewsForDriverAsync(Guid driverProfileId, CancellationToken cancellationToken = default);
        Task<DriverReviewDto> CreateReviewAsync(Guid bookingId, CreateDriverReviewRequest request, Guid customerId, CancellationToken cancellationToken = default);
    }
}
