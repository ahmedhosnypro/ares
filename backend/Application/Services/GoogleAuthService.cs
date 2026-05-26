using System.Security.Cryptography;
using Backend.Application.DTOs.Auth;
using Backend.Application.Exceptions;
using Backend.Domain.Entities;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services;

/// <summary>
/// Google OAuth sign-in / sign-up implementation.
/// <para>
/// Flow:
/// </para>
/// <list type="number">
///   <item>Validate the Google ID token (audience = configured ClientId).</item>
///   <item>Whitelist the requested role on the backend (Customer | Supplier | Driver).</item>
///   <item>Find the local user by GoogleId, then by email, then create.</item>
///   <item>Reject blocked accounts.</item>
///   <item>Issue the project's existing JWT + refresh token via JwtTokenService.</item>
/// </list>
/// </summary>
public class GoogleAuthService : IGoogleAuthService
{
    // Roles a user is allowed to choose for self-service Google sign-up.
    // Admin / Inspector are intentionally excluded — those accounts are
    // provisioned by administrators only.
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Customer",
        "Supplier",
        "Driver",
    };

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(
        UserManager<ApplicationUser> userManager,
        IJwtTokenService jwtTokenService,
        IConfiguration configuration,
        ILogger<GoogleAuthService> logger)
    {
        _userManager = userManager;
        _jwtTokenService = jwtTokenService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<LoginResponse> SignInWithGoogleAsync(
        GoogleLoginRequest request,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { "IdToken", new[] { "Google ID token is required" } }
            });
        }

        if (!AllowedRoles.Contains(request.Role))
        {
            _logger.LogWarning("Google sign-in rejected: role {Role} is not allowed for self-service signup", request.Role);
            throw new ForbiddenException("Google sign-in is not available for that role.");
        }

        var payload = await ValidateGoogleTokenAsync(request.IdToken);

        // Step 1 — try to find an account that's already linked to this Google identity.
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.GoogleId == payload.Subject, cancellationToken);

        if (user is null)
        {
            // Step 2 — try to find an existing email/password account with the
            // same email and link it (single account per email).
            user = await _userManager.FindByEmailAsync(payload.Email);

            if (user is not null)
            {
                _logger.LogInformation(
                    "Linking existing local account {UserId} to Google subject {Subject}",
                    user.Id, payload.Subject);

                user.GoogleId = payload.Subject;
                user.AuthProvider = "Google";
                if (user.EmailVerifiedAt is null) user.EmailVerifiedAt = DateTime.UtcNow;
                if (!user.EmailConfirmed) user.EmailConfirmed = true;
                if (string.IsNullOrWhiteSpace(user.ProfileImage) && !string.IsNullOrWhiteSpace(payload.Picture))
                {
                    user.ProfileImage = payload.Picture;
                }
                user.UpdatedAt = DateTime.UtcNow;

                var updateResult = await _userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                    _logger.LogError("Failed to link Google account to user {UserId}: {Errors}", user.Id, errors);
                    throw new ValidationException(new Dictionary<string, string[]>
                    {
                        { "User", updateResult.Errors.Select(e => e.Description).ToArray() }
                    });
                }
            }
            else
            {
                // Step 3 — create a brand-new account.
                user = await CreateGoogleUserAsync(payload, request.Role);
            }
        }

        // Block-list / suspension check (mirrors the email/password login flow).
        if (string.Equals(user.Status, "Blocked", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Google sign-in rejected: user {UserId} is blocked", user.Id);
            throw new ForbiddenException("Your account has been blocked by an administrator. Please contact support.");
        }

        if (await _userManager.IsLockedOutAsync(user))
        {
            _logger.LogWarning("Google sign-in rejected: user {UserId} is locked out", user.Id);
            throw new ForbiddenException("Account is locked. Please try again later.");
        }

        // Issue tokens using the same JwtTokenService the email/password flow uses.
        var roles = await _userManager.GetRolesAsync(user);
        var stayConnected = request.StayConnected ?? false;
        var jwt = _jwtTokenService.GenerateToken(user, roles, stayConnected);
        var expiresAt = _jwtTokenService.GetTokenExpiration(stayConnected);

        var refreshToken = new RefreshToken
        {
            Token = _jwtTokenService.GenerateRefreshToken(),
            ExpiresAt = _jwtTokenService.GetRefreshTokenExpiration(),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = ipAddress,
        };

        user.RefreshTokens ??= new List<RefreshToken>();
        user.RefreshTokens.Add(refreshToken);
        await _userManager.UpdateAsync(user);

        _logger.LogInformation("User signed in via Google: {UserId}", user.Id);

        return new LoginResponse(
            Token: jwt,
            RefreshToken: refreshToken.Token,
            ExpiresAt: expiresAt,
            User: new UserDto(
                Id: user.Id,
                Email: user.Email!,
                FirstName: user.FirstName ?? string.Empty,
                LastName: user.LastName ?? string.Empty,
                Roles: roles.ToList(),
                EmailVerified: user.EmailConfirmed
            )
        );
    }

    /// <summary>
    /// Cryptographically validates the Google ID token. Throws
    /// <see cref="UnauthorizedException"/> on failure.
    /// </summary>
    private async Task<GoogleJsonWebSignature.Payload> ValidateGoogleTokenAsync(string idToken)
    {
        var clientId = _configuration["Google:ClientId"]
            ?? throw new InvalidOperationException(
                "Google:ClientId is not configured. Set Google__ClientId in your backend environment.");

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId },
            });

            if (string.IsNullOrWhiteSpace(payload.Email))
            {
                throw new UnauthorizedException("Google account did not provide an email address.");
            }

            if (!payload.EmailVerified)
            {
                // Should never happen for Google accounts, but defend against
                // a forged / unverified payload anyway.
                throw new UnauthorizedException("Google account email is not verified.");
            }

            return payload;
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Google ID token validation failed");
            throw new UnauthorizedException("Invalid Google credentials.");
        }
    }

    /// <summary>
    /// Creates a new ApplicationUser from a verified Google payload. The
    /// user gets a cryptographically random password they will never use —
    /// they sign in via Google. They can always set a real password later
    /// via the existing "forgot password" flow.
    /// </summary>
    private async Task<ApplicationUser> CreateGoogleUserAsync(
        GoogleJsonWebSignature.Payload payload,
        string role)
    {
        var firstName = !string.IsNullOrWhiteSpace(payload.GivenName)
            ? payload.GivenName
            : ExtractFirstNameFromFullName(payload.Name);

        var lastName = !string.IsNullOrWhiteSpace(payload.FamilyName)
            ? payload.FamilyName
            : ExtractLastNameFromFullName(payload.Name);

        var user = new ApplicationUser
        {
            UserName = payload.Email,
            Email = payload.Email,
            FirstName = firstName,
            LastName = lastName,
            ProfileImage = payload.Picture,
            EmailConfirmed = true, // Google has already verified the email.
            EmailVerifiedAt = DateTime.UtcNow,
            GoogleId = payload.Subject,
            AuthProvider = "Google",
        };

        var randomPassword = GenerateSecureRandomPassword();
        var createResult = await _userManager.CreateAsync(user, randomPassword);

        if (!createResult.Succeeded)
        {
            var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
            _logger.LogError("Failed to create Google user {Email}: {Errors}", payload.Email, errors);
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { "User", createResult.Errors.Select(e => e.Description).ToArray() }
            });
        }

        var roleResult = await _userManager.AddToRoleAsync(user, role);
        if (!roleResult.Succeeded)
        {
            var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
            _logger.LogError("Failed to assign role {Role} to Google user {UserId}: {Errors}", role, user.Id, errors);
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { "Role", roleResult.Errors.Select(e => e.Description).ToArray() }
            });
        }

        _logger.LogInformation("Created new Google-authenticated user {UserId} with role {Role}", user.Id, role);
        return user;
    }

    private static string ExtractFirstNameFromFullName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return string.Empty;
        var parts = fullName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        return parts.Length > 0 ? parts[0] : string.Empty;
    }

    private static string ExtractLastNameFromFullName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return string.Empty;
        var parts = fullName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        return parts.Length > 1 ? parts[1] : string.Empty;
    }

    /// <summary>
    /// 24 random bytes (192 bits) base64-encoded plus a fixed suffix that
    /// guarantees the password satisfies the Identity password policy
    /// (uppercase, lowercase, digit, non-alphanumeric).
    /// </summary>
    private static string GenerateSecureRandomPassword()
    {
        var bytes = RandomNumberGenerator.GetBytes(24);
        return Convert.ToBase64String(bytes) + "Aa1!";
    }
}
