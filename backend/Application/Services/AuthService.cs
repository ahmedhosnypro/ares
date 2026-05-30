using Backend.Application.DTOs.Auth;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;


namespace Backend.Application.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<AuthService> _logger;
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    // Optional + nullable so existing unit/property tests keep compiling
    // without a notification mock. Admin fan-out is best-effort.
    private readonly INotificationService? _notificationService;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtTokenService jwtTokenService,
        ILogger<AuthService> logger,
        IApplicationDbContext context,
        IConfiguration configuration,
        IEmailService emailService,
        INotificationService? notificationService = null)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
        _context = context;
        _configuration = configuration;
        _emailService = emailService;
        _notificationService = notificationService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Registration attempt for email: {Email}", request.Email);

        // Check if email already exists
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            _logger.LogWarning("Registration failed: Email already exists - {Email}", request.Email);
            throw new ConflictException("Email is already registered");
        }

        // Resolve the requested role (defaults to Customer for legacy
        // clients that don't send a Role field — keeps existing behaviour
        // for backwards compatibility). Only Customer and Supplier are
        // accepted on this self-service endpoint; the validator already
        // rejects anything else and admin / inspector accounts are
        // provisioned through the admin flow only.
        var requestedRole = ResolveSelfServiceRole(request.Role);

        // Create new user. Status is set to "Pending" so the user is
        // gated through the /complete-profile flow on the frontend before
        // they can do role-sensitive actions (Customer booking, Supplier
        // listing). Phone is stored on PhoneNumber so the verification +
        // driver-license flows that already read it work end-to-end.
        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            EmailConfirmed = false,
            Status = "Pending"
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogWarning("Registration failed for {Email}: {Errors}", request.Email, errors);
            var errorDict = new Dictionary<string, string[]>
            {
                { "Password", result.Errors.Select(e => e.Description).ToArray() }
            };
            throw new ValidationException(errorDict);
        }

        // Assign requested role (server-resolved, never trusts the raw
        // frontend value).
        await _userManager.AddToRoleAsync(user, requestedRole);

        // Generate email confirmation token
        var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);

        // Encode the token for use in URL
        var encodedToken = System.Web.HttpUtility.UrlEncode(emailToken);

        // Construct frontend verification URL
        // In a real scenario, the frontend URL should come from configuration
        var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:3000";
        var verificationUrl = $"{frontendUrl}/verify-email?userId={user.Id}&token={encodedToken}";

        // Send email verification email
        var subject = "Verify your email - Ares Car Rental";
        var message = $@"<h3>Hello {user.FirstName},</h3>
