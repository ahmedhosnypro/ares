using Backend.Application.DTOs.Auth;
using Backend.Application.Exceptions;
using Backend.Application.Services;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Backend.Tests.UnitTests;

public class AuthServiceTests
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<SignInManager<ApplicationUser>> _signInManagerMock;
    private readonly Mock<IJwtTokenService> _jwtTokenServiceMock;
    private readonly Mock<ILogger<AuthService>> _loggerMock;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        // Mock UserManager
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        // Mock SignInManager
        var contextAccessorMock = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        var userPrincipalFactoryMock = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
        _signInManagerMock = new Mock<SignInManager<ApplicationUser>>(
            _userManagerMock.Object,
            contextAccessorMock.Object,
            userPrincipalFactoryMock.Object,
            null!, null!, null!, null!);

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

    #region RegisterAsync Tests

    [Fact]
    public async Task RegisterAsync_WithValidRequest_ShouldCreateUserAndReturnAuthResponse()
    {
        // Arrange
        var request = new RegisterRequest(
            Email: "test@example.com",
            Password: "Password123!",
            FirstName: "John",
            LastName: "Doe",
            AcceptedTerms: true,
            AcceptedPrivacy: true
        );

        var userId = Guid.NewGuid();
        var createdUser = new ApplicationUser
        {
            Id = userId,
            Email = request.Email,
            UserName = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            EmailConfirmed = false
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Success)
            .Callback<ApplicationUser, string>((user, password) =>
            {
                user.Id = userId;
                user.Email = request.Email;
                user.UserName = request.Email;
                user.FirstName = request.FirstName;
                user.LastName = request.LastName;
                user.EmailConfirmed = false;
            });

        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Customer"))
            .ReturnsAsync(IdentityResult.Success);

        _userManagerMock.Setup(x => x.GenerateEmailConfirmationTokenAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync("email-confirmation-token");

        // Act
        var result = await _authService.RegisterAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.Equal(request.Email, result.Email);
        Assert.False(result.EmailVerified);
        Assert.Contains("Registration successful", result.Message);

        _userManagerMock.Verify(x => x.FindByEmailAsync(request.Email), Times.Once);
        _userManagerMock.Verify(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password), Times.Once);
        _userManagerMock.Verify(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Customer"), Times.Once);
        _userManagerMock.Verify(x => x.GenerateEmailConfirmationTokenAsync(It.IsAny<ApplicationUser>()), Times.Once);
    }

    [Fact]
    public async Task RegisterAsync_WithDuplicateEmail_ShouldThrowConflictException()
    {
        // Arrange
        var request = new RegisterRequest(
            Email: "existing@example.com",
            Password: "Password123!",
            FirstName: "John",
            LastName: "Doe",
            AcceptedTerms: true,
            AcceptedPrivacy: true
        );

        var existingUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            UserName = request.Email
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(existingUser);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ConflictException>(
            () => _authService.RegisterAsync(request));

        Assert.Equal("Email is already registered", exception.Message);
        _userManagerMock.Verify(x => x.FindByEmailAsync(request.Email), Times.Once);
        _userManagerMock.Verify(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task RegisterAsync_WithInvalidPassword_ShouldThrowValidationException()
    {
        // Arrange
        var request = new RegisterRequest(
            Email: "test@example.com",
            Password: "weak",
            FirstName: "John",
            LastName: "Doe",
            AcceptedTerms: true,
            AcceptedPrivacy: true
        );

        var identityErrors = new[]
        {
            new IdentityError { Code = "PasswordTooShort", Description = "Password is too short" },
            new IdentityError { Code = "PasswordRequiresDigit", Description = "Password must contain a digit" }
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Failed(identityErrors));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _authService.RegisterAsync(request));

        Assert.Contains("Password", exception.Errors.Keys);
        Assert.Equal(2, exception.Errors["Password"].Length);
        Assert.Contains("Password is too short", exception.Errors["Password"]);
        Assert.Contains("Password must contain a digit", exception.Errors["Password"]);
    }

    #endregion

    #region LoginAsync Tests

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldReturnLoginResponse()
    {
        // Arrange
        var request = new LoginRequest(
            Email: "test@example.com",
            Password: "Password123!",
            StayConnected: false
        );

        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = request.Email,
            UserName = request.Email,
            FirstName = "John",
            LastName = "Doe",
            EmailConfirmed = true
        };

        var roles = new List<string> { "Customer" };
        var token = "jwt-token";
        var expiresAt = DateTime.UtcNow.AddHours(1);

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(SignInResult.Success);

        _userManagerMock.Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(roles);

        _jwtTokenServiceMock.Setup(x => x.GenerateToken(user, roles, false))
            .Returns(token);

        _jwtTokenServiceMock.Setup(x => x.GetTokenExpiration(false))
            .Returns(expiresAt);

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(token, result.Token);
        Assert.Equal(expiresAt, result.ExpiresAt);
        Assert.NotNull(result.User);
        Assert.Equal(userId, result.User.Id);
        Assert.Equal(request.Email, result.User.Email);
        Assert.Equal("John", result.User.FirstName);
        Assert.Equal("Doe", result.User.LastName);
        Assert.Equal(roles, result.User.Roles);
        Assert.True(result.User.EmailVerified);
    }

    [Fact]
    public async Task LoginAsync_WithStayConnectedTrue_ShouldExtendTokenExpiration()
    {
        // Arrange
        var request = new LoginRequest(
            Email: "test@example.com",
            Password: "Password123!",
            StayConnected: true
        );

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            UserName = request.Email,
            FirstName = "John",
            LastName = "Doe",
            EmailConfirmed = true
        };

        var roles = new List<string> { "Customer" };
        var token = "jwt-token";
        var extendedExpiresAt = DateTime.UtcNow.AddDays(400);

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(SignInResult.Success);

        _userManagerMock.Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(roles);

        _jwtTokenServiceMock.Setup(x => x.GenerateToken(user, roles, true))
            .Returns(token);

        _jwtTokenServiceMock.Setup(x => x.GetTokenExpiration(true))
            .Returns(extendedExpiresAt);

        // Act
        var result = await _authService.LoginAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(token, result.Token);
        Assert.Equal(extendedExpiresAt, result.ExpiresAt);

        _jwtTokenServiceMock.Verify(x => x.GenerateToken(user, roles, true), Times.Once);
        _jwtTokenServiceMock.Verify(x => x.GetTokenExpiration(true), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidEmail_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var request = new LoginRequest(
            Email: "nonexistent@example.com",
            Password: "Password123!",
            StayConnected: false
        );

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync((ApplicationUser?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedException>(
            () => _authService.LoginAsync(request));

        Assert.Equal("Invalid email or password", exception.Message);
        _userManagerMock.Verify(x => x.FindByEmailAsync(request.Email), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithUnverifiedEmail_ShouldThrowForbiddenException()
    {
        // Arrange
        var request = new LoginRequest(
            Email: "unverified@example.com",
            Password: "Password123!",
            StayConnected: false
        );

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            UserName = request.Email,
            EmailConfirmed = false
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ForbiddenException>(
            () => _authService.LoginAsync(request));

        Assert.Contains("Email not verified", exception.Message);
        _userManagerMock.Verify(x => x.FindByEmailAsync(request.Email), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_WithLockedAccount_ShouldThrowForbiddenException()
    {
        // Arrange
        var request = new LoginRequest(
            Email: "locked@example.com",
            Password: "Password123!",
            StayConnected: false
        );

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            UserName = request.Email,
            EmailConfirmed = true
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(true);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ForbiddenException>(
            () => _authService.LoginAsync(request));

        Assert.Contains("Account is locked", exception.Message);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var request = new LoginRequest(
            Email: "test@example.com",
            Password: "WrongPassword",
            StayConnected: false
        );

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            UserName = request.Email,
            EmailConfirmed = true
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(SignInResult.Failed);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedException>(
            () => _authService.LoginAsync(request));

        Assert.Equal("Invalid email or password", exception.Message);
    }

    [Fact]
    public async Task LoginAsync_WithPasswordCausingLockout_ShouldThrowForbiddenException()
    {
        // Arrange
        var request = new LoginRequest(
            Email: "test@example.com",
            Password: "WrongPassword",
            StayConnected: false
        );

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            UserName = request.Email,
            EmailConfirmed = true
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.IsLockedOutAsync(user))
            .ReturnsAsync(false);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, request.Password, true))
            .ReturnsAsync(SignInResult.LockedOut);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ForbiddenException>(
            () => _authService.LoginAsync(request));

        Assert.Contains("Account is locked due to multiple failed login attempts", exception.Message);
    }

    #endregion

    #region ForgotPasswordAsync Tests

    [Fact]
    public async Task ForgotPasswordAsync_WithValidEmail_ShouldReturnTrueAndGenerateToken()
    {
        // Arrange
        var request = new ForgotPasswordRequest("test@example.com");
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            UserName = request.Email
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.GeneratePasswordResetTokenAsync(user))
            .ReturnsAsync("reset-token");

        // Act
        var result = await _authService.ForgotPasswordAsync(request);

        // Assert
        Assert.True(result);
        _userManagerMock.Verify(x => x.FindByEmailAsync(request.Email), Times.Once);
        _userManagerMock.Verify(x => x.GeneratePasswordResetTokenAsync(user), Times.Once);
    }

    [Fact]
    public async Task ForgotPasswordAsync_WithNonExistentEmail_ShouldReturnTrueWithoutGeneratingToken()
    {
        // Arrange
        var request = new ForgotPasswordRequest("nonexistent@example.com");

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync((ApplicationUser?)null);

        // Act
        var result = await _authService.ForgotPasswordAsync(request);

        // Assert
        Assert.True(result); // Should return true to not reveal user existence
        _userManagerMock.Verify(x => x.FindByEmailAsync(request.Email), Times.Once);
        _userManagerMock.Verify(x => x.GeneratePasswordResetTokenAsync(It.IsAny<ApplicationUser>()), Times.Never);
    }

    #endregion

    #region ResetPasswordAsync Tests

    [Fact]
    public async Task ResetPasswordAsync_WithValidTokenAndPassword_ShouldReturnTrue()
    {
        // Arrange
        var request = new ResetPasswordRequest(
            Email: "test@example.com",
            Token: "valid-reset-token",
            NewPassword: "NewPassword123!"
        );

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            UserName = request.Email
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.ResetPasswordAsync(user, request.Token, request.NewPassword))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _authService.ResetPasswordAsync(request);

        // Assert
        Assert.True(result);
        _userManagerMock.Verify(x => x.FindByEmailAsync(request.Email), Times.Once);
        _userManagerMock.Verify(x => x.ResetPasswordAsync(user, request.Token, request.NewPassword), Times.Once);
    }

    [Fact]
    public async Task ResetPasswordAsync_WithNonExistentUser_ShouldThrowNotFoundException()
    {
        // Arrange
        var request = new ResetPasswordRequest(
            Email: "nonexistent@example.com",
            Token: "reset-token",
            NewPassword: "NewPassword123!"
        );

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync((ApplicationUser?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _authService.ResetPasswordAsync(request));

        Assert.Equal("User not found", exception.Message);
        _userManagerMock.Verify(x => x.FindByEmailAsync(request.Email), Times.Once);
    }

    [Fact]
    public async Task ResetPasswordAsync_WithInvalidToken_ShouldThrowValidationException()
    {
        // Arrange
        var request = new ResetPasswordRequest(
            Email: "test@example.com",
            Token: "invalid-token",
            NewPassword: "NewPassword123!"
        );

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            UserName = request.Email
        };

        var identityErrors = new[]
        {
            new IdentityError { Code = "InvalidToken", Description = "Invalid token" }
        };

        _userManagerMock.Setup(x => x.FindByEmailAsync(request.Email))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.ResetPasswordAsync(user, request.Token, request.NewPassword))
            .ReturnsAsync(IdentityResult.Failed(identityErrors));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _authService.ResetPasswordAsync(request));

        Assert.Contains("Password", exception.Errors.Keys);
        Assert.Contains("Invalid token", exception.Errors["Password"]);
    }

    #endregion

    #region VerifyEmailAsync Tests

    [Fact]
    public async Task VerifyEmailAsync_WithValidToken_ShouldReturnTrue()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var token = "valid-email-token";
        var user = new ApplicationUser
        {
            Id = Guid.Parse(userId),
            Email = "test@example.com",
            UserName = "test@example.com"
        };

        _userManagerMock.Setup(x => x.FindByIdAsync(userId))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.ConfirmEmailAsync(user, token))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _authService.VerifyEmailAsync(userId, token);

        // Assert
        Assert.True(result);
        _userManagerMock.Verify(x => x.FindByIdAsync(userId), Times.Once);
        _userManagerMock.Verify(x => x.ConfirmEmailAsync(user, token), Times.Once);
    }

    [Fact]
    public async Task VerifyEmailAsync_WithNonExistentUser_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var token = "email-token";

        _userManagerMock.Setup(x => x.FindByIdAsync(userId))
            .ReturnsAsync((ApplicationUser?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _authService.VerifyEmailAsync(userId, token));

        Assert.Equal("User not found", exception.Message);
        _userManagerMock.Verify(x => x.FindByIdAsync(userId), Times.Once);
    }

    [Fact]
    public async Task VerifyEmailAsync_WithInvalidToken_ShouldThrowValidationException()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var token = "invalid-token";
        var user = new ApplicationUser
        {
            Id = Guid.Parse(userId),
            Email = "test@example.com",
            UserName = "test@example.com"
        };

        var identityErrors = new[]
        {
            new IdentityError { Code = "InvalidToken", Description = "Invalid token" }
        };

        _userManagerMock.Setup(x => x.FindByIdAsync(userId))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.ConfirmEmailAsync(user, token))
            .ReturnsAsync(IdentityResult.Failed(identityErrors));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _authService.VerifyEmailAsync(userId, token));

        Assert.Contains("Token", exception.Errors.Keys);
        Assert.Contains("Invalid token", exception.Errors["Token"]);
    }

    #endregion
}