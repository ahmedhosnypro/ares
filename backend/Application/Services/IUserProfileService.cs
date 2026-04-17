using Backend.Application.DTOs.UserProfile;
using Microsoft.AspNetCore.Http;

namespace Backend.Application.Services;

/// <summary>
/// Service interface for user profile management operations
/// </summary>
public interface IUserProfileService
{
    /// <summary>
    /// Gets complete user profile information
    /// </summary>
    Task<UserProfileDto> GetProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates user profile information
    /// </summary>
    Task<UpdateProfileResponse> UpdateProfileAsync(
        Guid userId,
        UpdateProfileRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Uploads user profile photo
    /// </summary>
    Task<string> UploadProfilePhotoAsync(
        Guid userId,
        IFormFile photo,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Changes user password (requires current password verification)
    /// </summary>
    Task ChangePasswordAsync(
        Guid userId,
        ChangePasswordRequest request,
        CancellationToken cancellationToken = default);
}
