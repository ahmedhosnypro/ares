using Backend.Application.DTOs.Auth;

namespace Backend.Application.Services;

/// <summary>
/// Validates a Google ID token and signs the user in, creating or linking
/// the local ApplicationUser as needed. Returns the same shape as
/// <see cref="IAuthService.LoginAsync"/> so the frontend can reuse its
/// existing JWT/refresh-token plumbing.
/// </summary>
public interface IGoogleAuthService
{
    Task<LoginResponse> SignInWithGoogleAsync(
        GoogleLoginRequest request,
        string? ipAddress,
        CancellationToken cancellationToken = default);
}
