using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Verification;

namespace Backend.Application.Interfaces
{
    public interface IVerificationService
    {
        Task<UserVerificationDto?> GetMyVerificationAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<UserVerificationDto> SubmitVerificationAsync(Guid userId, SubmitVerificationRequest request, CancellationToken cancellationToken = default);

        // ── Admin operations ──────────────────────────────────────────────
        Task<PagedResult<AdminVerificationDto>> GetVerificationsForAdminAsync(
            int page,
            int pageSize,
            string? status,
            CancellationToken cancellationToken = default);

        Task<AdminVerificationDto> ApproveVerificationAsync(
            Guid verificationId,
            Guid adminUserId,
            CancellationToken cancellationToken = default);

        Task<AdminVerificationDto> RejectVerificationAsync(
            Guid verificationId,
            Guid adminUserId,
            string rejectionReason,
            CancellationToken cancellationToken = default);
    }
}