<p>Please confirm your email address by clicking the link below:</p>
<p><a href='{verificationUrl}' style='display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;'>Verify Email Address</a></p>
<p>Or copy and paste this link into your browser:</p>
<p>{verificationUrl}</p>
<p>If you did not request this account, please ignore this email.</p>
<br/>
<p>Best regards,<br/>Ares Car Rental Team</p>";

        await _emailService.SendEmailAsync(user.Email, subject, message);

        _logger.LogInformation("User registered successfully: {UserId}, Email: {Email}. Verification email sent.", user.Id, user.Email);

        // Fan-out to admins so the admin notification feed reflects real
        // user signups (treated as the "verification request submitted"
        // event in this project — registration triggers email verification).
        if (_notificationService is not null)
        {
            try
            {
                var displayName = $"{user.FirstName} {user.LastName}".Trim();
                if (string.IsNullOrWhiteSpace(displayName)) displayName = user.Email!;
                await _notificationService.NotifyAdminsAsync(
                    "New user registered",
                    $"{displayName} ({user.Email}) signed up and is pending email verification.",
                    "UserRegistered",
                    cancellationToken);
            }
            catch
            {
                // Best-effort only.
            }
        }

        return new AuthResponse(
            UserId: user.Id,
            Email: user.Email!,
            EmailVerified: false,
            Message: "Registration successful. Please check your email to verify your account before logging in."
        );
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Login attempt for email: {Email}", request.Email);

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            _logger.LogWarning("Login failed: User not found - {Email}", request.Email);
            throw new UnauthorizedException("Invalid email or password");
        }

        // Check if email is verified
        if (!user.EmailConfirmed)
        {
            _logger.LogWarning("Login failed: Email not verified - {Email}", request.Email);
            throw new ForbiddenException("Email not verified. Please verify your email before logging in.");
        }

        // Check if account is blocked by admin
        if (user.Status == "Blocked")
        {
            _logger.LogWarning("Login failed: Account blocked - {Email}", request.Email);
            throw new ForbiddenException("Your account has been blocked by an administrator. Please contact support.");
        }

        // Check if account is locked
        if (await _userManager.IsLockedOutAsync(user))
        {
            _logger.LogWarning("Login failed: Account locked - {Email}", request.Email);
            throw new ForbiddenException("Account is locked. Please try again later.");
        }

        // Verify password
        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);

        if (!result.Succeeded)
        {
            if (result.IsLockedOut)
            {
                _logger.LogWarning("Account locked out after failed login attempt - {Email}", request.Email);
                throw new ForbiddenException("Account is locked due to multiple failed login attempts.");
            }

            _logger.LogWarning("Login failed: Invalid password - {Email}", request.Email);
            throw new UnauthorizedException("Invalid email or password");
        }

        // Get user roles
        var roles = await _userManager.GetRolesAsync(user);

        // Generate JWT token
        var stayConnected = request.StayConnected ?? false;
        var token = _jwtTokenService.GenerateToken(user, roles, stayConnected);
        var expiresAt = _jwtTokenService.GetTokenExpiration(stayConnected);

        // Generate and store refresh token
        var ipAddress = "0.0.0.0"; // Will be set from controller
        var refreshToken = CreateRefreshToken(ipAddress);

        // Initialize refresh tokens list if null
        if (user.RefreshTokens == null)
        {
            user.RefreshTokens = new List<RefreshToken>();
        }

        user.RefreshTokens.Add(refreshToken);

        // Remove old refresh tokens
        RemoveOldRefreshTokens(user);

        await _userManager.UpdateAsync(user);

        _logger.LogInformation("User logged in successfully: {UserId}, Email: {Email}", user.Id, user.Email);

        return new LoginResponse(
            Token: token,
            RefreshToken: refreshToken.Token,
            ExpiresAt: expiresAt,
            User: new UserDto(
                Id: user.Id,
                Email: user.Email!,
                FirstName: user.FirstName ?? string.Empty,
                LastName: user.LastName ?? string.Empty,
                Roles: roles.ToList(),
                EmailVerified: user.EmailConfirmed,
                Status: user.Status
            )
        );
    }

    public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Password reset requested for email: {Email}", request.Email);

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            // Don't reveal that the user doesn't exist
            _logger.LogInformation("Password reset requested for non-existent email: {Email}", request.Email);
            return true;
        }

        // Generate password reset token
        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);

        // Encode the token and email for use in URL
        var encodedToken = System.Web.HttpUtility.UrlEncode(resetToken);
        var encodedEmail = System.Web.HttpUtility.UrlEncode(user.Email);

        // Construct frontend reset URL
        var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:3000";
        var resetUrl = $"{frontendUrl}/reset-password?email={encodedEmail}&token={encodedToken}";

        // Send password reset email
        var subject = "Reset your password - Ares Car Rental";
        var message = $@"<h3>Hello {user.FirstName},</h3>
