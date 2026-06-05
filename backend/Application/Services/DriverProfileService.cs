using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Driver;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Application.Exceptions;
using Microsoft.AspNetCore.Http;
using System.Linq;

namespace Backend.Application.Services
{
    public class DriverProfileService : IDriverProfileService
    {
        // Mirror the size + extension rules used by DriverLicenseService /
        // VerificationService so we do not introduce a conflicting upload policy.
        private const long MaxFileSize = 10 * 1024 * 1024; // 10MB
        private static readonly string[] AllowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
        private static readonly string[] AllowedContentTypes = new[] { "image/jpeg", "image/jpg", "image/png" };

        private readonly IDriverProfileRepository _driverProfileRepository;
        private readonly IServiceAreaRepository _serviceAreaRepository;

        public DriverProfileService(IDriverProfileRepository driverProfileRepository, IServiceAreaRepository serviceAreaRepository)
        {
            _driverProfileRepository = driverProfileRepository;
            _serviceAreaRepository = serviceAreaRepository;
        }

        public async Task<DriverProfileStatusDto> GetStatusAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var profile = await _driverProfileRepository.GetByUserIdAsync(userId, cancellationToken);
            if (profile == null) throw new NotFoundException("Driver profile not found.");

            return new DriverProfileStatusDto
            {
                Status = profile.Status,
                Availability = profile.Availability,
                IsActive = profile.IsActive,
                RejectionReason = profile.RejectionReason
            };
        }

        public async Task<DriverProfileDetailsDto> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var profile = await _driverProfileRepository.GetByUserIdWithWorkAreasAsync(userId, cancellationToken);
            if (profile == null) throw new NotFoundException("Driver profile not found.");

