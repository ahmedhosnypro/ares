using Backend.Application.DTOs.UserProfile;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Tests.TestUtilities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Backend.Tests.UnitTests;

public class UserProfileServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IApplicationDbContext> _contextMock;
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<ILogger<UserProfileService>> _loggerMock;
    private readonly UserProfileService _userProfileService;

    public UserProfileServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _contextMock = new Mock<IApplicationDbContext>();
        _loggerMock = new Mock<ILogger<UserProfileService>>();

        // Mock UserManager
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _userProfileService = new UserProfileService(
            _userRepositoryMock.Object,
            _contextMock.Object,
            _userManagerMock.Object,
            _loggerMock.Object);
    }

    #region GetProfileAsync Tests

    [Fact]
    public async Task GetProfileAsync_WithValidUserId_ShouldReturnCompleteProfile()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId);
        var userAddress = CreateTestUserAddress(userId);
        var verifications = CreateTestVerifications(userId);

        SetupGetProfileMocks(user, userAddress, verifications);

        // Act
        var result = await _userProfileService.GetProfileAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.Equal("John", result.FirstName);
        Assert.Equal("Doe", result.LastName);
        Assert.Equal("john.doe@example.com", result.Email);
        Assert.True(result.EmailVerified);
        Assert.Equal("+1234567890", result.Phone);
        Assert.True(result.PhoneVerified);
        Assert.Equal("/uploads/profiles/profile.jpg", result.ProfilePhotoUrl);
        Assert.Equal("123 Main St", result.Address.Street);
        Assert.Equal("New York", result.Address.City);
        Assert.Equal("en", result.LanguagePreference);
        Assert.Equal("USD", result.CurrencyPreference);
        Assert.True(result.ProfileCompleteness > 0);
        Assert.True(result.VerificationStatus.Email);
        Assert.True(result.VerificationStatus.Phone);

        VerifyGetProfileMocks(userId);
    }
    [Fact]
    public async Task GetProfileAsync_WithNonExistentUser_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _userProfileService.GetProfileAsync(userId));

        Assert.Equal($"User with ID {userId} not found", exception.Message);
        _userRepositoryMock.Verify(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetProfileAsync_WithUserWithoutAddress_ShouldReturnEmptyAddress()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId);
        var verifications = new List<Verification>();

        var userAddresses = new List<UserAddress>().AsQueryable();
        var mockUserAddressDbSet = userAddresses.BuildMockDbSet();

        var verificationsQueryable = verifications.AsQueryable();
        var mockVerificationsDbSet = verificationsQueryable.BuildMockDbSet();

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _contextMock.Setup(x => x.UserAddresses).Returns(mockUserAddressDbSet.Object);
        _contextMock.Setup(x => x.Verifications).Returns(mockVerificationsDbSet.Object);

        // Act
        var result = await _userProfileService.GetProfileAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(string.Empty, result.Address.Street);
        Assert.Equal(string.Empty, result.Address.City);
        Assert.Equal(string.Empty, result.Address.State);
        Assert.Equal(string.Empty, result.Address.PostalCode);
        Assert.Equal(string.Empty, result.Address.Country);
    }

    [Theory]
    [InlineData(0, "none")]
    [InlineData(1, "basic")]
    [InlineData(2, "standard")]
    [InlineData(3, "enhanced")]
    public async Task GetProfileAsync_WithDifferentVerificationLevels_ShouldReturnCorrectKycLevel(
        int verificationCount, string expectedKycLevel)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId);
        var userAddress = CreateTestUserAddress(userId);
        var verifications = CreateTestVerifications(userId, verificationCount);

        SetupGetProfileMocks(user, userAddress, verifications);

        // Act
        var result = await _userProfileService.GetProfileAsync(userId);

        // Assert
        Assert.Equal(expectedKycLevel, result.VerificationStatus.Kyc);
    }

    #endregion

    #region UpdateProfileAsync Tests

    [Fact]
    public async Task UpdateProfileAsync_WithValidRequest_ShouldUpdateProfileSuccessfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId);
        var userAddress = CreateTestUserAddress(userId);

        var request = new UpdateProfileRequest(
            FirstName: "Jane",
            LastName: "Smith",
            Phone: "+9876543210",
            DateOfBirth: new DateTime(1990, 5, 15),
            Address: new AddressDto("456 Oak Ave", "Los Angeles", "CA", "90210", "USA"),
            EmergencyContact: new EmergencyContactDto("Emergency Contact", "+1111111111", "Spouse"),
            LanguagePreference: "es",
            CurrencyPreference: "EUR"
        );

        SetupUpdateProfileMocks(user, userAddress, request.Phone);

        // Act
        var result = await _userProfileService.UpdateProfileAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal("Profile updated successfully", result.Message);
        Assert.False(result.VerificationRequired.Email);
        Assert.True(result.VerificationRequired.Phone); // Phone changed

        // Verify user was updated
        Assert.Equal("Jane", user.FirstName);
        Assert.Equal("Smith", user.LastName);
        Assert.Equal("+9876543210", user.PhoneNumber);
        Assert.False(user.PhoneNumberConfirmed); // Should be reset when phone changes

        VerifyUpdateProfileMocks(userId, request.Phone);
    }
    [Fact]
    public async Task UpdateProfileAsync_WithNonExistentUser_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = CreateTestUpdateRequest();

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _userProfileService.UpdateProfileAsync(userId, request));

        Assert.Equal($"User with ID {userId} not found", exception.Message);
        _userRepositoryMock.Verify(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateProfileAsync_WithDuplicatePhone_ShouldThrowConflictException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId);
        var request = CreateTestUpdateRequest();

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var users = new List<ApplicationUser>
        {
            new ApplicationUser { Id = Guid.NewGuid(), PhoneNumber = request.Phone }
        }.AsQueryable();
        var mockUsersDbSet = users.BuildMockDbSet();

        _contextMock.Setup(x => x.Users).Returns(mockUsersDbSet.Object);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ConflictException>(
            () => _userProfileService.UpdateProfileAsync(userId, request));

        Assert.Equal("Phone number is already in use", exception.Message);
    }

    [Fact]
    public async Task UpdateProfileAsync_WithSamePhone_ShouldNotRequirePhoneVerification()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId);
        var userAddress = CreateTestUserAddress(userId);

        var request = new UpdateProfileRequest(
            FirstName: "Jane",
            LastName: "Smith",
            Phone: user.PhoneNumber!, // Same phone number
            DateOfBirth: new DateTime(1990, 5, 15),
            Address: new AddressDto("456 Oak Ave", "Los Angeles", "CA", "90210", "USA"),
            EmergencyContact: new EmergencyContactDto("Emergency Contact", "+1111111111", "Spouse"),
            LanguagePreference: "es",
            CurrencyPreference: "EUR"
        );

        SetupUpdateProfileMocks(user, userAddress, request.Phone, phoneExists: false);

        // Act
        var result = await _userProfileService.UpdateProfileAsync(userId, request);

        // Assert
        Assert.False(result.VerificationRequired.Phone); // Phone didn't change
        Assert.True(user.PhoneNumberConfirmed); // Should remain confirmed
    }

    [Fact]
    public async Task UpdateProfileAsync_WithNewAddress_ShouldCreateNewUserAddress()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId);
        var request = CreateTestUpdateRequest();

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var userAddresses = new List<UserAddress>().AsQueryable();
        var mockUserAddressDbSet = userAddresses.BuildMockDbSet();

        var users = new List<ApplicationUser>().AsQueryable();
        var mockUsersDbSet = users.BuildMockDbSet();

        _contextMock.Setup(x => x.Users).Returns(mockUsersDbSet.Object);
        _contextMock.Setup(x => x.UserAddresses).Returns(mockUserAddressDbSet.Object);
        _contextMock.Setup(x => x.AddUserAddress(It.IsAny<UserAddress>()));
        _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _userRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _userProfileService.UpdateProfileAsync(userId, request);

        // Assert
        Assert.True(result.Success);
        _contextMock.Verify(x => x.AddUserAddress(It.Is<UserAddress>(a =>
            a.UserId == userId &&
            a.IsPrimary == true &&
            a.AddressLine == request.Address.Street)), Times.Once);
    }

    #endregion

    #region UploadProfilePhotoAsync Tests

    [Fact]
    public async Task UploadProfilePhotoAsync_WithValidImage_ShouldUploadSuccessfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId);
        var photo = CreateTestImageFile("test.jpg", "image/jpeg");

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _userRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _userProfileService.UploadProfilePhotoAsync(userId, photo);

        // Assert
        Assert.NotNull(result);
        Assert.StartsWith("/uploads/profiles/", result);
        Assert.Contains(userId.ToString(), result);
        Assert.EndsWith(".jpg", result);

        _userRepositoryMock.Verify(x => x.UpdateAsync(It.Is<ApplicationUser>(u =>
            u.ProfileImage == result), It.IsAny<CancellationToken>()), Times.Once);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
    [Fact]
    public async Task UploadProfilePhotoAsync_WithNonExistentUser_ShouldThrowNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var photo = CreateTestImageFile("test.jpg", "image/jpeg");

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApplicationUser?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<NotFoundException>(
            () => _userProfileService.UploadProfilePhotoAsync(userId, photo));

        Assert.Equal($"User with ID {userId} not found", exception.Message);
    }

    [Theory]
    [InlineData("test.txt", "text/plain")]
    [InlineData("test.pdf", "application/pdf")]
    [InlineData("test.gif", "image/gif")]
    [InlineData("test.bmp", "image/bmp")]
    public async Task UploadProfilePhotoAsync_WithInvalidFileType_ShouldThrowValidationException(
        string fileName, string contentType)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId);
        var photo = CreateTestImageFile(fileName, contentType);

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _userProfileService.UploadProfilePhotoAsync(userId, photo));

        Assert.Contains("photo", exception.Errors.Keys);
        Assert.Equal("Invalid file type. Only JPEG and PNG images are allowed.", exception.Errors["photo"].First());
    }

    [Fact]
    public async Task UploadProfilePhotoAsync_WithOversizedFile_ShouldThrowValidationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId);
        var photo = CreateTestImageFile("test.jpg", "image/jpeg", 6 * 1024 * 1024); // 6MB

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ValidationException>(
            () => _userProfileService.UploadProfilePhotoAsync(userId, photo));

        Assert.Contains("photo", exception.Errors.Keys);
        Assert.Equal("File size exceeds the maximum limit of 5MB.", exception.Errors["photo"].First());
    }

    [Theory]
    [InlineData("test.jpg", "image/jpeg")]
    [InlineData("test.jpeg", "image/jpeg")]
    [InlineData("test.png", "image/png")]
    [InlineData("TEST.JPG", "image/jpeg")]
    [InlineData("TEST.PNG", "image/png")]
    public async Task UploadProfilePhotoAsync_WithValidFileTypes_ShouldUploadSuccessfully(
        string fileName, string contentType)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId);
        var photo = CreateTestImageFile(fileName, contentType);

        _userRepositoryMock.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _userRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Act
        var result = await _userProfileService.UploadProfilePhotoAsync(userId, photo);

        // Assert
        Assert.NotNull(result);
        Assert.StartsWith("/uploads/profiles/", result);
        _userRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<ApplicationUser>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region Profile Completeness Tests

    [Theory]
    [InlineData(true, true, true, true, true, true, true, true, 67)] // All available fields filled (6/9 fields, emergency contact empty)
    [InlineData(true, true, true, true, false, false, false, false, 33)] // Only required fields (4/12 = 33%)
    [InlineData(true, true, false, false, false, false, false, false, 17)] // Only first/last name (2/12 = 17%)
    [InlineData(false, false, false, false, false, false, false, false, 0)] // No fields filled (0/12 = 0%)
    public async Task GetProfileAsync_ProfileCompletenessCalculation_ShouldCalculateCorrectly(
        bool hasFirstName, bool hasLastName, bool hasEmail, bool hasPhone,
        bool hasProfileImage, bool hasAddress, bool emailVerified, bool phoneVerified,
        int expectedCompleteness)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            FirstName = hasFirstName ? "John" : string.Empty,
            LastName = hasLastName ? "Doe" : string.Empty,
            Email = hasEmail ? "john.doe@example.com" : string.Empty,
            PhoneNumber = hasPhone ? "+1234567890" : string.Empty,
            ProfileImage = hasProfileImage ? "/uploads/profiles/profile.jpg" : null,
            EmailConfirmed = emailVerified,
            PhoneNumberConfirmed = phoneVerified
        };

        var userAddress = hasAddress ? CreateTestUserAddress(userId) : null;
        var verifications = new List<Verification>();

        SetupGetProfileMocks(user, userAddress, verifications);

        // Act
        var result = await _userProfileService.GetProfileAsync(userId);

        // Assert
        Assert.Equal(expectedCompleteness, result.ProfileCompleteness);
    }

    #endregion
    #region Helper Methods

    private ApplicationUser CreateTestUser(Guid userId)
    {
        return new ApplicationUser
        {
            Id = userId,
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            PhoneNumber = "+1234567890",
            ProfileImage = "/uploads/profiles/profile.jpg",
            EmailConfirmed = true,
            PhoneNumberConfirmed = true
        };
    }

    private UserAddress CreateTestUserAddress(Guid userId)
    {
        return new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AddressLine = "123 Main St",
            City = "New York",
            Governorate = "NY",
            PostalCode = "10001",
            Country = "USA",
            IsPrimary = true
        };
    }

    private List<Verification> CreateTestVerifications(Guid userId, int count = 2)
    {
        var verifications = new List<Verification>();

        if (count >= 1)
        {
            verifications.Add(new Verification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DocumentType = "DriverLicense",
                Status = "Approved"
            });
        }

        if (count >= 2)
        {
            verifications.Add(new Verification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DocumentType = "Passport",
                Status = "Approved"
            });
        }

        if (count >= 3)
        {
            verifications.Add(new Verification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DocumentType = "NationalId",
                Status = "Approved"
            });
        }

        return verifications;
    }

    private UpdateProfileRequest CreateTestUpdateRequest()
    {
        return new UpdateProfileRequest(
            FirstName: "Jane",
            LastName: "Smith",
            Phone: "+9876543210",
            DateOfBirth: new DateTime(1990, 5, 15),
            Address: new AddressDto("456 Oak Ave", "Los Angeles", "CA", "90210", "USA"),
            EmergencyContact: new EmergencyContactDto("Emergency Contact", "+1111111111", "Spouse"),
            LanguagePreference: "es",
            CurrencyPreference: "EUR"
        );
    }

    private IFormFile CreateTestImageFile(string fileName, string contentType, long size = 1024)
    {
        var fileMock = new Mock<IFormFile>();
        fileMock.Setup(f => f.FileName).Returns(fileName);
        fileMock.Setup(f => f.ContentType).Returns(contentType);
        fileMock.Setup(f => f.Length).Returns(size);
        fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        return fileMock.Object;
    }

    private void SetupGetProfileMocks(ApplicationUser user, UserAddress? userAddress, List<Verification> verifications)
    {
        _userRepositoryMock.Setup(x => x.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var userAddresses = userAddress != null
            ? new List<UserAddress> { userAddress }.AsQueryable()
            : new List<UserAddress>().AsQueryable();
        var mockUserAddressDbSet = userAddresses.BuildMockDbSet();

        var verificationsQueryable = verifications.AsQueryable();
        var mockVerificationsDbSet = verificationsQueryable.BuildMockDbSet();

        _contextMock.Setup(x => x.UserAddresses).Returns(mockUserAddressDbSet.Object);
        _contextMock.Setup(x => x.Verifications).Returns(mockVerificationsDbSet.Object);
    }

    private void VerifyGetProfileMocks(Guid userId)
    {
        _userRepositoryMock.Verify(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        _contextMock.Verify(x => x.UserAddresses, Times.Once);
        _contextMock.Verify(x => x.Verifications, Times.Once);
    }

    private void SetupUpdateProfileMocks(ApplicationUser user, UserAddress? userAddress, string newPhone, bool phoneExists = false)
    {
        _userRepositoryMock.Setup(x => x.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var users = phoneExists
            ? new List<ApplicationUser> { new ApplicationUser { Id = Guid.NewGuid(), PhoneNumber = newPhone } }.AsQueryable()
            : new List<ApplicationUser>().AsQueryable();
        var mockUsersDbSet = users.BuildMockDbSet();

        var userAddresses = userAddress != null
            ? new List<UserAddress> { userAddress }.AsQueryable()
            : new List<UserAddress>().AsQueryable();
        var mockUserAddressDbSet = userAddresses.BuildMockDbSet();

        _contextMock.Setup(x => x.Users).Returns(mockUsersDbSet.Object);
        _contextMock.Setup(x => x.UserAddresses).Returns(mockUserAddressDbSet.Object);
        _contextMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _userRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
    }

    private void VerifyUpdateProfileMocks(Guid userId, string newPhone)
    {
        _userRepositoryMock.Verify(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        _userRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<ApplicationUser>(), It.IsAny<CancellationToken>()), Times.Once);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion
}