using Backend.Application.DTOs.UserProfile;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services;

/// <summary>
/// Service implementation for user profile management operations
/// </summary>
public class UserProfileService : IUserProfileService
{
    private readonly IUserRepository _userRepository;
    private readonly IApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<UserProfileService> _logger;

    public UserProfileService(
        IUserRepository userRepository,
        IApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        ILogger<UserProfileService> logger)
    {
        _userRepository = userRepository;
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    /// <summary>
    /// Gets complete user profile information including verification status and completeness
    /// Validates: Requirements 6.1, 6.10, 6.11
    /// </summary>
    public async Task<UserProfileDto> GetProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting profile for user {UserId}", userId);

        // Get user from repository
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            _logger.LogWarning("User {UserId} not found", userId);
            throw new NotFoundException($"User with ID {userId} not found");
        }

        // Get user address (primary address or first address)
        var userAddress = await _context.UserAddresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsPrimary)
            .FirstOrDefaultAsync(cancellationToken);

        // Get verification records
        var verifications = await _context.Verifications
            .Where(v => v.UserId == userId)
            .ToListAsync(cancellationToken);

        // Build address DTO
        var addressDto = userAddress != null
            ? new AddressDto(
                userAddress.AddressLine ?? string.Empty,
                userAddress.City ?? string.Empty,
                userAddress.Governorate ?? string.Empty,
                userAddress.PostalCode ?? string.Empty,
                userAddress.Country ?? string.Empty)
            : new AddressDto(string.Empty, string.Empty, string.Empty, string.Empty, string.Empty);

        // Build emergency contact DTO from user fields
        var emergencyContactDto = new EmergencyContactDto(
            user.EmergencyContactName ?? string.Empty,
            user.EmergencyContactPhone ?? string.Empty,
            user.EmergencyContactRelationship ?? string.Empty);

        // Calculate verification status
        var verificationStatus = CalculateVerificationStatus(user, verifications);

        // Calculate profile completeness
        var profileCompleteness = CalculateProfileCompleteness(
            user,
            userAddress,
            emergencyContactDto,
            verifications);

        // Build and return profile DTO
        var profileDto = new UserProfileDto(
            UserId: user.Id,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Email: user.Email ?? string.Empty,
            EmailVerified: user.EmailConfirmed,
            Phone: user.PhoneNumber ?? string.Empty,
            PhoneVerified: user.PhoneNumberConfirmed,
            DateOfBirth: user.DateOfBirth,
            ProfilePhotoUrl: user.ProfileImage,
            Address: addressDto,
            EmergencyContact: emergencyContactDto,
            LanguagePreference: string.IsNullOrWhiteSpace(user.LanguagePreference) ? "en" : user.LanguagePreference,
            CurrencyPreference: string.IsNullOrWhiteSpace(user.CurrencyPreference) ? "USD" : user.CurrencyPreference,
            ProfileCompleteness: profileCompleteness,
            VerificationStatus: verificationStatus);

        _logger.LogInformation(
            "Successfully retrieved profile for user {UserId} with {Completeness}% completeness",
            userId,
            profileCompleteness);

        return profileDto;
    }

    /// <summary>
    /// Updates user profile information
    /// Validates: Requirements 6.2, 6.4, 6.5, 6.6, 6.7, 6.12, 6.13
    /// </summary>
    public async Task<UpdateProfileResponse> UpdateProfileAsync(
        Guid userId,
        UpdateProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating profile for user {UserId}", userId);

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException($"User with ID {userId} not found");
        }

        // Track if verification is required
        bool emailVerificationRequired = false;
        bool phoneVerificationRequired = false;

        // Update basic user information
        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.DateOfBirth = request.DateOfBirth;
        user.LanguagePreference = string.IsNullOrWhiteSpace(request.LanguagePreference) ? "en" : request.LanguagePreference;
        user.CurrencyPreference = string.IsNullOrWhiteSpace(request.CurrencyPreference) ? "USD" : request.CurrencyPreference;

        // Update emergency contact
        user.EmergencyContactName = request.EmergencyContact.Name;
        user.EmergencyContactPhone = request.EmergencyContact.Phone;
        user.EmergencyContactRelationship = request.EmergencyContact.Relationship;

        // Check if phone changed
        if (user.PhoneNumber != request.Phone)
        {
            // Check phone uniqueness
            var phoneExists = await _context.Users
                .AnyAsync(u => u.PhoneNumber == request.Phone && u.Id != userId, cancellationToken);

            if (phoneExists)
            {
                throw new ConflictException("Phone number is already in use");
            }

            user.PhoneNumber = request.Phone;
            user.PhoneNumberConfirmed = false;
            phoneVerificationRequired = true;
        }

        // Update or create user address
        var userAddress = await _context.UserAddresses
            .FirstOrDefaultAsync(a => a.UserId == userId && a.IsPrimary, cancellationToken);

        if (userAddress == null)
        {
            userAddress = new UserAddress
            {
                UserId = userId,
                IsPrimary = true
            };
            _context.AddUserAddress(userAddress);
        }

        userAddress.AddressLine = request.Address.Street;
        userAddress.City = request.Address.City;
        userAddress.Governorate = request.Address.State;
        userAddress.PostalCode = request.Address.PostalCode;
        userAddress.Country = request.Address.Country;

        // Update user entity
        await _userRepository.UpdateAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Successfully updated profile for user {UserId}", userId);

        return new UpdateProfileResponse(
            Success: true,
            Message: "Profile updated successfully",
            VerificationRequired: new VerificationRequiredDto(
                Email: emailVerificationRequired,
                Phone: phoneVerificationRequired));
    }

    /// <summary>
    /// Uploads user profile photo
    /// Validates: Requirements 6.8, 6.9
    /// </summary>
    public async Task<string> UploadProfilePhotoAsync(
        Guid userId,
        IFormFile photo,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Uploading profile photo for user {UserId}", userId);

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException($"User with ID {userId} not found");
        }

        // Validate file type
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
        var fileExtension = Path.GetExtension(photo.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(fileExtension))
        {
            throw new ValidationException("photo", "Invalid file type. Only JPEG and PNG images are allowed.");
        }

        // Validate file size (5MB limit)
        const long maxFileSize = 5 * 1024 * 1024;
        if (photo.Length > maxFileSize)
        {
            throw new ValidationException("photo", "File size exceeds the maximum limit of 5MB.");
        }

        // Generate unique filename
        var fileName = $"{userId}_{Guid.NewGuid()}{fileExtension}";
        var uploadsFolder = Path.Combine("wwwroot", "uploads", "profiles");

        // Ensure directory exists
        Directory.CreateDirectory(uploadsFolder);

        var filePath = Path.Combine(uploadsFolder, fileName);

        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await photo.CopyToAsync(stream, cancellationToken);
        }

        // Update user profile image URL
        var photoUrl = $"/uploads/profiles/{fileName}";
        user.ProfileImage = photoUrl;
        await _userRepository.UpdateAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Successfully uploaded profile photo for user {UserId}", userId);

        return photoUrl;
    }

    /// <summary>
    /// Changes user password after verifying the current password
    /// </summary>
    public async Task ChangePasswordAsync(
        Guid userId,
        ChangePasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Changing password for user {UserId}", userId);

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new NotFoundException($"User with ID {userId} not found");
        }

        var result = await _userManager.ChangePasswordAsync(
            user,
            request.CurrentPassword,
            request.NewPassword);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogWarning("Password change failed for user {UserId}: {Errors}", userId, errors);
            throw new ValidationException("password", errors);
        }

        _logger.LogInformation("Password changed successfully for user {UserId}", userId);
    }

    /// <summary>
    /// Calculates verification status based on user and verification records
    /// Validates: Requirements 6.11
    /// </summary>
    private VerificationStatusDto CalculateVerificationStatus(
        ApplicationUser user,
        List<Verification> verifications)
    {
        var emailVerified = user.EmailConfirmed;
        var phoneVerified = user.PhoneNumberConfirmed;

        // Check for driver license verification
        var driverLicenseVerification = verifications
            .FirstOrDefault(v => v.DocumentType == "DriverLicense" && v.Status == "Approved");
        var driverLicenseVerified = driverLicenseVerification != null;

        // Determine KYC level based on verifications
        var kycLevel = DetermineKycLevel(verifications);

        return new VerificationStatusDto(
            Email: emailVerified,
            Phone: phoneVerified,
            DriverLicense: driverLicenseVerified,
            Kyc: kycLevel);
    }

    /// <summary>
    /// Determines KYC verification level
    /// </summary>
    private string DetermineKycLevel(List<Verification> verifications)
    {
        var approvedVerifications = verifications
            .Where(v => v.Status == "Approved")
            .ToList();

        if (!approvedVerifications.Any())
        {
            return "none";
        }

        // Enhanced: Multiple document types verified
        if (approvedVerifications.Count >= 3)
        {
            return "enhanced";
        }

        // Standard: At least 2 document types verified
        if (approvedVerifications.Count >= 2)
        {
            return "standard";
        }

        // Basic: At least 1 document verified
        return "basic";
    }

    /// <summary>
    /// Calculates profile completeness percentage (0-100)
    /// Validates: Requirements 6.10
    /// </summary>
    private int CalculateProfileCompleteness(
        ApplicationUser user,
        UserAddress? address,
        EmergencyContactDto emergencyContact,
        List<Verification> verifications)
    {
        var totalFields = 12;
        var filledFields = 0;

        // Required fields (4)
        if (!string.IsNullOrWhiteSpace(user.FirstName)) filledFields++;
        if (!string.IsNullOrWhiteSpace(user.LastName)) filledFields++;
        if (!string.IsNullOrWhiteSpace(user.Email)) filledFields++;
        if (!string.IsNullOrWhiteSpace(user.PhoneNumber)) filledFields++;

        // Optional fields (4)
        if (!string.IsNullOrWhiteSpace(user.ProfileImage)) filledFields++;
        if (user.DateOfBirth.HasValue) filledFields++;

        // Address completeness (count as 1 if core fields filled)
        if (address != null &&
            !string.IsNullOrWhiteSpace(address.AddressLine) &&
            !string.IsNullOrWhiteSpace(address.City) &&
            !string.IsNullOrWhiteSpace(address.Country))
        {
            filledFields++;
        }

        // Emergency contact (count as 1 if name and phone filled)
        if (!string.IsNullOrWhiteSpace(user.EmergencyContactName) &&
            !string.IsNullOrWhiteSpace(user.EmergencyContactPhone))
        {
            filledFields++;
        }

        // Verification status (4)
        if (user.EmailConfirmed) filledFields++;
        if (user.PhoneNumberConfirmed) filledFields++;

        // Driver license verification
        if (verifications.Any(v => v.DocumentType == "DriverLicense" && v.Status == "Approved"))
        {
            filledFields++;
        }

        // KYC Verification (Standard or better level counts as 1)
        var approvedCount = verifications.Count(v => v.Status == "Approved");
        if (approvedCount >= 2)
        {
            filledFields++;
        }

        return (int)Math.Round((double)filledFields / totalFields * 100);
    }
}