<p>We received a request to reset your password. Please click the link below to set a new password:</p>
<p><a href='{resetUrl}' style='display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;'>Reset Password</a></p>
<p>Or copy and paste this link into your browser:</p>
<p>{resetUrl}</p>
<p>If you did not request this, please ignore this email.</p>
<br/>
<p>Best regards,<br/>Ares Car Rental Team</p>";

        await _emailService.SendEmailAsync(user.Email!, subject, message);

        _logger.LogInformation("Password reset token generated and email sent for user: {UserId}", user.Id);

        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Password reset attempt for email: {Email}", request.Email);

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            _logger.LogWarning("Password reset failed: User not found - {Email}", request.Email);
            throw new NotFoundException("User not found");
        }

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogWarning("Password reset failed for {Email}: {Errors}", request.Email, errors);
            var errorDict = new Dictionary<string, string[]>
            {
                { "Password", result.Errors.Select(e => e.Description).ToArray() }
            };
            throw new ValidationException(errorDict);
        }

        _logger.LogInformation("Password reset successful for user: {UserId}", user.Id);
        return true;
    }

    public async Task<bool> VerifyEmailAsync(string userId, string token, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Email verification attempt for user: {UserId}", userId);

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("Email verification failed: User not found - {UserId}", userId);
            throw new NotFoundException("User not found");
        }

        var result = await _userManager.ConfirmEmailAsync(user, token);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogWarning("Email verification failed for {UserId}: {Errors}", userId, errors);
            var errorDict = new Dictionary<string, string[]>
            {
                { "Token", result.Errors.Select(e => e.Description).ToArray() }
            };
            throw new ValidationException(errorDict);
        }

        _logger.LogInformation("Email verified successfully for user: {UserId}", userId);

        // Fan-out to admins — this is the closest event the codebase has to
        // a "verification approved" moment for a user. Best-effort.
        if (_notificationService is not null)
        {
            try
            {
                var displayName = $"{user.FirstName} {user.LastName}".Trim();
                if (string.IsNullOrWhiteSpace(displayName)) displayName = user.Email ?? userId;
                await _notificationService.NotifyAdminsAsync(
                    "User email verified",
                    $"{displayName} verified their email address.",
                    "UserVerified",
                    cancellationToken);
            }
            catch
            {
                // Best-effort only.
            }
        }

        return true;
    }

    public async Task<LoginResponse> RefreshTokenAsync(
        RefreshTokenRequest request,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Refresh token attempt from IP: {IpAddress}", ipAddress);

        // Find user with the refresh token
        var user = await _context.Users
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.RefreshTokens.Any(t => t.Token == request.RefreshToken), cancellationToken);

        if (user == null)
        {
            _logger.LogWarning("Refresh token failed: Token not found in database");
            throw new UnauthorizedException("Invalid refresh token");
        }

        var refreshToken = user.RefreshTokens.Single(x => x.Token == request.RefreshToken);
        _logger.LogInformation("Found refresh token for user {UserId}. ExpiresAt: {ExpiresAt}, CreatedAt: {CreatedAt}, IsExpired: {IsExpired}, IsRevoked: {IsRevoked}, CurrentUtc: {CurrentUtc}", 
            user.Id, refreshToken.ExpiresAt, refreshToken.CreatedAt, refreshToken.IsExpired, refreshToken.IsRevoked, DateTime.UtcNow);

        if (!refreshToken.IsActive)
        {
            var reason = refreshToken.IsExpired ? "expired" : "revoked";
            _logger.LogWarning("Refresh token failed: Token {Reason} for user {UserId}. IsExpired: {IsExpired}, IsRevoked: {IsRevoked}, ExpiresAt: {ExpiresAt}, RevokedAt: {RevokedAt}", 
                reason, user.Id, refreshToken.IsExpired, refreshToken.IsRevoked, refreshToken.ExpiresAt, refreshToken.RevokedAt);
            throw new UnauthorizedException($"Refresh token {reason}. Please login again.");
        }

        if (user.Status == "Blocked")
        {
            _logger.LogWarning("Refresh token failed: Account blocked for user {UserId}", user.Id);
            throw new ForbiddenException("Your account has been blocked by an administrator.");
        }

        // Replace old refresh token with a new one (rotation)
        var newRefreshToken = RotateRefreshToken(refreshToken, ipAddress);
        user.RefreshTokens.Add(newRefreshToken);

        // Remove old refresh tokens from user
        RemoveOldRefreshTokens(user);

        await _userManager.UpdateAsync(user);

        // Generate new JWT
        var roles = await _userManager.GetRolesAsync(user);
        var jwtToken = _jwtTokenService.GenerateToken(user, roles);
        var expiresAt = _jwtTokenService.GetTokenExpiration();

        _logger.LogInformation("Token refreshed successfully for user: {UserId}", user.Id);

        return new LoginResponse(
            Token: jwtToken,
            RefreshToken: newRefreshToken.Token,
            ExpiresAt: expiresAt,
            User: new UserDto(
                Id: user.Id,
                Email: user.Email!,
                FirstName: user.FirstName ?? string.Empty,
                LastName: user.LastName ?? string.Empty,
                Roles: roles.ToList(),
                EmailVerified: user.EmailConfirmed,
                Status: user.Status
            )
        );
    }

    public async Task RevokeTokenAsync(string token, string? ipAddress, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Revoke token attempt from IP: {IpAddress}", ipAddress);

        // Find user with the refresh token
        var users = await _context.Users
            .Where(u => u.RefreshTokens.Any(t => t.Token == token))
            .ToListAsync(cancellationToken);

        var user = users.FirstOrDefault();

        if (user == null)
        {
            _logger.LogWarning("Revoke token failed: Token not found");
            throw new NotFoundException("Token not found");
        }

        var refreshToken = user.RefreshTokens.Single(x => x.Token == token);

        if (!refreshToken.IsActive)
        {
            _logger.LogWarning("Revoke token failed: Token not active");
            throw new UnauthorizedException("Token is not active");
        }

        RevokeRefreshToken(refreshToken, ipAddress, "Revoked without replacement");

        await _userManager.UpdateAsync(user);

        _logger.LogInformation("Token revoked successfully for user: {UserId}", user.Id);
    }

    private RefreshToken CreateRefreshToken(string? ipAddress)
    {
        return new RefreshToken
        {
            Token = _jwtTokenService.GenerateRefreshToken(),
            ExpiresAt = _jwtTokenService.GetRefreshTokenExpiration(),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = ipAddress
        };
    }

    private RefreshToken RotateRefreshToken(RefreshToken refreshToken, string? ipAddress)
    {
        var newRefreshToken = CreateRefreshToken(ipAddress);
        RevokeRefreshToken(refreshToken, ipAddress, "Replaced by new token", newRefreshToken.Token);
        return newRefreshToken;
    }

    private void RevokeRefreshToken(RefreshToken token, string? ipAddress, string? reason = null, string? replacedByToken = null)
    {
        token.RevokedAt = DateTime.UtcNow;
        token.RevokedByIp = ipAddress;
        token.ReasonRevoked = reason;
        token.ReplacedByToken = replacedByToken;
    }

    private void RemoveOldRefreshTokens(ApplicationUser user)
    {
        // Remove refresh tokens older than X days (keep for audit trail)
        var ttl = int.Parse(_configuration["Jwt:RefreshTokenTTL"] ?? "90");
        user.RefreshTokens.RemoveAll(x =>
            !x.IsActive &&
            x.CreatedAt.AddDays(ttl) <= DateTime.UtcNow);
    }

    public async Task<List<string>> GetDemoRolesAsync(CancellationToken cancellationToken = default)
    {
        var isDemoSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "IsDemoView", cancellationToken);
        if (isDemoSetting == null || isDemoSetting.Value != "true")
        {
            return new List<string>();
        }

        return new List<string> { "Customer", "Supplier", "Admin" };
    }

    public async Task<LoginResponse> DemoLoginAsync(string role, CancellationToken cancellationToken = default)
    {
        var isDemoSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "IsDemoView", cancellationToken);
        if (isDemoSetting == null || isDemoSetting.Value != "true")
        {
            throw new UnauthorizedException("Demo login is disabled");
        }

        // Find user by role
        var usersInRole = await _userManager.GetUsersInRoleAsync(role);
        var user = usersInRole.FirstOrDefault();

        if (user == null)
        {
            throw new UnauthorizedException($"No demo account found for role {role}");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtTokenService.GenerateToken(user, roles, false);
        var expiresAt = _jwtTokenService.GetTokenExpiration(false);
        var ipAddress = "0.0.0.0";
        var refreshToken = CreateRefreshToken(ipAddress);

        if (user.RefreshTokens == null)
            user.RefreshTokens = new List<RefreshToken>();
        user.RefreshTokens.Add(refreshToken);
        RemoveOldRefreshTokens(user);
        await _userManager.UpdateAsync(user);

        return new LoginResponse(
            Token: token,
            RefreshToken: refreshToken.Token,
            ExpiresAt: expiresAt,
            User: new UserDto(
                Id: user.Id,
                Email: user.Email!,
                FirstName: user.FirstName ?? string.Empty,
                LastName: user.LastName ?? string.Empty,
                Roles: roles.ToList(),
                EmailVerified: user.EmailConfirmed,
                Status: user.Status
            )
        );
    }

    /// <inheritdoc />
    public async Task CompleteProfileAsync(Guid userId, CompleteProfileRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("User not found");

        // Apply optional overrides (only if non-empty after trimming —
        // don't accidentally wipe an existing name/phone).
        if (!string.IsNullOrWhiteSpace(request.FirstName))
        {
            user.FirstName = request.FirstName.Trim();
        }
        if (!string.IsNullOrWhiteSpace(request.LastName))
        {
            user.LastName = request.LastName.Trim();
        }
        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            user.PhoneNumber = request.Phone.Trim();
        }

        // Flip status away from Pending. Already-Active users get a no-op
        // so this stays idempotent.
        if (string.Equals(user.Status, "Pending", StringComparison.OrdinalIgnoreCase))
        {
            user.Status = "Active";
        }

        user.UpdatedAt = DateTime.UtcNow;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogWarning("Profile completion failed for user {UserId}: {Errors}", userId, errors);
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { "User", result.Errors.Select(e => e.Description).ToArray() }
            });
        }

        _logger.LogInformation("Profile completed for user {UserId}", userId);
    }

    /// <summary>
    /// Maps a raw role string from the registration payload to a canonical
    /// ASP.NET Identity role name. Only <c>"customer"</c> and
    /// <c>"supplier"</c> are accepted on this self-service endpoint —
    /// Admin / Inspector accounts must be provisioned through the
    /// administrative flow. The mapping is case-insensitive; any unknown
    /// or null value resolves to <c>"Customer"</c>, which preserves the
    /// historical default for clients that don't send the field.
    /// </summary>
    private static string ResolveSelfServiceRole(string? requested)
    {
        if (string.IsNullOrWhiteSpace(requested))
        {
            return "Customer";
        }

        if (requested.Equals("supplier", StringComparison.OrdinalIgnoreCase))
        {
            return "Supplier";
        }

        // Any other value — including the explicit "customer" — falls
        // through to the Customer default.
        return "Customer";
    }
}
