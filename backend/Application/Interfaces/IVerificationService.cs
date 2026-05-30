using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Verification;

namespace Backend.Application.Interfaces
{
    public interface IVerificationService
    {
        Task<UserVerificationDto?> GetMyVerificationAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<UserVerificationDto> SubmitVerificationAsync(Guid userId, SubmitVerificationRequest request, CancellationToken cancellationToken = default);

        /// <summary>
        /// Returns <c>true</c> iff the given user has an Identity verification
        /// record whose <see cref="Verification.Status"/> is
        /// <c>"Approved"</c>. Used to gate booking creation — the spec
        /// requires that a customer cannot create a booking without an
        /// approved identity verification.
        /// </summary>
        Task<bool> IsApprovedAsync(Guid userId, CancellationToken cancellationToken = default);

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
