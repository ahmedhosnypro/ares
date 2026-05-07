using Backend.Application.DTOs.Auth;
using Backend.Application.Services;
using Backend.Application.Validators;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Authentication controller providing user registration, login, password reset, and email verification
/// </summary>
/// <remarks>
/// This controller handles all authentication-related operations including:
/// - User registration with email verification
/// - User login with JWT token generation
/// - Password reset functionality
/// - Email verification
/// 
/// Rate limiting is applied to prevent abuse:
/// - Login: 5 attempts per 15 minutes per IP
/// - Registration: 5 attempts per hour per IP
/// </remarks>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user account
    /// </summary>
    /// <param name="request">Registration details including email, password, name, and consent flags</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Registration response with user ID and email verification status</returns>
    /// <response code="201">User account created successfully</response>
    /// <response code="400">Invalid request data or validation errors</response>
    /// <response code="409">Email address already registered</response>
    /// <response code="429">Rate limit exceeded - too many registration attempts</response>
    /// <remarks>
    /// Creates a new user account with the provided information. The user will need to verify their email address before they can log in.
    /// 
    /// **Rate Limiting**: 5 registration attempts per hour per IP address
    /// 
    /// **Validation Rules**:
    /// - Email must be valid format and unique
    /// - Password must meet security requirements (minimum 8 characters, contain uppercase, lowercase, number, and special character)
    /// - First name and last name are required
    /// - Terms and privacy policy acceptance is required
    /// 
    /// **Sample Request**:
    /// ```json
    /// {
    ///   "email": "user@example.com",
    ///   "password": "SecurePass123!",
    ///   "firstName": "John",
    ///   "lastName": "Doe",
    ///   "acceptedTerms": true,
    ///   "acceptedPrivacy": true
    /// }
    /// ```
    /// </remarks>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AuthResponse>> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        // Validate request
        var validator = new RegisterRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        
        if (!validationResult.IsValid)
        {
            return BadRequest(new
            {
                StatusCode = 400,
                Message = "Validation failed",
                ValidationErrors = validationResult.Errors.Select(e => new
                {
                    Field = e.PropertyName,
                    Message = e.ErrorMessage
                })
            });
        }

        var response = await _authService.RegisterAsync(request, cancellationToken);
        return CreatedAtAction(nameof(Register), new { userId = response.UserId }, response);
    }

    /// <summary>
    /// Authenticate user and generate JWT token
    /// </summary>
    /// <param name="request">Login credentials including email and password</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>JWT token and user information</returns>
    /// <response code="200">Authentication successful, JWT token returned</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="401">Invalid credentials</response>
    /// <response code="403">Account not verified or suspended</response>
    /// <response code="429">Rate limit exceeded - too many login attempts</response>
    /// <remarks>
    /// Authenticates a user with email and password, returning a JWT token for subsequent API calls.
    /// 
    /// **Rate Limiting**: 5 login attempts per 15 minutes per IP address
    /// 
    /// **Authentication Flow**:
    /// 1. Validate email and password
    /// 2. Check if email is verified
    /// 3. Generate JWT token with user claims
    /// 4. Return token with expiration and user details
    /// 
    /// **Stay Connected**: Set `stayConnected: true` to extend session to 400 days (default: 24 hours)
    /// 
    /// **Sample Request**:
    /// ```json
    /// {
    ///   "email": "user@example.com",
    ///   "password": "SecurePass123!",
    ///   "stayConnected": false
    /// }
    /// ```
    /// 
    /// **Sample Response**:
    /// ```json
    /// {
    ///   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    ///   "expiresAt": "2024-01-02T12:00:00Z",
    ///   "user": {
    ///     "id": "123e4567-e89b-12d3-a456-426614174000",
    ///     "email": "user@example.com",
    ///     "firstName": "John",
    ///     "lastName": "Doe",
    ///     "roles": ["Customer"],
    ///     "emailVerified": true
    ///   }
    /// }
    /// ```
    /// </remarks>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        // Validate request
        var validator = new LoginRequestValidator();
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        
        if (!validationResult.IsValid)
        {
            return BadRequest(new
            {
                StatusCode = 400,
                Message = "Validation failed",
                ValidationErrors = validationResult.Errors.Select(e => new
                {
                    Field = e.PropertyName,
                    Message = e.ErrorMessage
                })
            });
        }

        var response = await _authService.LoginAsync(request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Request password reset email
    /// </summary>
    /// <param name="request">Email address</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Success confirmation</returns>
    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await _authService.ForgotPasswordAsync(request, cancellationToken);
        return Ok(new { Message = "If the email exists, a password reset link has been sent." });
    }

    /// <summary>
    /// Reset password with token
    /// </summary>
    /// <param name="request">Reset password details</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Success confirmation</returns>
    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await _authService.ResetPasswordAsync(request, cancellationToken);
        return Ok(new { Message = "Password has been reset successfully." });
    }

    /// <summary>
    /// Verify email address with token
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="token">Email verification token</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Success confirmation</returns>
    [HttpPost("verify-email")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> VerifyEmail(
        [FromQuery] string userId,
        [FromQuery] string token,
        CancellationToken cancellationToken)
    {
        await _authService.VerifyEmailAsync(userId, token, cancellationToken);
        return Ok(new { Message = "Email verified successfully." });
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    /// <param name="request">Refresh token request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>New access token and refresh token</returns>
    /// <response code="200">Token refreshed successfully</response>
    /// <response code="401">Invalid or expired refresh token</response>
    /// <remarks>
    /// Exchanges a valid refresh token for a new access token and refresh token pair.
    /// The old refresh token is automatically revoked (token rotation).
    /// 
    /// **Token Rotation**: Each refresh generates a new refresh token and revokes the old one for security.
    /// 
    /// **Sample Request**:
    /// ```json
    /// {
    ///   "refreshToken": "base64-encoded-refresh-token"
    /// }
    /// ```
    /// </remarks>
    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> RefreshToken(
        [FromBody] RefreshTokenRequest request,
        CancellationToken cancellationToken)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var response = await _authService.RefreshTokenAsync(request, ipAddress, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Revoke refresh token
    /// </summary>
    /// <param name="request">Refresh token to revoke</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Success confirmation</returns>
    /// <response code="200">Token revoked successfully</response>
    /// <response code="401">Invalid token or not authorized</response>
    /// <response code="404">Token not found</response>
    /// <remarks>
    /// Revokes a refresh token, preventing it from being used for token refresh.
    /// Useful for logout functionality or security purposes.
    /// 
    /// **Sample Request**:
    /// ```json
    /// {
    ///   "refreshToken": "base64-encoded-refresh-token"
    /// }
    /// ```
    /// </remarks>
    [HttpPost("revoke-token")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeToken(
        [FromBody] RefreshTokenRequest request,
        CancellationToken cancellationToken)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        await _authService.RevokeTokenAsync(request.RefreshToken, ipAddress, cancellationToken);
        return Ok(new { Message = "Token revoked successfully" });
    }

    [HttpGet("demo-roles")]
    [ProducesResponseType(typeof(List<string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<string>>> GetDemoRoles(CancellationToken cancellationToken)
    {
        var roles = await _authService.GetDemoRolesAsync(cancellationToken);
        return Ok(roles);
    }

    [HttpPost("demo-login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> DemoLogin(
        [FromBody] DemoLoginRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.DemoLoginAsync(request.Role, cancellationToken);
        return Ok(response);
    }
}

public class DemoLoginRequest
{
    public string Role { get; set; } = null!;
}