            return new DriverProfileDetailsDto
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
                WorkAreas = profile.WorkAreas.Select(wa => new ServiceAreaDto
                {
                    Id = wa.ServiceArea!.Id,
                    Name = wa.ServiceArea.Name,
                    Governorate = wa.ServiceArea.Governorate,
                    IsActive = wa.ServiceArea.IsActive
                }).ToList()
            };
        }

        public async Task<DriverProfileDetailsDto> CompleteProfileAsync(Guid userId, CompleteDriverProfileRequest request, CancellationToken cancellationToken = default)
        {
            var profile = await _driverProfileRepository.GetByUserIdWithWorkAreasAsync(userId, cancellationToken);
            if (profile == null) throw new NotFoundException("Driver profile not found.");

            if (profile.Status != DriverProfileStatus.Incomplete && profile.Status != DriverProfileStatus.Rejected)
            {
                throw new BadRequestException("Profile is already completed or pending verification.");
            }

            // Documents are mandatory on first completion. On a re-submission
            // (Rejected → PendingVerification) we allow keeping the existing
            // documents when no new file is supplied.
            var isFirstCompletion = string.IsNullOrWhiteSpace(profile.LicenseImage);
            ValidateImage(request.LicenseImage, "LicenseImage", required: isFirstCompletion);
            ValidateImage(request.NationalIdFrontImage, "NationalIdFrontImage", required: isFirstCompletion);
            ValidateImage(request.NationalIdBackImage, "NationalIdBackImage", required: isFirstCompletion);

            profile.LicenseNumber = request.LicenseNumber;
            profile.LicenseExpiryDate = request.LicenseExpiryDate;
            profile.Address = request.Address;
            profile.EmergencyContactName = request.EmergencyContactName;
            profile.EmergencyContactPhone = request.EmergencyContactPhone;

            // Persist newly-uploaded documents; keep prior values otherwise.
            var savedFiles = new System.Collections.Generic.List<string>();
            try
            {
                if (request.LicenseImage is { Length: > 0 })
                    profile.LicenseImage = await SaveImageAsync(userId, request.LicenseImage, "driver-profiles", savedFiles, cancellationToken);
                if (request.NationalIdFrontImage is { Length: > 0 })
                    profile.NationalIdFrontImage = await SaveImageAsync(userId, request.NationalIdFrontImage, "driver-profiles", savedFiles, cancellationToken);
                if (request.NationalIdBackImage is { Length: > 0 })
                    profile.NationalIdBackImage = await SaveImageAsync(userId, request.NationalIdBackImage, "driver-profiles", savedFiles, cancellationToken);
            }
            catch
            {
                // Roll back any partially-written files so we never leave orphans.
                foreach (var f in savedFiles) TryDeleteUploadedFile(f);
                throw;
            }

            profile.WorkAreas.Clear();
            foreach (var areaId in request.ServiceAreaIds)
            {
                var area = await _serviceAreaRepository.GetByIdAsync(areaId, cancellationToken);
                if (area != null)
                {
                    profile.WorkAreas.Add(new DriverWorkArea { DriverProfileId = profile.Id, ServiceAreaId = areaId });
                }
            }

            profile.Status = DriverProfileStatus.PendingVerification;

            await _driverProfileRepository.UpdateAsync(profile, cancellationToken);
            await _driverProfileRepository.SaveChangesAsync(cancellationToken);

            return await GetProfileAsync(userId, cancellationToken);
        }

        public async Task<DriverProfileStatusDto> UpdateAvailabilityAsync(Guid userId, UpdateDriverAvailabilityRequest request, CancellationToken cancellationToken = default)
        {
            var profile = await _driverProfileRepository.GetByUserIdAsync(userId, cancellationToken);
            if (profile == null) throw new NotFoundException("Driver profile not found.");

            if (profile.Status != DriverProfileStatus.Verified)
            {
                throw new BadRequestException("Only verified drivers can update availability.");
            }
            if (profile.Availability == DriverAvailability.Reserved)
            {
                throw new BadRequestException("Cannot manually change availability while reserved for an active booking.");
            }
            if (request.Availability == DriverAvailability.Reserved)
            {
                throw new BadRequestException("Cannot manually set availability to Reserved.");
            }

            profile.Availability = request.Availability;
            await _driverProfileRepository.UpdateAsync(profile, cancellationToken);
            try
            {
                await _driverProfileRepository.SaveChangesAsync(cancellationToken);
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
            {
                // The profile was concurrently modified (e.g. a customer just
                // reserved this driver). Surface a clean conflict.
                throw new ConflictException("Your availability changed at the same time as an assignment. Please refresh and try again.");
            }

            return new DriverProfileStatusDto
            {
                Status = profile.Status,
                Availability = profile.Availability,
                IsActive = profile.IsActive,
                RejectionReason = profile.RejectionReason
            };
        }

        // ── Upload helpers (mirror DriverLicenseService policy) ──────────────

        private static void ValidateImage(IFormFile? file, string field, bool required)
        {
            if (file == null || file.Length == 0)
            {
                if (required)
                    throw new ValidationException(field, $"{field} is required.");
                return;
            }

            if (file.Length > MaxFileSize)
                throw new ValidationException(field, $"{field} exceeds the maximum allowed size of 10MB.");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
                throw new ValidationException(field, "Invalid file type. Only JPEG and PNG images are allowed.");

            var contentType = (file.ContentType ?? string.Empty).ToLowerInvariant();
            if (!AllowedContentTypes.Contains(contentType))
                throw new ValidationException(field, "Invalid content type. Only image/jpeg or image/png are allowed.");
        }

        private static async Task<string> SaveImageAsync(
            Guid userId, IFormFile file, string subFolder,
            System.Collections.Generic.List<string> savedFiles, CancellationToken cancellationToken)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            // Never reuse any part of the user-supplied filename (path-traversal safety).
            var fileName = $"{userId}_{Guid.NewGuid():N}{extension}";

            var uploadsFolder = Path.Combine("wwwroot", "uploads", subFolder);
            Directory.CreateDirectory(uploadsFolder);

            var filePath = Path.Combine(uploadsFolder, fileName);
            await using (var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            var publicUrl = $"/uploads/{subFolder}/{fileName}";
            savedFiles.Add(publicUrl);
            return publicUrl;
        }

        private static void TryDeleteUploadedFile(string? publicUrl)
        {
            if (string.IsNullOrWhiteSpace(publicUrl)) return;
            try
            {
                // publicUrl is /uploads/<sub>/<file> → wwwroot/uploads/<sub>/<file>
                var relative = publicUrl.TrimStart('/');
                var physicalPath = Path.Combine("wwwroot", relative);
                if (File.Exists(physicalPath)) File.Delete(physicalPath);
            }
            catch
            {
                // best-effort cleanup
            }
        }
    }
}
