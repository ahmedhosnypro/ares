using Backend.Application.DTOs.Auth;

namespace Backend.Application.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
    Task<bool> VerifyEmailAsync(string userId, string token, CancellationToken cancellationToken = default);
    Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task RevokeTokenAsync(string token, string? ipAddress, CancellationToken cancellationToken = default);
    Task<List<string>> GetDemoRolesAsync(CancellationToken cancellationToken = default);
    Task<LoginResponse> DemoLoginAsync(string role, CancellationToken cancellationToken = default);

    /// <summary>
    /// Marks the user's profile as complete by flipping
    /// <c>ApplicationUser.Status</c> from <c>"Pending"</c> to
    /// <c>"Active"</c>. Optionally updates name and phone fields from the
    /// payload before saving. Safe to call multiple times — already-active
    /// users get a no-op.
    /// </summary>
    Task CompleteProfileAsync(Guid userId, CompleteProfileRequest request, CancellationToken cancellationToken = default);
}
