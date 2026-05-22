using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Public;
using Backend.Application.DTOs.Supplier;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Tests.TestUtilities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Backend.Tests.UnitTests;

/// <summary>
/// Unit tests for SupplierService functionality.
/// Tests GetSuppliersAsync with pagination, CreateSupplierAsync, UpdateSupplierAsync, and authorization scenarios.
/// </summary>
public class SupplierServiceTests
{
    private readonly Mock<ISupplierRepository> _supplierRepositoryMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<RoleManager<IdentityRole<Guid>>> _roleManagerMock;
    private readonly Mock<ILogger<SupplierService>> _loggerMock;
    private readonly SupplierService _supplierService;

    public SupplierServiceTests()
    {
        _supplierRepositoryMock = new Mock<ISupplierRepository>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _userManagerMock = CreateMockUserManager();
        _roleManagerMock = CreateMockRoleManager();
        _loggerMock = new Mock<ILogger<SupplierService>>();

        _supplierService = new SupplierService(
            _supplierRepositoryMock.Object,
            _userRepositoryMock.Object,
            _userManagerMock.Object,
            _roleManagerMock.Object,
            _loggerMock.Object);
    }

    #region GetSuppliersAsync Tests

    [Fact]
    public async Task GetSuppliersAsync_WithValidPagination_ShouldReturnPagedResults()
    {
        // Arrange
        var page = 1;
        var pageSize = 10;
        var suppliers = CreateTestSuppliers(15); // More than page size

        var pagedResult = new PagedResult<ApplicationUser>(
            Data: suppliers.Take(pageSize).ToList(),
            Page: page,
            PageSize: pageSize,
            TotalCount: suppliers.Count,
            TotalPages: 2);

        _supplierRepositoryMock.Setup(x => x.GetSuppliersAsync(page, pageSize, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Setup roles and company profiles for each supplier
        foreach (var supplier in suppliers.Take(pageSize))
        {
            _userManagerMock.Setup(x => x.GetRolesAsync(supplier))
                .ReturnsAsync(new List<string> { "Supplier" });

            _supplierRepositoryMock.Setup(x => x.GetCompanyProfileAsync(supplier.Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(CreateTestCompanyProfile(supplier.Id));
        }
        // Act
        var result = await _supplierService.GetSuppliersAsync(page, pageSize);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(page, result.Page);
        Assert.Equal(pageSize, result.PageSize);
        Assert.Equal(15, result.TotalCount);
        Assert.Equal(2, result.TotalPages);
        Assert.Equal(10, result.Data.Count);

        var firstSupplier = result.Data.First();
        Assert.NotEqual(Guid.Empty, firstSupplier.Id);
        Assert.NotEmpty(firstSupplier.Email);
        Assert.NotEmpty(firstSupplier.FirstName);
        Assert.NotEmpty(firstSupplier.LastName);
        Assert.Contains("Supplier", firstSupplier.Roles);
        Assert.NotNull(firstSupplier.CompanyProfile);

        _supplierRepositoryMock.Verify(x => x.GetSuppliersAsync(page, pageSize, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(0, 20, 1, 20)] // Invalid page should default to 1
    [InlineData(-1, 20, 1, 20)] // Negative page should default to 1
    [InlineData(1, 0, 1, 20)] // Invalid page size should default to 20
    [InlineData(1, -1, 1, 20)] // Negative page size should default to 20
    [InlineData(1, 150, 1, 100)] // Page size too large should be capped at 100
    public async Task GetSuppliersAsync_WithInvalidPagination_ShouldUseValidDefaults(
        int inputPage, int inputPageSize, int expectedPage, int expectedPageSize)
    {
        // Arrange
        var suppliers = CreateTestSuppliers(5);
        var pagedResult = new PagedResult<ApplicationUser>(
            Data: suppliers,
            Page: expectedPage,
            PageSize: expectedPageSize,
            TotalCount: suppliers.Count,
            TotalPages: 1);

        _supplierRepositoryMock.Setup(x => x.GetSuppliersAsync(expectedPage, expectedPageSize, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        foreach (var supplier in suppliers)
        {
            _userManagerMock.Setup(x => x.GetRolesAsync(supplier))
                .ReturnsAsync(new List<string> { "Supplier" });

            _supplierRepositoryMock.Setup(x => x.GetCompanyProfileAsync(supplier.Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(CreateTestCompanyProfile(supplier.Id));
        }

        // Act
        var result = await _supplierService.GetSuppliersAsync(inputPage, inputPageSize);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expectedPage, result.Page);
        Assert.Equal(expectedPageSize, result.PageSize);

        _supplierRepositoryMock.Verify(x => x.GetSuppliersAsync(expectedPage, expectedPageSize, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetSuppliersAsync_WithEmptyResults_ShouldReturnEmptyPagedResult()
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

        _supplierRepositoryMock.Setup(x => x.GetSuppliersAsync(page, pageSize, It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyResult);

        // Act
        var result = await _supplierService.GetSuppliersAsync(page, pageSize);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result.Data);
        Assert.Equal(0, result.TotalCount);
        Assert.Equal(0, result.TotalPages);
    }

    [Fact]
    public async Task GetSuppliersAsync_ShouldIncludeSupplierRolesAndCompanyProfile()
    {
        // Arrange
        var suppliers = CreateTestSuppliers(2);
        var pagedResult = new PagedResult<ApplicationUser>(
            Data: suppliers,
            Page: 1,
            PageSize: 10,
            TotalCount: 2,
            TotalPages: 1);

        _supplierRepositoryMock.Setup(x => x.GetSuppliersAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        // Setup different roles and company profiles for each supplier
        _userManagerMock.Setup(x => x.GetRolesAsync(suppliers[0]))
            .ReturnsAsync(new List<string> { "Supplier", "Admin" });
        _userManagerMock.Setup(x => x.GetRolesAsync(suppliers[1]))
            .ReturnsAsync(new List<string> { "Supplier" });

        _supplierRepositoryMock.Setup(x => x.GetCompanyProfileAsync(suppliers[0].Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CompanyProfile
            {
                UserId = suppliers[0].Id,
                CompanyName = "Test Company 1",
                CommercialRegistrationNumber = "CR001",
                TaxId = "TAX001"
            });

        _supplierRepositoryMock.Setup(x => x.GetCompanyProfileAsync(suppliers[1].Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CompanyProfile
            {
                UserId = suppliers[1].Id,
                CompanyName = "Test Company 2",
                CommercialRegistrationNumber = null,
                TaxId = null
            });

        // Act
        var result = await _supplierService.GetSuppliersAsync();

        // Assert
        Assert.Equal(2, result.Data.Count);
        Assert.Equal(2, result.Data[0].Roles.Count);
        Assert.Contains("Supplier", result.Data[0].Roles);
        Assert.Contains("Admin", result.Data[0].Roles);
        Assert.Single(result.Data[1].Roles);
        Assert.Contains("Supplier", result.Data[1].Roles);

        Assert.NotNull(result.Data[0].CompanyProfile);
        Assert.Equal("Test Company 1", result.Data[0].CompanyProfile!.CompanyName);
        Assert.Equal("CR001", result.Data[0].CompanyProfile!.CommercialRegistrationNumber);
        Assert.Equal("TAX001", result.Data[0].CompanyProfile!.TaxId);

        Assert.NotNull(result.Data[1].CompanyProfile);
        Assert.Equal("Test Company 2", result.Data[1].CompanyProfile!.CompanyName);
        Assert.Null(result.Data[1].CompanyProfile!.CommercialRegistrationNumber);
        Assert.Null(result.Data[1].CompanyProfile!.TaxId);
    }

    #endregion

    #region GetSupplierByIdAsync Tests

    [Fact]
    public async Task GetSupplierByIdAsync_WithExistingSupplier_ShouldReturnSupplierDetails()
    {
        // Arrange
        var supplierId = Guid.NewGuid();
        var supplier = CreateTestSupplier(supplierId, "supplier@example.com", "John", "Doe");

        _supplierRepositoryMock.Setup(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(supplier);

        _userManagerMock.Setup(x => x.GetRolesAsync(supplier))
            .ReturnsAsync(new List<string> { "Supplier", "Admin" });

        _supplierRepositoryMock.Setup(x => x.GetCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateTestCompanyProfile(supplierId));

        // Act
        var result = await _supplierService.GetSupplierByIdAsync(supplierId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(supplierId, result.Id);
        Assert.Equal("supplier@example.com", result.Email);
        Assert.Equal("John", result.FirstName);
        Assert.Equal("Doe", result.LastName);
        Assert.Equal(2, result.Roles.Count);
        Assert.Contains("Supplier", result.Roles);
        Assert.Contains("Admin", result.Roles);
        Assert.NotNull(result.CompanyProfile);

        _supplierRepositoryMock.Verify(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.GetRolesAsync(supplier), Times.Once);
    }

    [Fact]
    public async Task GetSupplierByIdAsync_WithNonExistentSupplier_ShouldReturnNull()
    {
        // Arrange
        var supplierId = Guid.NewGuid();

        _supplierRepositoryMock.Setup(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        // Act
        var result = await _supplierService.GetSupplierByIdAsync(supplierId);

        // Assert
        Assert.Null(result);

        _supplierRepositoryMock.Verify(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.GetRolesAsync(It.IsAny<ApplicationUser>()), Times.Never);
    }

    [Fact]
    public async Task GetSupplierByIdAsync_WithSupplierWithoutCompanyProfile_ShouldReturnSupplierWithNullProfile()
    {
        // Arrange
        var supplierId = Guid.NewGuid();
        var supplier = CreateTestSupplier(supplierId, "supplier@example.com", "John", "Doe");

        _supplierRepositoryMock.Setup(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(supplier);

        _userManagerMock.Setup(x => x.GetRolesAsync(supplier))
            .ReturnsAsync(new List<string> { "Supplier" });

        _supplierRepositoryMock.Setup(x => x.GetCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CompanyProfile?)null);

        // Act
        var result = await _supplierService.GetSupplierByIdAsync(supplierId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(supplierId, result.Id);
        Assert.Null(result.CompanyProfile);
    }

    [Fact]
    public async Task GetPublicSuppliersAsync_WithValidPagination_ShouldReturnPublicCards()
    {
        var suppliers = CreateTestSuppliers(3);
        var pagedResult = new PagedResult<ApplicationUser>(
            Data: suppliers,
            Page: 1,
            PageSize: 3,
            TotalCount: 3,
            TotalPages: 1);

        _supplierRepositoryMock.Setup(x => x.GetSuppliersAsync(1, 3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        foreach (var supplier in suppliers)
        {
            _supplierRepositoryMock.Setup(x => x.GetCompanyProfileAsync(supplier.Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new CompanyProfile
                {
                    UserId = supplier.Id,
                    CompanyName = $"Company {supplier.FirstName}",
                    CommercialRegistrationNumber = "CR-001",
                    TaxId = "TAX-001"
                });
        }

        var result = await _supplierService.GetPublicSuppliersAsync(1, 3);

        Assert.Equal(3, result.Data.Count);
        Assert.All(result.Data, supplier => Assert.NotEmpty(supplier.CompanyName));
        Assert.All(result.Data, supplier => Assert.NotEmpty(supplier.Email));
        Assert.All(result.Data, supplier => Assert.NotEqual(Guid.Empty, supplier.Id));
    }

    [Fact]
    public async Task GetPublicSupplierByIdAsync_WithExistingSupplier_ShouldReturnPublicCard()
    {
        var supplierId = Guid.NewGuid();
        var supplier = CreateTestSupplier(supplierId, "supplier@example.com", "John", "Doe");
        supplier.ProfileImage = "uploads/seed/suppliers/supplier-logo.png";

        _supplierRepositoryMock.Setup(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(supplier);

        _supplierRepositoryMock.Setup(x => x.GetCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CompanyProfile
            {
                UserId = supplierId,
                CompanyName = "Test Company",
                CommercialRegistrationNumber = "CR-123",
                TaxId = "TAX-123"
            });

        var result = await _supplierService.GetPublicSupplierByIdAsync(supplierId);

        Assert.NotNull(result);
        Assert.Equal(supplierId, result!.Id);
        Assert.Equal("Test Company", result.CompanyName);
        Assert.Equal("supplier@example.com", result.Email);
        Assert.Equal("uploads/seed/suppliers/supplier-logo.png", result.ProfileImage);
    }

    #endregion
    #region CreateSupplierAsync Tests

    [Fact]
    public async Task CreateSupplierAsync_WithValidRequest_ShouldCreateSupplierSuccessfully()
    {
        // Arrange
        var request = new CreateSupplierRequest(
            Email: "newsupplier@example.com",
            Password: "SecurePassword123!",
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: "+1234567890",
            Status: "Active",
            CompanyName: "Test Company Ltd",
            CommercialRegistrationNumber: "CR123456",
            TaxId: "TAX123456");

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Success);

        _roleManagerMock.Setup(x => x.RoleExistsAsync("Supplier"))
            .ReturnsAsync(true);

        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Supplier"))
            .ReturnsAsync(IdentityResult.Success);

        _supplierRepositoryMock.Setup(x => x.UpsertCompanyProfileAsync(It.IsAny<CompanyProfile>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<CompanyProfile>());

        // Act
        var result = await _supplierService.CreateSupplierAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal("Supplier created successfully", result.Message);
        Assert.NotNull(result.SupplierId);
        Assert.NotEqual(Guid.Empty, result.SupplierId.Value);

        _userRepositoryMock.Verify(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password), Times.Once);
        _roleManagerMock.Verify(x => x.RoleExistsAsync("Supplier"), Times.Once);
        _userManagerMock.Verify(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Supplier"), Times.Once);
        _supplierRepositoryMock.Verify(x => x.UpsertCompanyProfileAsync(It.IsAny<CompanyProfile>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateSupplierAsync_WithExistingEmail_ShouldThrowConflictException()
    {
        // Arrange
        var request = new CreateSupplierRequest(
            Email: "existing@example.com",
            Password: "SecurePassword123!",
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: null,
            Status: null,
            CompanyName: "Test Company",
            CommercialRegistrationNumber: null,
            TaxId: null);

        var existingUser = CreateTestSupplier(Guid.NewGuid(), "existing@example.com", "Existing", "User");

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ConflictException>(
            () => _supplierService.CreateSupplierAsync(request));

        Assert.Equal("A user with this email address already exists", exception.Message);

        _userRepositoryMock.Verify(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task CreateSupplierAsync_WithUserManagerFailure_ShouldThrowValidationException()
    {
        // Arrange
        var request = new CreateSupplierRequest(
            Email: "test@example.com",
            Password: "weak",
            FirstName: "Test",
            LastName: "User",
            PhoneNumber: null,
            Status: null,
            CompanyName: "Test Company",
            CommercialRegistrationNumber: null,
            TaxId: null);

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
            () => _supplierService.CreateSupplierAsync(request));

        Assert.Contains("PasswordTooShort", exception.Errors.Keys);
        Assert.Contains("PasswordRequiresDigit", exception.Errors.Keys);
    }

    [Fact]
    public async Task CreateSupplierAsync_WithNonExistentSupplierRole_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var request = new CreateSupplierRequest(
            Email: "test@example.com",
            Password: "SecurePassword123!",
            FirstName: "Test",
            LastName: "User",
            PhoneNumber: null,
            Status: null,
            CompanyName: "Test Company",
            CommercialRegistrationNumber: null,
            TaxId: null);

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Success);

        _roleManagerMock.Setup(x => x.RoleExistsAsync("Supplier"))
            .ReturnsAsync(false);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _supplierService.CreateSupplierAsync(request));

        Assert.Equal("Supplier role is not configured in the system", exception.Message);
    }

    [Fact]
    public async Task CreateSupplierAsync_WithRoleAssignmentFailure_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var request = new CreateSupplierRequest(
            Email: "test@example.com",
            Password: "SecurePassword123!",
            FirstName: "Test",
            LastName: "User",
            PhoneNumber: null,
            Status: null,
            CompanyName: "Test Company",
            CommercialRegistrationNumber: null,
            TaxId: null);

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Success);

        _roleManagerMock.Setup(x => x.RoleExistsAsync("Supplier"))
            .ReturnsAsync(true);

        var roleErrors = new[]
        {
            new IdentityError { Code = "RoleAssignmentFailed", Description = "Failed to assign role" }
        };

        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Supplier"))
            .ReturnsAsync(IdentityResult.Failed(roleErrors));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _supplierService.CreateSupplierAsync(request));

        Assert.Equal("Failed to assign Supplier role to the user", exception.Message);
    }

    [Fact]
    public async Task CreateSupplierAsync_ShouldSetEmailConfirmedToTrue()
    {
        // Arrange
        var request = new CreateSupplierRequest(
            Email: "test@example.com",
            Password: "SecurePassword123!",
            FirstName: "Test",
            LastName: "User",
            PhoneNumber: null,
            Status: null,
            CompanyName: "Test Company",
            CommercialRegistrationNumber: null,
            TaxId: null);

        ApplicationUser? createdUser = null;

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .Callback<ApplicationUser, string>((user, password) => createdUser = user)
            .ReturnsAsync(IdentityResult.Success);

        _roleManagerMock.Setup(x => x.RoleExistsAsync("Supplier"))
            .ReturnsAsync(true);

        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Supplier"))
            .ReturnsAsync(IdentityResult.Success);

        _supplierRepositoryMock.Setup(x => x.UpsertCompanyProfileAsync(It.IsAny<CompanyProfile>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<CompanyProfile>());

        // Act
        var result = await _supplierService.CreateSupplierAsync(request);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(createdUser);
        Assert.True(createdUser.EmailConfirmed); // Admin-created suppliers should be pre-confirmed
        Assert.Equal("Active", createdUser.Status); // Should default to Active if not specified
    }

    #endregion
    #region UpdateSupplierAsync Tests

    [Fact]
    public async Task UpdateSupplierAsync_WithValidRequest_ShouldUpdateSupplierSuccessfully()
    {
        // Arrange
        var supplierId = Guid.NewGuid();
        var supplier = CreateTestSupplier(supplierId, "test@example.com", "John", "Doe");
        supplier.PhoneNumber = "+1234567890";

        var request = new UpdateSupplierRequest(
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: "+0987654321",
            Status: "Inactive",
            CompanyName: "Updated Company Ltd",
            CommercialRegistrationNumber: "CR789",
            TaxId: "TAX789");

        _supplierRepositoryMock.Setup(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(supplier);

        var emptyUsers = new List<ApplicationUser>().AsQueryable().BuildMockDbSet();
        _userRepositoryMock.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ApplicationUser>());

        _userManagerMock.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);

        _supplierRepositoryMock.Setup(x => x.UpsertCompanyProfileAsync(It.IsAny<CompanyProfile>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<CompanyProfile>());

        // Act
        var result = await _supplierService.UpdateSupplierAsync(supplierId, request);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal("Supplier updated successfully", result.Message);
        Assert.Equal(supplierId, result.SupplierId);

        // Verify supplier properties were updated
        Assert.Equal("Jane", supplier.FirstName);
        Assert.Equal("Smith", supplier.LastName);
        Assert.Equal("+0987654321", supplier.PhoneNumber);
        Assert.Equal("Inactive", supplier.Status);
        Assert.False(supplier.PhoneNumberConfirmed); // Should be reset when phone changes

        _supplierRepositoryMock.Verify(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.UpdateAsync(supplier), Times.Once);
        _supplierRepositoryMock.Verify(x => x.UpsertCompanyProfileAsync(It.IsAny<CompanyProfile>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateSupplierAsync_WithNonExistentSupplier_ShouldThrowNotFoundException()
    {
        // Arrange
        var supplierId = Guid.NewGuid();
        var request = new UpdateSupplierRequest(
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: null,
            Status: "Active",
            CompanyName: "Test Company",
            CommercialRegistrationNumber: null,
            TaxId: null);

        _supplierRepositoryMock.Setup(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _supplierService.UpdateSupplierAsync(supplierId, request));

        Assert.Equal($"Supplier with ID {supplierId} not found", exception.Message);

        _supplierRepositoryMock.Verify(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.UpdateAsync(It.IsAny<ApplicationUser>()), Times.Never);
    }

    [Fact]
    public async Task UpdateSupplierAsync_WithDuplicatePhoneNumber_ShouldThrowConflictException()
    {
        // Arrange
        var supplierId = Guid.NewGuid();
        var supplier = CreateTestSupplier(supplierId, "test@example.com", "John", "Doe");
        var otherUser = CreateTestSupplier(Guid.NewGuid(), "other@example.com", "Other", "User");
        otherUser.PhoneNumber = "+1234567890";

        var request = new UpdateSupplierRequest(
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: "+1234567890", // Same as other user
            Status: "Active",
            CompanyName: "Test Company",
            CommercialRegistrationNumber: null,
            TaxId: null);

        _supplierRepositoryMock.Setup(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(supplier);

        _userRepositoryMock.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ApplicationUser> { supplier, otherUser });

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ConflictException>(
            () => _supplierService.UpdateSupplierAsync(supplierId, request));

        Assert.Equal("Phone number is already in use by another user", exception.Message);

        _supplierRepositoryMock.Verify(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.UpdateAsync(It.IsAny<ApplicationUser>()), Times.Never);
    }

    [Fact]
    public async Task UpdateSupplierAsync_WithSamePhoneNumber_ShouldNotThrowConflictException()
    {
        // Arrange
        var supplierId = Guid.NewGuid();
        var supplier = CreateTestSupplier(supplierId, "test@example.com", "John", "Doe");
        supplier.PhoneNumber = "+1234567890";
        supplier.PhoneNumberConfirmed = true; // Set to confirmed initially

        var request = new UpdateSupplierRequest(
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: "+1234567890", // Same as current supplier's phone
            Status: "Active",
            CompanyName: "Test Company",
            CommercialRegistrationNumber: null,
            TaxId: null);

        _supplierRepositoryMock.Setup(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(supplier);

        _userRepositoryMock.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ApplicationUser> { supplier });

        _userManagerMock.Setup(x => x.UpdateAsync(supplier))
            .ReturnsAsync(IdentityResult.Success);

        _supplierRepositoryMock.Setup(x => x.UpsertCompanyProfileAsync(It.IsAny<CompanyProfile>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<CompanyProfile>());

        // Act
        var result = await _supplierService.UpdateSupplierAsync(supplierId, request);

        // Assert
        Assert.True(result.Success);
        Assert.True(supplier.PhoneNumberConfirmed); // Should remain confirmed since phone didn't change

        _userManagerMock.Verify(x => x.UpdateAsync(supplier), Times.Once);
    }

    [Fact]
    public async Task UpdateSupplierAsync_WithUserManagerFailure_ShouldThrowValidationException()
    {
        // Arrange
        var supplierId = Guid.NewGuid();
        var supplier = CreateTestSupplier(supplierId, "test@example.com", "John", "Doe");

        var request = new UpdateSupplierRequest(
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: null,
            Status: "Active",
            CompanyName: "Test Company",
            CommercialRegistrationNumber: null,
            TaxId: null);

        _supplierRepositoryMock.Setup(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(supplier);

        _userRepositoryMock.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ApplicationUser>());

        var identityErrors = new[]
        {
            new IdentityError { Code = "InvalidUserName", Description = "Invalid user name" }
        };

        _userManagerMock.Setup(x => x.UpdateAsync(supplier))
            .ReturnsAsync(IdentityResult.Failed(identityErrors));

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _supplierService.UpdateSupplierAsync(supplierId, request));

        Assert.Contains("InvalidUserName", exception.Errors.Keys);
    }

    [Fact]
    public async Task UpdateSupplierAsync_ShouldUpdateCompanyProfile()
    {
        // Arrange
        var supplierId = Guid.NewGuid();
        var supplier = CreateTestSupplier(supplierId, "test@example.com", "John", "Doe");

        var request = new UpdateSupplierRequest(
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: null,
            Status: "Active",
            CompanyName: "Updated Company Name",
            CommercialRegistrationNumber: "NEW_CR123",
            TaxId: "NEW_TAX123");

        CompanyProfile? upsertedProfile = null;

        _supplierRepositoryMock.Setup(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(supplier);

        _userRepositoryMock.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ApplicationUser>());

        _userManagerMock.Setup(x => x.UpdateAsync(supplier))
            .ReturnsAsync(IdentityResult.Success);

        _supplierRepositoryMock.Setup(x => x.UpsertCompanyProfileAsync(It.IsAny<CompanyProfile>(), It.IsAny<CancellationToken>()))
            .Callback<CompanyProfile, CancellationToken>((profile, token) => upsertedProfile = profile)
            .ReturnsAsync(It.IsAny<CompanyProfile>());

        // Act
        var result = await _supplierService.UpdateSupplierAsync(supplierId, request);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(upsertedProfile);
        Assert.Equal(supplierId, upsertedProfile.UserId);
        Assert.Equal("Updated Company Name", upsertedProfile.CompanyName);
        Assert.Equal("NEW_CR123", upsertedProfile.CommercialRegistrationNumber);
        Assert.Equal("NEW_TAX123", upsertedProfile.TaxId);

        _supplierRepositoryMock.Verify(x => x.UpsertCompanyProfileAsync(It.IsAny<CompanyProfile>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion
    #region Authorization Tests

    [Fact]
    public async Task CreateSupplierAsync_WithAdminRole_ShouldSucceed()
    {
        // Arrange - This test verifies the service logic works correctly for admin operations
        // Authorization is enforced at the controller level with [Authorize(Roles = "Admin")]
        var request = new CreateSupplierRequest(
            Email: "admin-created@example.com",
            Password: "SecurePassword123!",
            FirstName: "Admin",
            LastName: "Created",
            PhoneNumber: "+1111111111",
            Status: "Active",
            CompanyName: "Admin Created Company",
            CommercialRegistrationNumber: "ADMIN001",
            TaxId: "ADMINTAX001");

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Success);

        _roleManagerMock.Setup(x => x.RoleExistsAsync("Supplier"))
            .ReturnsAsync(true);

        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Supplier"))
            .ReturnsAsync(IdentityResult.Success);

        _supplierRepositoryMock.Setup(x => x.UpsertCompanyProfileAsync(It.IsAny<CompanyProfile>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<CompanyProfile>());

        // Act
        var result = await _supplierService.CreateSupplierAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal("Supplier created successfully", result.Message);
        Assert.NotNull(result.SupplierId);

        _userRepositoryMock.Verify(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password), Times.Once);
        _supplierRepositoryMock.Verify(x => x.UpsertCompanyProfileAsync(It.IsAny<CompanyProfile>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateSupplierAsync_WithAdminRole_ShouldSucceed()
    {
        // Arrange - This test verifies the service logic works correctly for admin operations
        // Authorization is enforced at the controller level with [Authorize(Roles = "Admin")]
        var supplierId = Guid.NewGuid();
        var supplier = CreateTestSupplier(supplierId, "supplier@example.com", "Original", "Name");

        var request = new UpdateSupplierRequest(
            FirstName: "Admin",
            LastName: "Updated",
            PhoneNumber: "+2222222222",
            Status: "Suspended",
            CompanyName: "Admin Updated Company",
            CommercialRegistrationNumber: "ADMIN002",
            TaxId: "ADMINTAX002");

        _supplierRepositoryMock.Setup(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(supplier);

        _userRepositoryMock.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ApplicationUser>());

        _userManagerMock.Setup(x => x.UpdateAsync(supplier))
            .ReturnsAsync(IdentityResult.Success);

        _supplierRepositoryMock.Setup(x => x.UpsertCompanyProfileAsync(It.IsAny<CompanyProfile>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<CompanyProfile>());

        // Act
        var result = await _supplierService.UpdateSupplierAsync(supplierId, request);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal("Supplier updated successfully", result.Message);
        Assert.Equal(supplierId, result.SupplierId);

        // Verify supplier properties were updated
        Assert.Equal("Admin", supplier.FirstName);
        Assert.Equal("Updated", supplier.LastName);
        Assert.Equal("Suspended", supplier.Status);

        _supplierRepositoryMock.Verify(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()), Times.Once);
        _userManagerMock.Verify(x => x.UpdateAsync(supplier), Times.Once);
        _supplierRepositoryMock.Verify(x => x.UpsertCompanyProfileAsync(It.IsAny<CompanyProfile>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region Edge Case Tests

    [Fact]
    public async Task GetSuppliersAsync_WithRepositoryFailure_ShouldPropagateException()
    {
        // Arrange
        var expectedException = new InvalidOperationException("Database connection failed");

        _supplierRepositoryMock.Setup(x => x.GetSuppliersAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(expectedException);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _supplierService.GetSuppliersAsync());

        Assert.Equal(expectedException.Message, exception.Message);
        _supplierRepositoryMock.Verify(x => x.GetSuppliersAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateSupplierAsync_WithCompanyProfileCreationFailure_ShouldPropagateException()
    {
        // Arrange
        var request = new CreateSupplierRequest(
            Email: "test@example.com",
            Password: "SecurePassword123!",
            FirstName: "Test",
            LastName: "User",
            PhoneNumber: null,
            Status: null,
            CompanyName: "Test Company",
            CommercialRegistrationNumber: null,
            TaxId: null);

        _userRepositoryMock.Setup(x => x.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Success);

        _roleManagerMock.Setup(x => x.RoleExistsAsync("Supplier"))
            .ReturnsAsync(true);

        _userManagerMock.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "Supplier"))
            .ReturnsAsync(IdentityResult.Success);

        var expectedException = new InvalidOperationException("Company profile creation failed");
        _supplierRepositoryMock.Setup(x => x.UpsertCompanyProfileAsync(It.IsAny<CompanyProfile>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(expectedException);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _supplierService.CreateSupplierAsync(request));

        Assert.Equal(expectedException.Message, exception.Message);
    }

    [Fact]
    public async Task UpdateSupplierAsync_WithNullPhoneNumber_ShouldUpdateSuccessfully()
    {
        // Arrange
        var supplierId = Guid.NewGuid();
        var supplier = CreateTestSupplier(supplierId, "test@example.com", "John", "Doe");
        supplier.PhoneNumber = "+1234567890";
        supplier.PhoneNumberConfirmed = true;

        var request = new UpdateSupplierRequest(
            FirstName: "Jane",
            LastName: "Smith",
            PhoneNumber: null, // Setting phone to null
            Status: "Active",
            CompanyName: "Test Company",
            CommercialRegistrationNumber: null,
            TaxId: null);

        _supplierRepositoryMock.Setup(x => x.GetSupplierWithCompanyProfileAsync(supplierId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(supplier);

        _userRepositoryMock.Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ApplicationUser>());

        _userManagerMock.Setup(x => x.UpdateAsync(supplier))
            .ReturnsAsync(IdentityResult.Success);

        _supplierRepositoryMock.Setup(x => x.UpsertCompanyProfileAsync(It.IsAny<CompanyProfile>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(It.IsAny<CompanyProfile>());

        // Act
        var result = await _supplierService.UpdateSupplierAsync(supplierId, request);

        // Assert
        Assert.True(result.Success);
        Assert.Null(supplier.PhoneNumber);
        Assert.False(supplier.PhoneNumberConfirmed); // Should be reset when phone changes
    }

    [Fact]
    public async Task GetSuppliersAsync_WithLargePageSize_ShouldCapAt100()
    {
        // Arrange
        var page = 1;
        var inputPageSize = 200; // Larger than max allowed
        var expectedPageSize = 100; // Should be capped

        var suppliers = CreateTestSuppliers(50);
        var pagedResult = new PagedResult<ApplicationUser>(
            Data: suppliers,
            Page: page,
            PageSize: expectedPageSize,
            TotalCount: suppliers.Count,
            TotalPages: 1);

        _supplierRepositoryMock.Setup(x => x.GetSuppliersAsync(page, expectedPageSize, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        foreach (var supplier in suppliers)
        {
            _userManagerMock.Setup(x => x.GetRolesAsync(supplier))
                .ReturnsAsync(new List<string> { "Supplier" });

            _supplierRepositoryMock.Setup(x => x.GetCompanyProfileAsync(supplier.Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(CreateTestCompanyProfile(supplier.Id));
        }

        // Act
        var result = await _supplierService.GetSuppliersAsync(page, inputPageSize);

        // Assert
        Assert.Equal(expectedPageSize, result.PageSize);
        _supplierRepositoryMock.Verify(x => x.GetSuppliersAsync(page, expectedPageSize, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region Helper Methods

    private List<ApplicationUser> CreateTestSuppliers(int count)
    {
        var suppliers = new List<ApplicationUser>();
        for (int i = 0; i < count; i++)
        {
            suppliers.Add(CreateTestSupplier(
                Guid.NewGuid(),
                $"supplier{i}@example.com",
                $"FirstName{i}",
                $"LastName{i}"));
        }
        return suppliers;
    }

    private ApplicationUser CreateTestSupplier(Guid id, string email, string firstName, string lastName)
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

    private CompanyProfile CreateTestCompanyProfile(Guid userId)
    {
        return new CompanyProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CompanyName = $"Test Company {userId.ToString()[..8]}",
            CommercialRegistrationNumber = $"CR{userId.ToString()[..6]}",
            TaxId = $"TAX{userId.ToString()[..6]}",
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