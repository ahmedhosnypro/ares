using Backend.Application.DTOs.Auth;
using Backend.Application.Exceptions;
using Backend.Application.Services;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Backend.Tests.PropertyTests;

/// <summary>
/// Property-based tests for authentication functionality using FsCheck.
/// Each property validates universal correctness guarantees across all valid inputs.
/// </summary>
public class AuthenticationPropertyTests
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<SignInManager<ApplicationUser>> _signInManagerMock;
    private readonly Mock<IJwtTokenService> _jwtTokenServiceMock;
    private readonly Mock<ILogger<AuthService>> _loggerMock;
    private readonly AuthService _authService;

    public AuthenticationPropertyTests()
    {
        // Setup UserManager mock
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        // Setup SignInManager mock
        var contextAccessorMock = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        var claimsFactoryMock = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
        _signInManagerMock = new Mock<SignInManager<ApplicationUser>>(
            _userManagerMock.Object, contextAccessorMock.Object, claimsFactoryMock.Object, null!, null!, null!, null!);

        _jwtTokenServiceMock = new Mock<IJwtTokenService>();
        _loggerMock = new Mock<ILogger<AuthService>>();

        var contextMock = new Mock<IApplicationDbContext>();
        var configurationMock = new Mock<IConfiguration>();
        var emailServiceMock = new Mock<IEmailService>();

        _authService = new AuthService(
            _userManagerMock.Object,
            _signInManagerMock.Object,
            _jwtTokenServiceMock.Object,
            _loggerMock.Object,
            contextMock.Object,
            configurationMock.Object,
            emailServiceMock.Object);
    }

    #region Property 1: Registration creates account with required response fields

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 1: Registration creates account with required response fields
    public bool RegistrationCreatesAccountWithRequiredResponseFields(string email, string password, string firstName, string lastName)
    {
        // Skip invalid inputs
        if (string.IsNullOrWhiteSpace(email) || !email.Contains("@") ||
            string.IsNullOrWhiteSpace(password) || password.Length < 6 ||
            string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
            return true;

        var request = new RegisterRequest(email, password, firstName, lastName, true, true);
        
        // Arrange
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            EmailConfirmed = false
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Success)
            .Callback<ApplicationUser, string>((u, p) => u.Id = userId);

        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Customer"))
            .ReturnsAsync(IdentityResult.Success);

        _userManagerMock.Setup(x => x.GenerateEmailConfirmationTokenAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync("test-token");

        // Act
        var response = _authService.RegisterAsync(request).Result;

        // Assert - Verify all required response fields are present
        return response.UserId != Guid.Empty &&
               response.Email == request.Email &&
               response.EmailVerified == false &&
               !string.IsNullOrEmpty(response.Message);
    }

    #endregion

    #region Property 2: Login returns complete authentication response

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 2: Login returns complete authentication response
    public bool LoginReturnsCompleteAuthenticationResponse(string email, string password, bool? stayConnected)
    {
        // Skip invalid inputs
        if (string.IsNullOrWhiteSpace(email) || !email.Contains("@") ||
            string.IsNullOrWhiteSpace(password) || password.Length < 6)
            return true;

        var request = new LoginRequest(email, password, stayConnected);
        
        // Arrange
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = request.Email,
            FirstName = "Test",
            LastName = "User",
            EmailConfirmed = true
        };

        var roles = new List<string> { "Customer" };
        var token = "test-jwt-token";
        var expiresAt = DateTime.UtcNow.AddHours(1);

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(SignInResult.Success);

        _userManagerMock.Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(roles);

        _jwtTokenServiceMock.Setup(x => x.GenerateToken(user, roles, request.StayConnected ?? false))
            .Returns(token);

        _jwtTokenServiceMock.Setup(x => x.GetTokenExpiration(request.StayConnected ?? false))
            .Returns(expiresAt);

        // Act
        var response = _authService.LoginAsync(request).Result;

        // Assert - Verify complete authentication response
        return !string.IsNullOrEmpty(response.Token) &&
               response.ExpiresAt > DateTime.UtcNow &&
               response.User.Id == userId &&
               response.User.Email == request.Email &&
               !string.IsNullOrEmpty(response.User.FirstName) &&
               !string.IsNullOrEmpty(response.User.LastName) &&
               response.User.Roles.Count > 0 &&
               response.User.EmailVerified == true;
    }

    #endregion

    #region Property 3: StayConnected extends session duration

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 3: StayConnected extends session duration
    public bool StayConnectedExtendsSessionDuration(string email, string password, bool stayConnected)
    {
        // Skip invalid inputs
        if (string.IsNullOrWhiteSpace(email) || !email.Contains("@") ||
            string.IsNullOrWhiteSpace(password) || password.Length < 6)
            return true;

        var request = new LoginRequest(email, password, stayConnected);
        
        // Arrange
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = request.Email,
            FirstName = "Test",
            LastName = "User",
            EmailConfirmed = true
        };

        var roles = new List<string> { "Customer" };
        var token = "test-jwt-token";
        
        // Set up different expiration times based on stayConnected
        var shortExpiration = DateTime.UtcNow.AddHours(1);
        var longExpiration = DateTime.UtcNow.AddDays(400);

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(SignInResult.Success);

        _userManagerMock.Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(roles);

        _jwtTokenServiceMock.Setup(x => x.GenerateToken(user, roles, It.IsAny<bool>()))
            .Returns(token);

        _jwtTokenServiceMock.Setup(x => x.GetTokenExpiration(false))
            .Returns(shortExpiration);

        _jwtTokenServiceMock.Setup(x => x.GetTokenExpiration(true))
            .Returns(longExpiration);

        // Act
        var response = _authService.LoginAsync(request).Result;

        // Assert - If stayConnected is true, expiration should be approximately 400 days in the future
        if (stayConnected)
        {
            var daysDifference = (response.ExpiresAt - DateTime.UtcNow).TotalDays;
            return daysDifference >= 399 && daysDifference <= 401; // Within 1 day tolerance
        }
        else
        {
            // For non-stayConnected, should be much shorter (hours, not days)
            var daysDifference = (response.ExpiresAt - DateTime.UtcNow).TotalDays;
            return daysDifference < 1; // Less than 1 day
        }
    }

    #endregion

    #region Property 4: Invalid credentials return 401

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 4: Invalid credentials return 401
    public bool InvalidCredentialsReturn401(string email, string password, bool isNonExistentEmail)
    {
        // Skip invalid inputs
        if (string.IsNullOrWhiteSpace(email) || !email.Contains("@") ||
            string.IsNullOrWhiteSpace(password) || password.Length < 6)
            return true;

        var request = new LoginRequest(email, password, null);
        
        // Arrange - Setup for invalid credentials scenarios
        if (isNonExistentEmail)
        {
            _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
                .ReturnsAsync((ApplicationUser?)null);
        }
        else
        {
            // User exists but wrong password
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                EmailConfirmed = true
            };

            _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
                .ReturnsAsync(user);

            _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
                .ReturnsAsync(false);

            _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
                .ReturnsAsync(SignInResult.Failed);
        }

        // Act & Assert
        try
        {
            var response = _authService.LoginAsync(request).Result;
            return false; // Should have thrown exception
        }
        catch (AggregateException ex) when (ex.InnerException is UnauthorizedException)
        {
            return true; // Expected exception
        }
        catch
        {
            return false; // Unexpected exception
        }
    }

    #endregion

    #region Property 5: Invalid registration data returns 400 with validation errors

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 5: Invalid registration data returns 400 with validation errors
    public bool InvalidRegistrationDataReturns400WithValidationErrors(string email, string weakPassword, string firstName)
    {
        // Generate weak passwords for testing
        var invalidPasswords = new[] { "123", "password", "PASSWORD", "Pass", "12345" };
        var password = invalidPasswords[Math.Abs(weakPassword?.GetHashCode() ?? 0) % invalidPasswords.Length];
        
        if (string.IsNullOrWhiteSpace(email) || !email.Contains("@") ||
            string.IsNullOrWhiteSpace(firstName))
            return true;

        var request = new RegisterRequest(email, password, firstName, "LastName", true, true);
        
        // Arrange
        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync((ApplicationUser?)null);

        var identityErrors = new List<IdentityError>
        {
            new() { Code = "PasswordTooShort", Description = "Password is too short" },
            new() { Code = "PasswordRequiresDigit", Description = "Password must contain a digit" }
        };

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Failed(identityErrors.ToArray()));

        // Act & Assert
        try
        {
            var response = _authService.RegisterAsync(request).Result;
            return false; // Should have thrown exception
        }
        catch (AggregateException ex) when (ex.InnerException is ValidationException validationEx)
        {
            return validationEx.Errors != null && validationEx.Errors.Count > 0;
        }
        catch
        {
            return false; // Unexpected exception
        }
    }

    #endregion

}