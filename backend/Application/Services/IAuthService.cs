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

}
