using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Verification;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services
{
    public class VerificationService : IVerificationService
    {
        private readonly IApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly ILogger<VerificationService> _logger;

        public VerificationService(
            IApplicationDbContext context,
            INotificationService notificationService,
            ILogger<VerificationService> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<UserVerificationDto?> GetMyVerificationAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Getting current verification for user {UserId}", userId);

            var verification = await _context.Verifications
                .Where(v => v.UserId == userId)
                .OrderByDescending(v => v.SubmittedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (verification == null)
            {
                return null;
            }

            return new UserVerificationDto(
                Status: verification.Status ?? VerificationRequestStatus.Pending.ToString(),
                DocumentType: verification.DocumentType ?? string.Empty,
                SubmittedAt: verification.SubmittedAt ?? DateTime.UtcNow,
                RejectionReason: verification.RejectionReason);
        }

        /// <inheritdoc />
        public async Task<bool> IsApprovedAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            // Approved == there exists at least one verification row for this
            // user with Status == "Approved". The row is also required to
            // not be expired when ExpiresAt is set — a stale verification
            // must not bypass the booking gate.
            //
            // We deliberately do not throw here; this is a *predicate*
            // method that callers use to decide whether to surface a
            // ForbiddenException themselves (see BookingService.CreateBookingAsync).
            var now = DateTime.UtcNow;
            var approvedStatus = VerificationRequestStatus.Approved.ToString();

            return await _context.Verifications
                .AsNoTracking()
                .AnyAsync(
                    v => v.UserId == userId
                         && v.Status == approvedStatus
                         && (v.ExpiresAt == null || v.ExpiresAt > now),
                    cancellationToken);
        }

        public async Task<UserVerificationDto> SubmitVerificationAsync(Guid userId, SubmitVerificationRequest request, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Submitting verification for user {UserId}", userId);

            // 1. Check if user already has an approved verification
            var hasApproved = await _context.Verifications
                .AnyAsync(v => v.UserId == userId && v.Status == VerificationRequestStatus.Approved.ToString(), cancellationToken);

            if (hasApproved)
            {
                throw new ConflictException("User is already verified and cannot submit another request.");
            }

            // 2. Check if user has a pending verification
            var hasPending = await _context.Verifications
                .AnyAsync(v => v.UserId == userId && v.Status == VerificationRequestStatus.Pending.ToString(), cancellationToken);

            if (hasPending)
            {
                throw new ConflictException("User already has a pending verification request.");
            }

            // 3. Validate files
            ValidateFile(request.FrontImage);
            if (request.BackImage != null)
            {
                ValidateFile(request.BackImage);
            }

            // 4. Save files
            string frontImageUrl = await SaveFileAsync(userId, request.FrontImage, "front", cancellationToken);
            string? backImageUrl = null;
            if (request.BackImage != null)
            {
                backImageUrl = await SaveFileAsync(userId, request.BackImage, "back", cancellationToken);
            }

            // 5. Create verification record
            var verification = new Verification
            {
                UserId = userId,
                DocumentType = request.DocumentType.ToString(),
                DocumentFront = frontImageUrl,
                DocumentBack = backImageUrl,
                Status = VerificationRequestStatus.Pending.ToString(),
                SubmittedAt = DateTime.UtcNow,
                VerificationType = "Identity" // Default verification type
            };

            _context.AddVerification(verification);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Successfully submitted verification for user {UserId}", userId);

            return new UserVerificationDto(
                Status: verification.Status,
                DocumentType: verification.DocumentType,
                SubmittedAt: verification.SubmittedAt.Value,
                RejectionReason: null);
        }

        // ── Admin operations ──────────────────────────────────────────────

        public async Task<PagedResult<AdminVerificationDto>> GetVerificationsForAdminAsync(
            int page,
            int pageSize,
            string? status,
            CancellationToken cancellationToken = default)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            _logger.LogInformation(
                "Admin listing verifications - Page: {Page}, Size: {Size}, StatusFilter: {Status}",
                page, pageSize, status ?? "<all>");

            IQueryable<Verification> query = _context.Verifications;

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (!Enum.TryParse<VerificationRequestStatus>(status, ignoreCase: true, out var parsedStatus))
                {
                    throw new Application.Exceptions.ValidationException(
                        nameof(status),
                        $"Invalid verification status '{status}'. Allowed: Pending, Approved, Rejected.");
                }

                var normalized = parsedStatus.ToString();
                query = query.Where(v => v.Status == normalized);
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var pageItems = await query
                .Include(v => v.User)
                .OrderByDescending(v => v.SubmittedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var data = pageItems.Select(v => MapToAdminDto(v, v.User)).ToList();
            var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

            return new PagedResult<AdminVerificationDto>(
                Data: data,
                Page: page,
                PageSize: pageSize,
                TotalCount: totalCount,
                TotalPages: totalPages);
        }

        public async Task<AdminVerificationDto> ApproveVerificationAsync(
            Guid verificationId,
            Guid adminUserId,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation(
                "Admin {AdminUserId} approving verification {VerificationId}",
                adminUserId, verificationId);

            var verification = await _context.Verifications
                .Include(v => v.User)
                .FirstOrDefaultAsync(v => v.Id == verificationId, cancellationToken);

            if (verification == null)
            {
                throw new NotFoundException(nameof(Verification), verificationId);
            }

            if (verification.Status != VerificationRequestStatus.Pending.ToString())
            {
                throw new ConflictException(
                    $"Only pending verifications can be approved. Current status: {verification.Status ?? "<unknown>"}.");
            }

            verification.Status = VerificationRequestStatus.Approved.ToString();
            verification.ReviewedAt = DateTime.UtcNow;
            verification.ReviewedBy = adminUserId;
            verification.RejectionReason = null;

            await _context.SaveChangesAsync(cancellationToken);

            // Send notification to user
            try
            {
                await _notificationService.CreateNotificationAsync(
                    verification.UserId,
                    "Identity Verified",
                    "Your identity verification has been approved. You can now use all platform features.",
                    SupplierNotificationTypes.IdentityVerified,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send approval notification to user {UserId}", verification.UserId);
            }

            _logger.LogInformation(
                "Verification {VerificationId} approved by admin {AdminUserId}",
                verificationId, adminUserId);

            return MapToAdminDto(verification, verification.User);
        }

        public async Task<AdminVerificationDto> RejectVerificationAsync(
            Guid verificationId,
            Guid adminUserId,
            string rejectionReason,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(rejectionReason))
            {
                throw new Application.Exceptions.ValidationException(
                    nameof(rejectionReason),
                    "Rejection reason is required when rejecting a verification.");
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
                "Admin {AdminUserId} rejecting verification {VerificationId}",
                adminUserId, verificationId);

            var verification = await _context.Verifications
                .Include(v => v.User)
                .FirstOrDefaultAsync(v => v.Id == verificationId, cancellationToken);

            if (verification == null)
            {
                throw new NotFoundException(nameof(Verification), verificationId);
            }

            if (verification.Status != VerificationRequestStatus.Pending.ToString())
            {
                throw new ConflictException(
                    $"Only pending verifications can be rejected. Current status: {verification.Status ?? "<unknown>"}.");
            }

            verification.Status = VerificationRequestStatus.Rejected.ToString();
            verification.ReviewedAt = DateTime.UtcNow;
            verification.ReviewedBy = adminUserId;
            verification.RejectionReason = trimmed;

            await _context.SaveChangesAsync(cancellationToken);

            // Send notification to user
            try
            {
                await _notificationService.CreateNotificationAsync(
                    verification.UserId,
                    "Identity Rejected",
                    $"Your identity verification was rejected. Reason: {trimmed}. Please resubmit with correct documents.",
                    SupplierNotificationTypes.IdentityRejected,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send rejection notification to user {UserId}", verification.UserId);
            }

            _logger.LogInformation(
                "Verification {VerificationId} rejected by admin {AdminUserId}",
                verificationId, adminUserId);

            return MapToAdminDto(verification, verification.User);
        }

        // ── Helpers ──────────────────────────────────────────────────────

        private static AdminVerificationDto MapToAdminDto(Verification verification, ApplicationUser? user)
        {
            return new AdminVerificationDto(
                Id: verification.Id,
                UserId: verification.UserId,
                UserFirstName: user?.FirstName ?? string.Empty,
                UserLastName: user?.LastName ?? string.Empty,
                UserEmail: user?.Email ?? string.Empty,
                DocumentType: verification.DocumentType ?? string.Empty,
                Status: verification.Status ?? VerificationRequestStatus.Pending.ToString(),
                SubmittedAt: verification.SubmittedAt ?? DateTime.UtcNow,
                DocumentFrontUrl: verification.DocumentFront,
                DocumentBackUrl: verification.DocumentBack,
                RejectionReason: verification.RejectionReason,
                ReviewedBy: verification.ReviewedBy,
                ReviewedAt: verification.ReviewedAt);
        }

        private void ValidateFile(IFormFile file)
        {
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(fileExtension))
            {
                throw new Application.Exceptions.ValidationException(file.Name, "Invalid file type. Only JPEG, PNG, and PDF are allowed.");
            }

            const long maxFileSize = 10 * 1024 * 1024; // 10MB
            if (file.Length > maxFileSize)
            {
                throw new Application.Exceptions.ValidationException(file.Name, "File size exceeds the maximum limit of 10MB.");
            }
        }

        private async Task<string> SaveFileAsync(Guid userId, IFormFile file, string suffix, CancellationToken cancellationToken)
        {
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{userId}_{suffix}_{Guid.NewGuid()}{fileExtension}";
            var uploadsFolder = Path.Combine("wwwroot", "uploads", "verifications");

            Directory.CreateDirectory(uploadsFolder);

            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            return $"/uploads/verifications/{fileName}";
        }
    }
}
