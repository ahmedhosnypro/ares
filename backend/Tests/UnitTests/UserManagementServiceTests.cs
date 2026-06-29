using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.UserManagement;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Tests.TestUtilities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using MockQueryable.Moq;
using Xunit;

namespace Backend.Tests.UnitTests;

/// <summary>
/// Unit tests for UserManagementService functionality.
/// Tests GetUsersAsync with pagination, CreateUserAsync, UpdateUserAsync, and authorization scenarios.
/// </summary>
public class UserManagementServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<RoleManager<IdentityRole<Guid>>> _roleManagerMock;
    private readonly Mock<ILogger<UserManagementService>> _loggerMock;
    private readonly UserManagementService _userManagementService;

    public UserManagementServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _userManagerMock = CreateMockUserManager();
        _roleManagerMock = CreateMockRoleManager();
        _loggerMock = new Mock<ILogger<UserManagementService>>();

        var emptyUsers = new List<ApplicationUser>().AsQueryable().BuildMockDbSet();
        _userManagerMock.SetupGet(x => x.Users).Returns(emptyUsers.Object);

        _userManagementService = new UserManagementService(
            _userRepositoryMock.Object,
            _userManagerMock.Object,
            _roleManagerMock.Object,
            _loggerMock.Object,
            new Mock<ISupplierRestrictionService>().Object,
            new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>().Object, new Mock<IApplicationDbContext>().Object);
    }

    #region GetUsersAsync Tests

    [Fact]
    public async Task GetUsersAsync_WithValidPagination_ShouldReturnPagedResults()
    {
        // Arrange
        var page = 1;
        var pageSize = 10;
        var users = CreateTestUsers(15); // More than page size

        var pagedResult = new PagedResult<ApplicationUser>(
            Data: users.Take(pageSize).ToList(),
            Page: page,
            PageSize: pageSize,
            TotalCount: users.Count,
            TotalPages: 2);

        _userRepositoryMock.Setup(x => x.GetPagedAsync(
            page,
            pageSize,
            null,
            It.IsAny<Func<IQueryable<ApplicationUser>, IOrderedQueryable<ApplicationUser>>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        var emptyUsers = new List<ApplicationUser>().AsQueryable().BuildMock();
        _userManagerMock.SetupGet(x => x.Users).Returns(emptyUsers);

        // Setup roles for each user
        foreach (var user in users.Take(pageSize))
        {
            _userManagerMock.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "Customer" });
        }

        var result = await _userManagementService.GetUsersAsync(page, pageSize);
        // Assert
        Assert.NotNull(result);
        Assert.Equal(page, result.CurrentPage);
        Assert.Equal(pageSize, result.PageSize);
        Assert.Equal(15, result.TotalCount);
        Assert.Equal(2, result.TotalPages);
        Assert.Equal(10, result.Items.Count);

        var firstUser = result.Items.First();
        Assert.NotEqual(Guid.Empty, firstUser.Id);
        Assert.NotEmpty(firstUser.Email);
        Assert.NotEmpty(firstUser.FirstName);
        Assert.NotEmpty(firstUser.LastName);
        Assert.Contains("Customer", firstUser.Roles);

        _userRepositoryMock.Verify(x => x.GetPagedAsync(
            page,
            pageSize,
            null,
            It.IsAny<Func<IQueryable<ApplicationUser>, IOrderedQueryable<ApplicationUser>>>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(0, 20, 1, 20)] // Invalid page should default to 1
    [InlineData(-1, 20, 1, 20)] // Negative page should default to 1
    [InlineData(1, 0, 1, 20)] // Invalid page size should default to 20
    [InlineData(1, -1, 1, 20)] // Negative page size should default to 20
    [InlineData(1, 150, 1, 100)] // Page size too large should be capped at 100
    public async Task GetUsersAsync_WithInvalidPagination_ShouldUseValidDefaults(
        int inputPage, int inputPageSize, int expectedPage, int expectedPageSize)
    {
        // Arrange
        var users = CreateTestUsers(5);
        var pagedResult = new PagedResult<ApplicationUser>(
            Data: users,
            Page: expectedPage,
            PageSize: expectedPageSize,
            TotalCount: users.Count,
            TotalPages: 1);

        _userRepositoryMock.Setup(x => x.GetPagedAsync(
            expectedPage,
            expectedPageSize,
            null,
            It.IsAny<Func<IQueryable<ApplicationUser>, IOrderedQueryable<ApplicationUser>>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        foreach (var user in users)
        {
            _userManagerMock.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "Customer" });
        }

        // Act
        var result = await _userManagementService.GetUsersAsync(inputPage, inputPageSize);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expectedPage, result.CurrentPage);
        Assert.Equal(expectedPageSize, result.PageSize);

        _userRepositoryMock.Verify(x => x.GetPagedAsync(
            expectedPage,
            expectedPageSize,
            null,
            It.IsAny<Func<IQueryable<ApplicationUser>, IOrderedQueryable<ApplicationUser>>>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetUsersAsync_WithEmptyResults_ShouldReturnEmptyPagedResult()
    {
        // Arrange
        var page = 1;
        var pageSize = 10;
        var emptyResult = new PagedResult<ApplicationUser>(
            Data: new List<ApplicationUser>(),
            Page: page,
            PageSize: pageSize,
            TotalCount: 0,
            TotalPages: 0);

        _userRepositoryMock.Setup(x => x.GetPagedAsync(
            page,
            pageSize,
            null,
            It.IsAny<Func<IQueryable<ApplicationUser>, IOrderedQueryable<ApplicationUser>>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyResult);

        // Act
        var result = await _userManagementService.GetUsersAsync(page, pageSize);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalCount);
        Assert.Equal(0, result.TotalPages);
    }

    [Fact]
    public async Task GetUsersAsync_ShouldIncludeUserRoles()
    {
        // Arrange
        var users = CreateTestUsers(2);
        var pagedResult = new PagedResult<ApplicationUser>(
            Data: users,
            Page: 1,
            PageSize: 10,
            TotalCount: 2,
            TotalPages: 1);

        _userRepositoryMock.Setup(x => x.GetPagedAsync(
            It.IsAny<int>(),
            It.IsAny<int>(),
            null,
            It.IsAny<Func<IQueryable<ApplicationUser>, IOrderedQueryable<ApplicationUser>>>(),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Setup different roles for each user
        _userManagerMock.Setup(x => x.GetRolesAsync(users[0]))
            .ReturnsAsync(new List<string> { "Admin", "Customer" });
        _userManagerMock.Setup(x => x.GetRolesAsync(users[1]))
            .ReturnsAsync(new List<string> { "Supplier" });

        // Act
        var result = await _userManagementService.GetUsersAsync();

        // Assert
        Assert.Equal(2, result.Items.Count);
        Assert.Equal(2, result.Items[0].Roles.Count);
        Assert.Contains("Admin", result.Items[0].Roles);
        Assert.Contains("Customer", result.Items[0].Roles);
        Assert.Single(result.Items[1].Roles);
        Assert.Contains("Supplier", result.Items[1].Roles);
    }

    #endregion

    #region GetUserByIdAsync Tests

    [Fact]
    public async Task GetUserByIdAsync_WithExistingUser_ShouldReturnUserDetails()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId, "test@example.com", "John", "Doe");

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "Customer", "Admin" });

        // Act
        var result = await _userManagementService.GetUserByIdAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.Id);
        Assert.Equal("test@example.com", result.Email);
        Assert.Equal("John", result.FirstName);
        Assert.Equal("Doe", result.LastName);
        Assert.Equal(2, result.Roles.Count);
        Assert.Contains("Customer", result.Roles);
        Assert.Contains("Admin", result.Roles);

        _userRepositoryMock.Verify(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.GetRolesAsync(user), Times.Once);
    }

    [Fact]
    public async Task GetUserByIdAsync_WithNonExistentUser_ShouldReturnNull()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        // Act
        var result = await _userManagementService.GetUserByIdAsync(userId);

        // Assert
        Assert.Null(result);

        _userRepositoryMock.Verify(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.GetRolesAsync(It.IsAny<ApplicationUser>()), Times.Never);
    }

    #endregion

    #region CreateUserAsync Tests

    [Fact]
    public async Task CreateUserAsync_WithValidRequest_ShouldCreateUserSuccessfully()
    {
        // Arrange
        var request = new CreateUserRequest(
            Email: "newuser@example.com",
            Password: "SecurePassword123!",
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: "+1234567890",
            Status: "Active",
            Roles: new List<string> { "Customer" });

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Success);

        _roleManagerMock.Setup(x => x.RoleExistsAsync("Customer"))
            .ReturnsAsync(true);

        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Customer"))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _userManagementService.CreateUserAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal("User created successfully", result.Message);
        Assert.NotNull(result.UserId);
        Assert.NotEqual(Guid.Empty, result.UserId.Value);

        _userRepositoryMock.Verify(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password), Times.Once);
        _roleManagerMock.Verify(x => x.RoleExistsAsync("Customer"), Times.Once);
        _userManagerMock.Verify(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Customer"), Times.Once);
    }

    [Fact]
    public async Task CreateUserAsync_WithExistingEmail_ShouldThrowConflictException()
    {
        // Arrange
        var request = new CreateUserRequest(
            Email: "existing@example.com",
            Password: "SecurePassword123!",
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: null,
            Status: null,
            Roles: null);

        var existingUser = CreateTestUser(Guid.NewGuid(), "existing@example.com", "Existing", "User");

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ConflictException>(
            () => _userManagementService.CreateUserAsync(request));

        Assert.Equal("A user with this email address already exists", exception.Message);

        _userRepositoryMock.Verify(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task CreateUserAsync_WithUserManagerFailure_ShouldThrowValidationException()
    {
        // Arrange
        var request = new CreateUserRequest(
            Email: "test@example.com",
            Password: "weak",
            FirstName: "Test",
            LastName: "User",
            PhoneNumber: null,
            Status: null,
            Roles: null);

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        var identityErrors = new[]
        {
            new IdentityError { Code = "PasswordTooShort", Description = "Password is too short" },
            new IdentityError { Code = "PasswordRequiresDigit", Description = "Password must contain a digit" }
        };

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Failed(identityErrors));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _userManagementService.CreateUserAsync(request));

        Assert.Contains("PasswordTooShort", exception.Errors.Keys);
        Assert.Contains("PasswordRequiresDigit", exception.Errors.Keys);
    }

    [Fact]
    public async Task CreateUserAsync_WithNonExistentRole_ShouldSkipRoleAssignment()
    {
        // Arrange
        var request = new CreateUserRequest(
            Email: "test@example.com",
            Password: "SecurePassword123!",
            FirstName: "Test",
            LastName: "User",
            PhoneNumber: null,
            Status: null,
            Roles: new List<string> { "NonExistentRole", "Customer" });

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Success);

        _roleManagerMock.Setup(x => x.RoleExistsAsync("NonExistentRole"))
            .ReturnsAsync(false);
        _roleManagerMock.Setup(x => x.RoleExistsAsync("Customer"))
            .ReturnsAsync(true);

        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Customer"))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _userManagementService.CreateUserAsync(request);

        // Assert
        Assert.True(result.Success);

        _roleManagerMock.Verify(x => x.RoleExistsAsync("NonExistentRole"), Times.Once);
        _roleManagerMock.Verify(x => x.RoleExistsAsync("Customer"), Times.Once);
        _userManagerMock.Verify(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "NonExistentRole"), Times.Never);
        _userManagerMock.Verify(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Customer"), Times.Once);
    }

    [Fact]
    public async Task CreateUserAsync_WithoutRoles_ShouldCreateUserWithoutRoleAssignment()
    {
        // Arrange
        var request = new CreateUserRequest(
            Email: "test@example.com",
            Password: "SecurePassword123!",
            FirstName: "Test",
            LastName: "User",
            PhoneNumber: null,
            Status: null,
            Roles: null);

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _userManagementService.CreateUserAsync(request);

        // Assert
        Assert.True(result.Success);

        _roleManagerMock.Verify(x => x.RoleExistsAsync(It.IsAny<string>()), Times.Never);
        _userManagerMock.Verify(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()), Times.Never);
    }

    #endregion

    #region UpdateUserAsync Tests

    [Fact]
    public async Task UpdateUserAsync_WithValidRequest_ShouldUpdateUserSuccessfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId, "test@example.com", "John", "Doe");
        user.PhoneNumber = "+1234567890";

        var request = new UpdateUserRequest(
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: "+0987654321",
            Status: "Inactive",
            Roles: new List<string> { "Admin" });

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var emptyUsers = new List<ApplicationUser>().AsQueryable().BuildMockDbSet();
        _userManagerMock.Setup(x => x.Users)
            .Returns(emptyUsers.Object);

        _userManagerMock.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);

        _userManagerMock.Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "Customer" });

        _userManagerMock.Setup(x => x.RemoveFromRolesAsync(user, It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync(IdentityResult.Success);

        _roleManagerMock.Setup(x => x.RoleExistsAsync("Admin"))
            .ReturnsAsync(true);

        _userManagerMock.Setup(x => x.AddToRoleAsync(user, "Admin"))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _userManagementService.UpdateUserAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal("User updated successfully", result.Message);
        Assert.Equal(userId, result.UserId);

        // Verify user properties were updated
        Assert.Equal("Jane", user.FirstName);
        Assert.Equal("Smith", user.LastName);
        Assert.Equal("+0987654321", user.PhoneNumber);
        Assert.Equal("Inactive", user.Status);
        Assert.False(user.PhoneNumberConfirmed); // Should be reset when phone changes

        _userRepositoryMock.Verify(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.UpdateAsync(user), Times.Once);
        _userManagerMock.Verify(x => x.GetRolesAsync(user), Times.Once);
        _userManagerMock.Verify(x => x.RemoveFromRolesAsync(user, It.IsAny<IEnumerable<string>>()), Times.Once);
        _userManagerMock.Verify(x => x.AddToRoleAsync(user, "Admin"), Times.Once);
    }

    [Fact]
    public async Task UpdateUserAsync_WithNonExistentUser_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new UpdateUserRequest(
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: null,
            Status: "Active",
            Roles: null);

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _userManagementService.UpdateUserAsync(userId, request));

        Assert.Equal($"User with ID {userId} not found", exception.Message);

        _userRepositoryMock.Verify(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.UpdateAsync(It.IsAny<ApplicationUser>()), Times.Never);
    }

    [Fact]
    public async Task UpdateUserAsync_WithDuplicatePhoneNumber_ShouldThrowConflictException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId, "test@example.com", "John", "Doe");
        var otherUser = CreateTestUser(Guid.NewGuid(), "other@example.com", "Other", "User");
        otherUser.PhoneNumber = "+1234567890";

        var request = new UpdateUserRequest(
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: "+1234567890", // Same as other user
            Status: "Active",
            Roles: null);

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var users = new List<ApplicationUser> { user, otherUser }.AsQueryable().BuildMockDbSet();
        _userManagerMock.Setup(x => x.Users)
            .Returns(users.Object);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ConflictException>(
            () => _userManagementService.UpdateUserAsync(userId, request));

        Assert.Equal("Phone number is already in use by another user", exception.Message);

        _userRepositoryMock.Verify(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.UpdateAsync(It.IsAny<ApplicationUser>()), Times.Never);
    }

    [Fact]
    public async Task UpdateUserAsync_WithSamePhoneNumber_ShouldNotThrowConflictException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId, "test@example.com", "John", "Doe");
        user.PhoneNumber = "+1234567890";
        user.PhoneNumberConfirmed = true; // Set to confirmed initially

        var request = new UpdateUserRequest(
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: "+1234567890", // Same as current user's phone
            Status: "Active",
            Roles: null);

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var users = new List<ApplicationUser> { user }.AsQueryable().BuildMockDbSet();
        _userManagerMock.Setup(x => x.Users)
            .Returns(users.Object);

        _userManagerMock.Setup(x => x.UpdateAsync(user))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _userManagementService.UpdateUserAsync(userId, request);

        // Assert
        Assert.True(result.Success);
        Assert.True(user.PhoneNumberConfirmed); // Should remain confirmed since phone didn't change

        _userManagerMock.Verify(x => x.UpdateAsync(user), Times.Once);
    }

    [Fact]
    public async Task UpdateUserAsync_WithUserManagerFailure_ShouldThrowValidationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId, "test@example.com", "John", "Doe");

        var request = new UpdateUserRequest(
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: null,
            Status: "Active",
            Roles: null);

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var emptyUsers = new List<ApplicationUser>().AsQueryable().BuildMockDbSet();
        _userManagerMock.Setup(x => x.Users)
            .Returns(emptyUsers.Object);

        var identityErrors = new[]
        {
            new IdentityError { Code = "InvalidUserName", Description = "Invalid user name" }
        };

        _userManagerMock.Setup(x => x.UpdateAsync(user))
            .ReturnsAsync(IdentityResult.Failed(identityErrors));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _userManagementService.UpdateUserAsync(userId, request));

        Assert.Contains("InvalidUserName", exception.Errors.Keys);
    }

    [Fact]
    public async Task UpdateUserAsync_WithoutRoles_ShouldNotUpdateRoles()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId, "test@example.com", "John", "Doe");

        var request = new UpdateUserRequest(
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: null,
            Status: "Active",
            Roles: null); // No roles specified

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var emptyUsers = new List<ApplicationUser>().AsQueryable().BuildMockDbSet();
        _userManagerMock.Setup(x => x.Users)
            .Returns(emptyUsers.Object);

        _userManagerMock.Setup(x => x.UpdateAsync(user))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _userManagementService.UpdateUserAsync(userId, request);

        // Assert
        Assert.True(result.Success);

        _userManagerMock.Verify(x => x.GetRolesAsync(It.IsAny<ApplicationUser>()), Times.Never);
        _userManagerMock.Verify(x => x.RemoveFromRolesAsync(It.IsAny<ApplicationUser>(), It.IsAny<IEnumerable<string>>()), Times.Never);
        _userManagerMock.Verify(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()), Times.Never);
    }

    #endregion

    #region Helper Methods

    private List<ApplicationUser> CreateTestUsers(int count)
    {
        var users = new List<ApplicationUser>();
        for (int i = 0; i < count; i++)
        {
            users.Add(CreateTestUser(
                Guid.NewGuid(),
                $"user{i}@example.com",
                $"FirstName{i}",
                $"LastName{i}"));
        }
        return users;
    }

    private ApplicationUser CreateTestUser(Guid id, string email, string firstName, string lastName)
    {
        return new ApplicationUser
        {
            Id = id,
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            PhoneNumber = null,
            EmailConfirmed = true,
            PhoneNumberConfirmed = false,
            Status = "Active",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow
        };
    }

    private Mock<UserManager<ApplicationUser>> CreateMockUserManager()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        return new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
    }

    private Mock<RoleManager<IdentityRole<Guid>>> CreateMockRoleManager()
    {
        var store = new Mock<IRoleStore<IdentityRole<Guid>>>();
        return new Mock<RoleManager<IdentityRole<Guid>>>(
            store.Object, null!, null!, null!, null!);
    }

    #endregion
}
