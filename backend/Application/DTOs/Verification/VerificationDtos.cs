using Microsoft.AspNetCore.Http;
using Backend.Domain.Entities.Enums;

namespace Backend.Application.DTOs.Verification
{
    public record SubmitVerificationRequest(
        VerificationDocumentType DocumentType,
        IFormFile FrontImage,
        IFormFile? BackImage);

    public record UserVerificationDto(
        string Status,
        string DocumentType,
        DateTime SubmittedAt,
        string? RejectionReason);

    /// <summary>
    /// Admin-facing DTO with full review context: user info, document URLs,
    /// reviewer audit fields, and rejection reason.
    /// </summary>
    public record AdminVerificationDto(
        Guid Id,
        Guid UserId,
        string UserFirstName,
        string UserLastName,
        string UserEmail,
        string DocumentType,
        string Status,
        DateTime SubmittedAt,
        string? DocumentFrontUrl,
        string? DocumentBackUrl,
        string? RejectionReason,
        Guid? ReviewedBy,
        DateTime? ReviewedAt);

    /// <summary>
    /// Request body for the admin reject endpoint. RejectionReason is required.
    /// </summary>
    public record RejectVerificationRequest(string RejectionReason);
}
