using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Driver;
using Backend.Application.Interfaces;
using Backend.Domain.Entities.Enums;
using Backend.Application.Exceptions;

namespace Backend.Application.Services
{
    public class AdminDriverService : IAdminDriverService
    {
        private readonly IDriverProfileRepository _profileRepository;
        private readonly IDriverReviewRepository _reviewRepository;
        private readonly IDriverNotificationService _notificationService;

        public AdminDriverService(
            IDriverProfileRepository profileRepository,
            IDriverReviewRepository reviewRepository,
            IDriverNotificationService notificationService)
        {
            _profileRepository = profileRepository;
            _reviewRepository = reviewRepository;
            _notificationService = notificationService;
        }

        private async Task<AdminDriverListItemDto> ToListItemAsync(Domain.Entities.DriverProfile p, CancellationToken ct)
        {
            var (avg, count) = await _reviewRepository.GetDriverRatingStatsAsync(p.Id, ct);
            return new AdminDriverListItemDto
            {
                DriverProfileId = p.Id,
                UserId = p.UserId,
                FirstName = p.User?.FirstName,
                LastName = p.User?.LastName,
                Email = p.User?.Email,
                PhoneNumber = p.User?.PhoneNumber,
                Status = p.Status.ToString(),
                Availability = p.Availability.ToString(),
                IsActive = p.IsActive,
                AverageRating = avg,
                TotalTrips = count,
                CreatedAt = p.CreatedAt
            };
        }

        public async Task<IEnumerable<AdminDriverListItemDto>> GetDriversAsync(string? status, CancellationToken cancellationToken = default)
        {
            var profiles = await _profileRepository.GetAllWithUserAsync(cancellationToken);
            if (!string.IsNullOrEmpty(status) && Enum.TryParse<DriverProfileStatus>(status, true, out var parsedStatus))
            {
                profiles = profiles.Where(x => x.Status == parsedStatus);
            }

            var list = new List<AdminDriverListItemDto>();
            foreach (var p in profiles)
                list.Add(await ToListItemAsync(p, cancellationToken));
            return list;
        }

        public async Task<IEnumerable<AdminDriverListItemDto>> GetPendingDriversAsync(CancellationToken cancellationToken = default)
        {
            var pending = await _profileRepository.GetPendingVerificationAsync(cancellationToken);
            var list = new List<AdminDriverListItemDto>();
            foreach (var p in pending)
                list.Add(await ToListItemAsync(p, cancellationToken));
            return list;
        }

        public async Task<AdminDriverDetailsDto> GetDriverDetailsAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            var profile = await _profileRepository.GetByIdWithWorkAreasAsync(driverProfileId, cancellationToken);
            if (profile == null) throw new NotFoundException("Driver profile not found.");

            var (avg, count) = await _reviewRepository.GetDriverRatingStatsAsync(profile.Id, cancellationToken);

            return new AdminDriverDetailsDto
            {
                UserId = profile.UserId,
                FirstName = profile.User?.FirstName,
                LastName = profile.User?.LastName,
                Email = profile.User?.Email,
                PhoneNumber = profile.User?.PhoneNumber,
                ProfilePictureUrl = profile.User?.ProfileImage,
                LicenseNumber = profile.LicenseNumber,
                LicenseExpiryDate = profile.LicenseExpiryDate,
                LicenseImage = profile.LicenseImage,
                NationalIdFrontImage = profile.NationalIdFrontImage,
                NationalIdBackImage = profile.NationalIdBackImage,
                Address = profile.Address,
                EmergencyContactName = profile.EmergencyContactName,
                EmergencyContactPhone = profile.EmergencyContactPhone,
                Status = profile.Status,
                Availability = profile.Availability,
                IsActive = profile.IsActive,
                RejectionReason = profile.RejectionReason,
                LockedUntil = profile.LockedUntil,
                WorkAreas = profile.WorkAreas.Where(wa => wa.ServiceArea != null).Select(wa => new ServiceAreaDto
                {
                    Id = wa.ServiceArea!.Id,
                    Name = wa.ServiceArea.Name,
                    Governorate = wa.ServiceArea.Governorate,
                    IsActive = wa.ServiceArea.IsActive
                }).ToList(),
                TotalTrips = count,
                AverageRating = avg,
                CreatedAt = profile.CreatedAt,
                UpdatedAt = profile.UpdatedAt
            };
        }

        public async Task ApproveDriverAsync(Guid driverProfileId, Guid adminId, CancellationToken cancellationToken = default)
        {
            var profile = await _profileRepository.GetByIdAsync(driverProfileId, cancellationToken);
            if (profile == null) throw new NotFoundException("Driver profile not found.");

            profile.Status = DriverProfileStatus.Verified;
            profile.ReviewedBy = adminId;
            profile.ReviewedAt = DateTime.UtcNow;
            
            await _profileRepository.UpdateAsync(profile, cancellationToken);
            await _profileRepository.SaveChangesAsync(cancellationToken);
            
            await _notificationService.NotifyDriverApprovedAsync(profile.UserId, cancellationToken);
        }

        public async Task RejectDriverAsync(Guid driverProfileId, AdminRejectDriverRequest request, Guid adminId, CancellationToken cancellationToken = default)
        {
            var profile = await _profileRepository.GetByIdAsync(driverProfileId, cancellationToken);
            if (profile == null) throw new NotFoundException("Driver profile not found.");

            profile.Status = DriverProfileStatus.Rejected;
            profile.RejectionReason = request.RejectionReason;
            profile.ReviewedBy = adminId;
            profile.ReviewedAt = DateTime.UtcNow;

            await _profileRepository.UpdateAsync(profile, cancellationToken);
            await _profileRepository.SaveChangesAsync(cancellationToken);
            
            await _notificationService.NotifyDriverRejectedAsync(profile.UserId, request.RejectionReason, cancellationToken);
        }

        public async Task EnableDriverAsync(Guid driverProfileId, Guid adminId, CancellationToken cancellationToken = default)
        {
            var profile = await _profileRepository.GetByIdAsync(driverProfileId, cancellationToken);
            if (profile == null) throw new NotFoundException("Driver profile not found.");

            profile.IsActive = true;
            await _profileRepository.UpdateAsync(profile, cancellationToken);
            await _profileRepository.SaveChangesAsync(cancellationToken);
        }

        public async Task DisableDriverAsync(Guid driverProfileId, Guid adminId, CancellationToken cancellationToken = default)
        {
            var profile = await _profileRepository.GetByIdAsync(driverProfileId, cancellationToken);
            if (profile == null) throw new NotFoundException("Driver profile not found.");

            profile.IsActive = false;
            // Optionally flip status to suspended
            profile.Status = DriverProfileStatus.Suspended;
            
            await _profileRepository.UpdateAsync(profile, cancellationToken);
            await _profileRepository.SaveChangesAsync(cancellationToken);
        }
    }
}
