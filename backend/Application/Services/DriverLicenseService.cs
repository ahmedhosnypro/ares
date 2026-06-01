using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.DriverLicense;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services
{
    /// <summary>
    /// Driver license verification service. Handles user submission/status
    /// retrieval as well as admin review (list, approve, reject) for the
    /// admin verification UI. Reuses the existing Drivers table and the
    /// wwwroot/uploads file storage convention already used by
    /// VerificationService.
    /// </summary>
    public class DriverLicenseService : IDriverLicenseService
    {
        // Mirror the size + extension rules used by VerificationService so we
        // do not introduce a second, conflicting upload policy.
        private const long MaxFileSize = 10 * 1024 * 1024; // 10MB
        private static readonly string[] AllowedExtensions =
            new[] { ".jpg", ".jpeg", ".png" };
        private static readonly string[] AllowedContentTypes =
            new[] { "image/jpeg", "image/jpg", "image/png" };

        private readonly IApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly ILogger<DriverLicenseService> _logger;

        public DriverLicenseService(
            IApplicationDbContext context,
            INotificationService notificationService,
            ILogger<DriverLicenseService> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<DriverLicenseStatusResponse?> GetMyDriverLicenseAsync(
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation(
                "Fetching driver license for user {UserId}", userId);

            var driver = await _context.Drivers
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.UserId == userId, cancellationToken);

            return driver == null ? null : MapToResponse(driver);
        }

        public async Task<DriverLicenseStatusResponse> SubmitOrUpdateAsync(
            Guid userId,
            SubmitDriverLicenseRequest request,
            CancellationToken cancellationToken = default)
        {
            if (request == null)
            {
                throw new Application.Exceptions.ValidationException(
                    nameof(request), "Request body is required.");
            }

            ValidateLicenseNumber(request.LicenseNumber);
            ValidateExpiryDate(request.LicenseExpiryDate);
            ValidateImage(request.LicenseImage);

            _logger.LogInformation(
                "Submitting/updating driver license for user {UserId}", userId);

            // One driver profile per user — the Drivers.UserId index is unique
            // (see ApplicationDbContextModelSnapshot), so we upsert here.
            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.UserId == userId, cancellationToken);

            // Save the new image first so a failure during persistence does not
            // leave the driver row pointing at a missing file.
            var newImagePath = await SaveImageAsync(
                userId, request.LicenseImage, cancellationToken);

            string? oldImagePath = null;
            bool isNew = driver == null;

            if (driver == null)
            {
                driver = new Driver
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    LicenseNumber = request.LicenseNumber.Trim(),
                    LicenseExpiryDate = request.LicenseExpiryDate.ToUniversalTime(),
                    LicenseImage = newImagePath,
                    IsAvailable = true,
                    IsVerified = false,
                    IsActive = true,
                    VerificationStatus = DriverLicenseStatus.Pending.ToString(),
                    RejectionReason = null,
                    ReviewedAt = null,
                    ReviewedBy = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.AddDriver(driver);
            }
            else
            {
                oldImagePath = driver.LicenseImage;

                driver.LicenseNumber = request.LicenseNumber.Trim();
                driver.LicenseExpiryDate = request.LicenseExpiryDate.ToUniversalTime();
                driver.LicenseImage = newImagePath;
                // Resubmission resets verification per business rules.
                driver.IsVerified = false;
                driver.VerificationStatus = DriverLicenseStatus.Pending.ToString();
                driver.RejectionReason = null;
                driver.ReviewedAt = null;
                driver.ReviewedBy = null;
                driver.UpdatedAt = DateTime.UtcNow;
            }

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                // Best-effort cleanup of the just-saved file if persistence
                // failed — do not let cleanup errors mask the original.
                TryDeleteUploadedFile(newImagePath);
                throw;
            }

            // After the row is safely updated, clean up the previous image.
            if (!isNew && !string.IsNullOrWhiteSpace(oldImagePath)
                && !string.Equals(oldImagePath, newImagePath, StringComparison.OrdinalIgnoreCase))
            {
                TryDeleteUploadedFile(oldImagePath);
            }

            _logger.LogInformation(
                "Driver license {Operation} for user {UserId} (driverId={DriverId})",
                isNew ? "created" : "updated", userId, driver.Id);

            return MapToResponse(driver);
        }

        // ── Admin operations ─────────────────────────────────────────────

        public async Task<PagedResult<AdminDriverLicenseDto>> GetDriverLicensesForAdminAsync(
            int page,
            int pageSize,
            string? status,
            CancellationToken cancellationToken = default)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            _logger.LogInformation(
                "Admin listing driver licenses - Page: {Page}, Size: {Size}, StatusFilter: {Status}",
                page, pageSize, status ?? "<all>");

            IQueryable<Driver> query = _context.Drivers;

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (!Enum.TryParse<DriverLicenseStatus>(status, ignoreCase: true, out var parsedStatus))
                {
                    throw new Application.Exceptions.ValidationException(
                        nameof(status),
                        $"Invalid driver license status '{status}'. Allowed: Pending, Verified, Rejected.");
                }

                // Status is derived from existing fields for rows that
                // pre-date the explicit VerificationStatus column.
                switch (parsedStatus)
                {
                    case DriverLicenseStatus.Verified:
                        query = query.Where(d => d.IsVerified);
                        break;
                    case DriverLicenseStatus.Rejected:
                        query = query.Where(d => !d.IsVerified && d.VerificationStatus == "Rejected");
                        break;
                    default: // Pending
                        query = query.Where(d =>
                            !d.IsVerified &&
                            (d.VerificationStatus == null || d.VerificationStatus == "Pending"));
                        break;
                }
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var pageItems = await query
                .Include(d => d.User)
                .OrderByDescending(d => d.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var data = pageItems.Select(d => MapToAdminDto(d, d.User)).ToList();
            var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

            return new PagedResult<AdminDriverLicenseDto>(
                Data: data,
                Page: page,
                PageSize: pageSize,
                TotalCount: totalCount,
                TotalPages: totalPages);
        }

        public async Task<AdminDriverLicenseDto> ApproveDriverLicenseAsync(
            Guid driverLicenseId,
            Guid adminUserId,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation(
                "Admin {AdminUserId} approving driver license {DriverLicenseId}",
                adminUserId, driverLicenseId);

            var driver = await _context.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == driverLicenseId, cancellationToken);

            if (driver == null)
            {
                throw new NotFoundException(nameof(Driver), driverLicenseId);
            }

            var currentStatus = ResolveStatus(driver);
            if (currentStatus != DriverLicenseStatus.Pending)
            {
                throw new ConflictException(
                    $"Only pending driver licenses can be approved. Current status: {currentStatus}.");
            }

            driver.IsVerified = true;
            driver.VerificationStatus = DriverLicenseStatus.Verified.ToString();
            driver.RejectionReason = null;
            driver.ReviewedBy = adminUserId;
            driver.ReviewedAt = DateTime.UtcNow;
            driver.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            // Send notification to user
            try
            {
                await _notificationService.CreateNotificationAsync(
                    driver.UserId,
                    "Driver License Verified",
                    "Your driver license has been approved. You can now book vehicles on the platform.",
                    SupplierNotificationTypes.LicenseVerified,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send driver license approval notification to user {UserId}", driver.UserId);
            }

            _logger.LogInformation(
                "Driver license {DriverLicenseId} approved by admin {AdminUserId}",
                driverLicenseId, adminUserId);

            return MapToAdminDto(driver, driver.User);
        }

        public async Task<AdminDriverLicenseDto> RejectDriverLicenseAsync(
            Guid driverLicenseId,
            Guid adminUserId,
            string rejectionReason,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(rejectionReason))
            {
                throw new Application.Exceptions.ValidationException(
                    nameof(rejectionReason),
                    "Rejection reason is required when rejecting a driver license.");
            }

            var trimmed = rejectionReason.Trim();
            if (trimmed.Length < 3)
            {
                throw new Application.Exceptions.ValidationException(
                    nameof(rejectionReason),
                    "Rejection reason must be at least 3 characters long.");
            }
            if (trimmed.Length > 500)
            {
                throw new Application.Exceptions.ValidationException(
                    nameof(rejectionReason),
                    "Rejection reason must be 500 characters or fewer.");
            }

            _logger.LogInformation(
                "Admin {AdminUserId} rejecting driver license {DriverLicenseId}",
                adminUserId, driverLicenseId);

            var driver = await _context.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == driverLicenseId, cancellationToken);

            if (driver == null)
            {
                throw new NotFoundException(nameof(Driver), driverLicenseId);
            }

            var currentStatus = ResolveStatus(driver);
            if (currentStatus != DriverLicenseStatus.Pending)
            {
                throw new ConflictException(
                    $"Only pending driver licenses can be rejected. Current status: {currentStatus}.");
            }

            driver.IsVerified = false;
            driver.VerificationStatus = DriverLicenseStatus.Rejected.ToString();
            driver.RejectionReason = trimmed;
            driver.ReviewedBy = adminUserId;
            driver.ReviewedAt = DateTime.UtcNow;
            driver.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            // Send notification to user
            try
            {
                await _notificationService.CreateNotificationAsync(
                    driver.UserId,
                    "Driver License Rejected",
                    $"Your driver license was rejected. Reason: {trimmed}. Please resubmit with a valid document.",
                    SupplierNotificationTypes.LicenseRejected,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send driver license rejection notification to user {UserId}", driver.UserId);
            }

            _logger.LogInformation(
                "Driver license {DriverLicenseId} rejected by admin {AdminUserId}",
                driverLicenseId, adminUserId);

            return MapToAdminDto(driver, driver.User);
        }

        // ── Helpers ──────────────────────────────────────────────────────

        private static DriverLicenseStatus ResolveStatus(Driver driver)
        {
            if (driver.IsVerified) return DriverLicenseStatus.Verified;
            if (string.Equals(driver.VerificationStatus, "Rejected", StringComparison.OrdinalIgnoreCase))
            {
                return DriverLicenseStatus.Rejected;
            }
            return DriverLicenseStatus.Pending;
        }

        private static AdminDriverLicenseDto MapToAdminDto(Driver driver, ApplicationUser? user)
        {
            var status = ResolveStatus(driver);
            return new AdminDriverLicenseDto(
                Id: driver.Id,
                UserId: driver.UserId,
                UserFirstName: user?.FirstName ?? string.Empty,
                UserLastName: user?.LastName ?? string.Empty,
                UserEmail: user?.Email ?? string.Empty,
                LicenseNumber: driver.LicenseNumber,
                LicenseExpiryDate: driver.LicenseExpiryDate,
                LicenseImageUrl: driver.LicenseImage,
                Status: status.ToString(),
                SubmittedAt: driver.CreatedAt,
                UpdatedAt: driver.UpdatedAt,
                RejectionReason: driver.RejectionReason,
                ReviewedBy: driver.ReviewedBy,
                ReviewedAt: driver.ReviewedAt);
        }

        private static DriverLicenseStatusResponse MapToResponse(Driver driver) =>
            new(
                Id: driver.Id,
                UserId: driver.UserId,
                LicenseNumber: driver.LicenseNumber,
                LicenseExpiryDate: driver.LicenseExpiryDate,
                LicenseImageUrl: driver.LicenseImage,
                IsVerified: driver.IsVerified,
                SubmittedAt: driver.CreatedAt,
                UpdatedAt: driver.UpdatedAt,
                VerificationStatus: driver.VerificationStatus,
                RejectionReason: driver.RejectionReason);

        private static void ValidateLicenseNumber(string? licenseNumber)
        {
            if (string.IsNullOrWhiteSpace(licenseNumber))
            {
                throw new Application.Exceptions.ValidationException(
                    nameof(SubmitDriverLicenseRequest.LicenseNumber),
                    "License number is required.");
            }

            var trimmed = licenseNumber.Trim();
            if (trimmed.Length < 3 || trimmed.Length > 50)
            {
                throw new Application.Exceptions.ValidationException(
                    nameof(SubmitDriverLicenseRequest.LicenseNumber),
                    "License number must be between 3 and 50 characters.");
            }
        }

        private static void ValidateExpiryDate(DateTime expiryDate)
        {
            if (expiryDate == default)
            {
                throw new Application.Exceptions.ValidationException(
                    nameof(SubmitDriverLicenseRequest.LicenseExpiryDate),
                    "License expiry date is required.");
            }

            // Compare in UTC to keep behaviour deterministic across server tz.
            var expiryUtc = expiryDate.ToUniversalTime();
            if (expiryUtc.Date <= DateTime.UtcNow.Date)
            {
                throw new Application.Exceptions.ValidationException(
                    nameof(SubmitDriverLicenseRequest.LicenseExpiryDate),
                    "License expiry date must be in the future.");
            }

            // Guard against accidental wildly-out-of-range dates.
            if (expiryUtc.Year > DateTime.UtcNow.Year + 50)
            {
                throw new Application.Exceptions.ValidationException(
                    nameof(SubmitDriverLicenseRequest.LicenseExpiryDate),
                    "License expiry date is unreasonably far in the future.");
            }
        }

        private static void ValidateImage(IFormFile? file)
        {
            if (file == null || file.Length == 0)
            {
                throw new Application.Exceptions.ValidationException(
                    nameof(SubmitDriverLicenseRequest.LicenseImage),
                    "License image is required.");
            }

            if (file.Length > MaxFileSize)
            {
                throw new Application.Exceptions.ValidationException(
                    nameof(SubmitDriverLicenseRequest.LicenseImage),
                    "License image exceeds the maximum allowed size of 10MB.");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(extension) ||
                !AllowedExtensions.Contains(extension))
            {
                throw new Application.Exceptions.ValidationException(
                    nameof(SubmitDriverLicenseRequest.LicenseImage),
                    "Invalid file type. Only JPEG and PNG images are allowed.");
            }

            var contentType = (file.ContentType ?? string.Empty).ToLowerInvariant();
            if (!AllowedContentTypes.Contains(contentType))
            {
                throw new Application.Exceptions.ValidationException(
                    nameof(SubmitDriverLicenseRequest.LicenseImage),
                    "Invalid content type. Only image/jpeg or image/png are allowed.");
            }
        }

        private static async Task<string> SaveImageAsync(
            Guid userId,
            IFormFile file,
            CancellationToken cancellationToken)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            // Avoid taking any portion of the user-supplied filename to prevent
            // path traversal or accidental script-like filenames on disk.
            var fileName = $"{userId}_{Guid.NewGuid():N}{extension}";

            var uploadsFolder = Path.Combine("wwwroot", "uploads", "driver-licenses");
            Directory.CreateDirectory(uploadsFolder);

            var filePath = Path.Combine(uploadsFolder, fileName);

            await using (var stream = new FileStream(
                filePath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            // Public URL served from wwwroot via UseStaticFiles().
            return $"/uploads/driver-licenses/{fileName}";
        }

        private void TryDeleteUploadedFile(string? publicUrl)
        {
            if (string.IsNullOrWhiteSpace(publicUrl)) return;

            try
            {
                // Translate /uploads/... back to wwwroot/uploads/...
                var relative = publicUrl.TrimStart('/');
                var physicalPath = Path.Combine("wwwroot", relative);
                if (File.Exists(physicalPath))
                {
                    File.Delete(physicalPath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to delete previous driver-license image at {Path}",
                    publicUrl);
            }
        }
    }
}
