using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Driver;
using Backend.Domain.Entities.Enums;

namespace Backend.Application.Interfaces
{
    public interface IDriverProfileService
    {
        Task<DriverProfileStatusDto> GetStatusAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<DriverProfileDetailsDto> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<DriverProfileDetailsDto> CompleteProfileAsync(Guid userId, CompleteDriverProfileRequest request, CancellationToken cancellationToken = default);
        Task<DriverProfileStatusDto> UpdateAvailabilityAsync(Guid userId, UpdateDriverAvailabilityRequest request, CancellationToken cancellationToken = default);
    }
}
