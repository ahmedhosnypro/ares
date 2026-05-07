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

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtTokenService jwtTokenService,
        ILogger<AuthService> logger,
        IApplicationDbContext context,
        IConfiguration configuration,
        IEmailService emailService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
        _context = context;
        _configuration = configuration;
        _emailService = emailService;
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

        // Create new user
        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            EmailConfirmed = false
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

        // Assign default Customer role
        await _userManager.AddToRoleAsync(user, "Customer");

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
                EmailVerified: user.EmailConfirmed
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
        return true;
    }

    public async Task<LoginResponse> RefreshTokenAsync(
        RefreshTokenRequest request,
        string? ipAddress,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Refresh token attempt from IP: {IpAddress}", ipAddress);

        // Find user with the refresh token
        var users = await _context.Users
            .Where(u => u.RefreshTokens.Any(t => t.Token == request.RefreshToken))
            .ToListAsync(cancellationToken);

        var user = users.FirstOrDefault();

        if (user == null)
        {
            _logger.LogWarning("Refresh token failed: Invalid token");
            throw new UnauthorizedException("Invalid refresh token");
        }

        var refreshToken = user.RefreshTokens.Single(x => x.Token == request.RefreshToken);

        if (!refreshToken.IsActive)
        {
            _logger.LogWarning("Refresh token failed: Token not active for user {UserId}", user.Id);
            throw new UnauthorizedException("Invalid refresh token");
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
                EmailVerified: user.EmailConfirmed
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
                EmailVerified: user.EmailConfirmed
            )
        );
    }
}
