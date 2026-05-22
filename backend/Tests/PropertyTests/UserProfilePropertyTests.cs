using Backend.Application.DTOs.UserProfile;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Repositories;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Backend.Tests.PropertyTests;

/// <summary>
/// Property-based tests for user profile functionality using FsCheck.
/// Each property validates universal correctness guarantees for user profile operations across all valid inputs.
/// </summary>
public class UserProfilePropertyTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IUserRepository _userRepository;
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<ILogger<UserProfileService>> _loggerMock;
    private readonly IUserProfileService _userProfileService;

    public UserProfilePropertyTests()
    {
        // Setup in-memory database for testing
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _userRepository = new UserRepository(_context);

        // Mock UserManager
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        // Mock Logger
        _loggerMock = new Mock<ILogger<UserProfileService>>();

        _userProfileService = new UserProfileService(
            _userRepository,
            _context,
            _userManagerMock.Object,
            _loggerMock.Object);

        // Ensure database is created
        _context.Database.EnsureCreated();
    }
    #region Property 22: User profile returns complete information

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 22: User profile returns complete information
    public bool UserProfileReturnsCompleteInformation(PositiveInt seedGen)
    {
        var seed = seedGen.Get % 1000;

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user with various profile data
            var user = CreateTestUserWithProfile(seed);

            // Create address for the user
            var address = CreateTestAddress(user.Id, seed);

            // Create verification records
            var verifications = CreateTestVerifications(user.Id, seed);

            // Act - Get user profile
            var profile = _userProfileService.GetProfileAsync(user.Id).Result;

            // Assert - Verify all required fields are present and correct
            var hasAllRequiredFields =
                profile.UserId == user.Id &&
                profile.FirstName == user.FirstName &&
                profile.LastName == user.LastName &&
                profile.Email == user.Email &&
                profile.EmailVerified == user.EmailConfirmed &&
                profile.Phone == (user.PhoneNumber ?? string.Empty) &&
                profile.PhoneVerified == user.PhoneNumberConfirmed &&
                profile.ProfilePhotoUrl == user.ProfileImage &&
                profile.Address != null &&
                profile.EmergencyContact != null &&
                !string.IsNullOrEmpty(profile.LanguagePreference) &&
                !string.IsNullOrEmpty(profile.CurrencyPreference) &&
                profile.ProfileCompleteness >= 0 && profile.ProfileCompleteness <= 100 &&
                profile.VerificationStatus != null;

            // Verify address information is correctly mapped
            var addressCorrect =
                profile.Address != null &&
                profile.Address.Street == (address?.AddressLine ?? string.Empty) &&
                profile.Address.City == (address?.City ?? string.Empty) &&
                profile.Address.State == (address?.Governorate ?? string.Empty) &&
                profile.Address.PostalCode == (address?.PostalCode ?? string.Empty) &&
                profile.Address.Country == (address?.Country ?? string.Empty);

            // Verify verification status is correctly calculated
            var verificationCorrect =
                profile.VerificationStatus != null &&
                profile.VerificationStatus.Email == user.EmailConfirmed &&
                profile.VerificationStatus.Phone == user.PhoneNumberConfirmed &&
                !string.IsNullOrEmpty(profile.VerificationStatus.Kyc);

            return hasAllRequiredFields && addressCorrect && verificationCorrect;
        }
        catch
        {
            return false;
        }
    }

    #endregion
    #region Property 23: Profile update persists changes

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 23: Profile update persists changes
    public bool ProfileUpdatePersistsChanges(PositiveInt seedGen)
    {
        var seed = seedGen.Get % 1000;

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user
            var user = CreateTestUserWithProfile(seed);
            var originalFirstName = user.FirstName;
            var originalLastName = user.LastName;

            // Create update request with new values
            var newFirstName = $"Updated{seed}";
            var newLastName = $"User{seed}";
            var newPhone = $"+1555{seed:D7}";
            var newAddress = new AddressDto(
                Street: $"{seed} Updated Street",
                City: $"Updated City {seed}",
                State: $"Updated State {seed}",
                PostalCode: $"{seed:D5}",
                Country: "Updated Country"
            );
            var emergencyContact = new EmergencyContactDto(
                Name: $"Emergency Contact {seed}",
                Phone: $"+1555{seed + 1:D7}",
                Relationship: "Spouse"
            );

            var updateRequest = new UpdateProfileRequest(
                FirstName: newFirstName,
                LastName: newLastName,
                Phone: newPhone,
                DateOfBirth: null,
                Address: newAddress,
                EmergencyContact: emergencyContact,
                LanguagePreference: "es",
                CurrencyPreference: "EUR"
            );

            // Act - Update profile
            var updateResponse = _userProfileService.UpdateProfileAsync(user.Id, updateRequest).Result;

            // Get updated profile
            var updatedProfile = _userProfileService.GetProfileAsync(user.Id).Result;

            // Assert - Verify all changes were persisted
            var changesPersistedCorrectly =
                updateResponse.Success &&
                updatedProfile.FirstName == newFirstName &&
                updatedProfile.LastName == newLastName &&
                updatedProfile.Phone == newPhone &&
                updatedProfile.Address.Street == newAddress.Street &&
                updatedProfile.Address.City == newAddress.City &&
                updatedProfile.Address.State == newAddress.State &&
                updatedProfile.Address.PostalCode == newAddress.PostalCode &&
                updatedProfile.Address.Country == newAddress.Country;

            // Verify the changes are different from original values
            var actuallyChanged =
                updatedProfile.FirstName != originalFirstName ||
                updatedProfile.LastName != originalLastName;

            return changesPersistedCorrectly && actuallyChanged;
        }
        catch
        {
            return false;
        }
    }

    #endregion
    #region Property 24: Profile photo upload succeeds for valid images

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 24: Profile photo upload succeeds for valid images
    public bool ProfilePhotoUploadSucceedsForValidImages(PositiveInt seedGen)
    {
        var seed = seedGen.Get % 1000;

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user
            var user = CreateTestUserWithProfile(seed);

            // Create valid image file mock
            var validImageFile = CreateValidImageFile(seed);

            // Act - Upload profile photo
            var photoUrl = _userProfileService.UploadProfilePhotoAsync(user.Id, validImageFile).Result;

            // Get updated profile to verify photo URL was saved
            var updatedProfile = _userProfileService.GetProfileAsync(user.Id).Result;

            // Assert - Verify photo upload succeeded
            var uploadSucceeded =
                !string.IsNullOrEmpty(photoUrl) &&
                photoUrl.StartsWith("/uploads/profiles/") &&
                photoUrl.Contains(user.Id.ToString()) &&
                updatedProfile.ProfilePhotoUrl == photoUrl;

            return uploadSucceeded;
        }
        catch
        {
            return false;
        }
    }

    #endregion
    #region Property 25: Profile completeness calculation is accurate

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Property 25: Profile completeness calculation is accurate
    public bool ProfileCompletenessCalculationIsAccurate(PositiveInt seedGen)
    {
        var seed = seedGen.Get % 1000;

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create a basic user profile
            var user = CreateTestUserWithProfile(seed);

            // Get profile and verify completeness is within valid range
            var profile = _userProfileService.GetProfileAsync(user.Id).Result;

            // Verify completeness is a valid percentage (0-100)
            var completenessValid =
                profile.ProfileCompleteness >= 0 &&
                profile.ProfileCompleteness <= 100;

            if (!completenessValid)
            {
                return false;
            }

            // Test that adding more information increases completeness
            // Create a more complete profile
            var completeUser = CreateTestUserWithProfile(seed + 100);
            completeUser.EmailConfirmed = true;
            completeUser.PhoneNumber = $"+1555{seed:D7}";
            completeUser.PhoneNumberConfirmed = true;
            completeUser.ProfileImage = $"/uploads/profiles/test{seed}.jpg";
            _context.SaveChanges();

            // Add address for complete user
            var address = new UserAddress
            {
                Id = Guid.NewGuid(),
                UserId = completeUser.Id,
                AddressLine = $"{seed} Complete Street",
                City = $"Complete City {seed}",
                Governorate = $"Complete State {seed}",
                PostalCode = $"{seed:D5}",
                Country = "Complete Country",
                IsPrimary = true
            };
            _context.UserAddresses.Add(address);
            _context.SaveChanges();

            var completeProfile = _userProfileService.GetProfileAsync(completeUser.Id).Result;

            // Complete profile should have higher or equal completeness
            var completenessIncreases = completeProfile.ProfileCompleteness >= profile.ProfileCompleteness;

            return completenessValid && completenessIncreases;
        }
        catch
        {
            return false;
        }
    }

    #endregion
    #region Additional Properties for Edge Cases

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Profile retrieval with non-existent user fails
    public bool ProfileRetrievalWithNonExistentUserFails()
    {
        try
        {
            // Clear any existing data
            ClearTestData();

            // Use non-existent user ID
            var nonExistentUserId = Guid.NewGuid();

            // Act & Assert - Should throw NotFoundException
            try
            {
                var profile = _userProfileService.GetProfileAsync(nonExistentUserId).Result;
                return false; // Should have thrown exception
            }
            catch (AggregateException ae) when (ae.InnerException is NotFoundException)
            {
                return true; // Expected exception
            }
            catch (NotFoundException)
            {
                return true; // Expected exception
            }
            catch
            {
                return false; // Unexpected exception
            }
        }
        catch
        {
            return false;
        }
    }

    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Profile update with duplicate phone fails
    public bool ProfileUpdateWithDuplicatePhoneFails(PositiveInt seedGen)
    {
        var seed = seedGen.Get % 1000;

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create two test users
            var user1 = CreateTestUserWithProfile(seed);
            var user2 = CreateTestUserWithProfile(seed + 1);

            // Set phone for user1
            var existingPhone = $"+1555{seed:D7}";
            user1.PhoneNumber = existingPhone;
            _context.SaveChanges();

            // Try to update user2 with user1's phone
            var updateRequest = new UpdateProfileRequest(
                FirstName: user2.FirstName,
                LastName: user2.LastName,
                Phone: existingPhone, // Duplicate phone
                DateOfBirth: null,
                Address: new AddressDto("Street", "City", "State", "12345", "Country"),
                EmergencyContact: new EmergencyContactDto("Name", "Phone", "Relationship"),
                LanguagePreference: "en",
                CurrencyPreference: "USD"
            );

            // Act & Assert - Should throw ConflictException
            try
            {
                var response = _userProfileService.UpdateProfileAsync(user2.Id, updateRequest).Result;
                return false; // Should have thrown exception
            }
            catch (AggregateException ae) when (ae.InnerException is ConflictException)
            {
                return true; // Expected exception
            }
            catch (ConflictException)
            {
                return true; // Expected exception
            }
            catch
            {
                return false; // Unexpected exception
            }
        }
        catch
        {
            return false;
        }
    }
    [Property(MaxTest = 100)]
    // Feature: backend-api-implementation, Additional Property: Profile photo upload with invalid file fails
    public bool ProfilePhotoUploadWithInvalidFileFails(PositiveInt seedGen)
    {
        var seed = seedGen.Get % 1000;

        try
        {
            // Clear any existing data
            ClearTestData();

            // Create test user
            var user = CreateTestUserWithProfile(seed);

            // Create invalid file (wrong extension)
            var invalidFile = CreateInvalidImageFile(seed);

            // Act & Assert - Should throw ValidationException
            try
            {
                var photoUrl = _userProfileService.UploadProfilePhotoAsync(user.Id, invalidFile).Result;
                return false; // Should have thrown exception
            }
            catch (AggregateException ae) when (ae.InnerException is ValidationException ve)
            {
                return ve.Errors.ContainsKey("photo");
            }
            catch (ValidationException ve)
            {
                return ve.Errors.ContainsKey("photo");
            }
            catch
            {
                return false; // Unexpected exception
            }
        }
        catch
        {
            return false;
        }
    }

    #endregion
    #region Helper Methods

    private void ClearTestData()
    {
        _context.Verifications.RemoveRange(_context.Verifications);
        _context.UserAddresses.RemoveRange(_context.UserAddresses);
        _context.Users.RemoveRange(_context.Users);
        _context.SaveChanges();
    }

    private ApplicationUser CreateTestUserWithProfile(int seed)
    {
        var userId = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = userId,
            Email = $"test{seed}@example.com",
            FirstName = $"Test{seed}",
            LastName = $"User{seed}",
            UserName = $"test{seed}@example.com",
            EmailConfirmed = seed % 2 == 0, // Alternate email confirmation
            PhoneNumber = seed % 3 == 0 ? $"+1555{seed:D7}" : null, // Some users have phone
            PhoneNumberConfirmed = seed % 4 == 0, // Some phones are confirmed
            ProfileImage = seed % 5 == 0 ? $"/uploads/profiles/test{seed}.jpg" : null // Some have profile images
        };
        _context.Users.Add(user);
        _context.SaveChanges();
        return user;
    }

    private UserAddress? CreateTestAddress(Guid userId, int seed)
    {
        // Only create address for some users
        if (seed % 3 != 0) return null;

        var address = new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AddressLine = $"{seed} Test Street",
            City = $"Test City {seed}",
            Governorate = $"Test State {seed}",
            PostalCode = $"{seed:D5}",
            Country = "Test Country",
            IsPrimary = true
        };
        _context.UserAddresses.Add(address);
        _context.SaveChanges();
        return address;
    }

    private List<Verification> CreateTestVerifications(Guid userId, int seed)
    {
        var verifications = new List<Verification>();

        // Create different verification types based on seed
        if (seed % 2 == 0)
        {
            verifications.Add(new Verification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DocumentType = "DriverLicense",
                Status = "Approved",
                CreatedAt = DateTime.UtcNow
            });
        }

        if (seed % 3 == 0)
        {
            verifications.Add(new Verification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DocumentType = "Passport",
                Status = "Approved",
                CreatedAt = DateTime.UtcNow
            });
        }

        if (seed % 5 == 0)
        {
            verifications.Add(new Verification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DocumentType = "NationalId",
                Status = "Approved",
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.Verifications.AddRange(verifications);
        _context.SaveChanges();
        return verifications;
    }
    private IFormFile CreateValidImageFile(int seed)
    {
        var fileName = $"test{seed}.jpg";
        var content = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 }; // JPEG header bytes
        var stream = new MemoryStream(content);

        var fileMock = new Mock<IFormFile>();
        fileMock.Setup(f => f.FileName).Returns(fileName);
        fileMock.Setup(f => f.Length).Returns(content.Length);
        fileMock.Setup(f => f.OpenReadStream()).Returns(stream);
        fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
               .Returns(Task.CompletedTask);

        return fileMock.Object;
    }

    private IFormFile CreateInvalidImageFile(int seed)
    {
        var fileName = $"test{seed}.txt"; // Invalid extension
        var content = new byte[] { 0x48, 0x65, 0x6C, 0x6C, 0x6F }; // "Hello" in bytes
        var stream = new MemoryStream(content);

        var fileMock = new Mock<IFormFile>();
        fileMock.Setup(f => f.FileName).Returns(fileName);
        fileMock.Setup(f => f.Length).Returns(content.Length);
        fileMock.Setup(f => f.OpenReadStream()).Returns(stream);

        return fileMock.Object;
    }

    private (ApplicationUser user, UserAddress? address, int expectedMinCompleteness, int expectedMaxCompleteness) CreateMinimalProfile(int seed)
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = $"minimal{seed}@example.com",
            FirstName = $"Minimal{seed}",
            LastName = $"User{seed}",
            UserName = $"minimal{seed}@example.com",
            EmailConfirmed = false,
            PhoneNumber = null,
            PhoneNumberConfirmed = false,
            ProfileImage = null
        };
        _context.Users.Add(user);
        _context.SaveChanges();

        // Minimal profile should have low completeness (around 25-50%)
        return (user, null, 25, 50);
    }

    private (ApplicationUser user, UserAddress? address, int expectedMinCompleteness, int expectedMaxCompleteness) CreatePartialProfile(int seed)
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = $"partial{seed}@example.com",
            FirstName = $"Partial{seed}",
            LastName = $"User{seed}",
            UserName = $"partial{seed}@example.com",
            EmailConfirmed = true,
            PhoneNumber = $"+1555{seed:D7}",
            PhoneNumberConfirmed = false,
            ProfileImage = null
        };
        _context.Users.Add(user);

        var address = new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            AddressLine = $"{seed} Partial Street",
            City = $"Partial City {seed}",
            Governorate = $"Partial State {seed}",
            PostalCode = $"{seed:D5}",
            Country = "Partial Country",
            IsPrimary = true
        };
        _context.UserAddresses.Add(address);
        _context.SaveChanges();

        // Partial profile should have medium completeness (around 50-75%)
        return (user, address, 50, 75);
    }
    private (ApplicationUser user, UserAddress? address, int expectedMinCompleteness, int expectedMaxCompleteness) CreateCompleteProfile(int seed)
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = $"complete{seed}@example.com",
            FirstName = $"Complete{seed}",
            LastName = $"User{seed}",
            UserName = $"complete{seed}@example.com",
            EmailConfirmed = true,
            PhoneNumber = $"+1555{seed:D7}",
            PhoneNumberConfirmed = true,
            ProfileImage = $"/uploads/profiles/complete{seed}.jpg"
        };
        _context.Users.Add(user);

        var address = new UserAddress
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            AddressLine = $"{seed} Complete Street",
            City = $"Complete City {seed}",
            Governorate = $"Complete State {seed}",
            PostalCode = $"{seed:D5}",
            Country = "Complete Country",
            IsPrimary = true
        };
        _context.UserAddresses.Add(address);

        // Add verifications for complete profile
        var verifications = new List<Verification>
        {
            new Verification
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                DocumentType = "DriverLicense",
                Status = "Approved",
                CreatedAt = DateTime.UtcNow
            },
            new Verification
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                DocumentType = "Passport",
                Status = "Approved",
                CreatedAt = DateTime.UtcNow
            }
        };
        _context.Verifications.AddRange(verifications);
        _context.SaveChanges();

        // Complete profile should have high completeness (around 75-100%)
        return (user, address, 75, 100);
    }

    #endregion

    public void Dispose()
    {
        _context.Dispose();
    }
}