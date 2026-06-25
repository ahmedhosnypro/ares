using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.UserManagement;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services;

/// <summary>
/// Service implementation for user management operations (admin functionality)
/// </summary>
public class UserManagementService : IUserManagementService
{
    private readonly IUserRepository _userRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly ILogger<UserManagementService> _logger;
    private readonly ISupplierRestrictionService _supplierRestrictionService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private string? FormatDateOfBirth(DateTime? date) =>
        date.HasValue ? date.Value.ToString("yyyy-MM-dd") : null;

    private DateTime? ParseDateOfBirth(string? dateString)
    {
        if (string.IsNullOrWhiteSpace(dateString)) return null;
        return DateTime.TryParse(dateString, out var parsed) ? parsed : null;
    }

    private string? BuildAvatarUrl(string? profileImage)
    {
        if (string.IsNullOrWhiteSpace(profileImage)) return null;
        // Already a full URL
        if (profileImage.StartsWith("http://") || profileImage.StartsWith("https://")) return profileImage;
        // Build full URL from request context
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null) return profileImage;
        var request = httpContext.Request;
        var baseUrl = $"{request.Scheme}://{request.Host}";
        return $"{baseUrl}/{profileImage.TrimStart('/')}";
    }

    public UserManagementService(
        IUserRepository userRepository,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        ILogger<UserManagementService> logger,
        ISupplierRestrictionService supplierRestrictionService,
        IHttpContextAccessor httpContextAccessor)
    {
        _userRepository = userRepository;
        _userManager = userManager;
        _roleManager = roleManager;
        _logger = logger;
        _supplierRestrictionService = supplierRestrictionService;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Gets paginated list of users
    /// Validates: Requirements 12.1
    /// </summary>
    public async Task<PagedResult<UserManagementDto>> GetUsersAsync(
        int page = 1,
        int pageSize = 20,
        UserFilterRequest? filter = null,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting paginated users list - Page: {Page}, PageSize: {PageSize}", page, pageSize);

        // Validate pagination parameters
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100; // Limit max page size

        List<Guid>? userIdsInRole = null;
        if (filter != null && !string.IsNullOrWhiteSpace(filter.Role))
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(filter.Role);
            userIdsInRole = usersInRole.Select(u => u.Id).ToList();
            if (userIdsInRole.Count == 0)
            {
                // No users in this role, return empty
                return new PagedResult<UserManagementDto>(new List<UserManagementDto>(), page, pageSize, 0, 0);
            }
        }

        // Build filter expression
        System.Linq.Expressions.Expression<Func<ApplicationUser, bool>>? predicate = null;

        var hasRoleFilter = userIdsInRole != null;
        var hasStatusFilter = !string.IsNullOrEmpty(filter?.Status);
        var hasSearchTerm = !string.IsNullOrEmpty(filter?.SearchTerm);

        if (hasRoleFilter || hasStatusFilter || hasSearchTerm)
        {
            var searchTerm = filter?.SearchTerm;
            var status = filter?.Status;

            predicate = u =>
                (!hasRoleFilter || userIdsInRole!.Contains(u.Id)) &&
                (!hasStatusFilter || u.Status == status) &&
                (!hasSearchTerm ||
                    (u.FirstName != null && u.FirstName.Contains(searchTerm!)) ||
                    (u.LastName != null && u.LastName.Contains(searchTerm!)) ||
                    (u.Email != null && u.Email.Contains(searchTerm!)));
        }

        // Get paginated users
        var pagedUsers = await _userRepository.GetPagedAsync(
            page,
            pageSize,
            filter: predicate,
            orderBy: query => query.OrderBy(u => u.CreatedAt),
            cancellationToken);

        // Convert to DTOs
        var userDtos = new List<UserManagementDto>();
        foreach (var user in pagedUsers.Data)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var userDto = new UserManagementDto(
                Id: user.Id,
                Email: user.Email ?? string.Empty,
                FirstName: user.FirstName,
                LastName: user.LastName,
                PhoneNumber: user.PhoneNumber,
                EmailConfirmed: user.EmailConfirmed,
                PhoneNumberConfirmed: user.PhoneNumberConfirmed,
                Status: user.Status,
                Roles: roles.ToList(),
                CreatedAt: user.CreatedAt,
                UpdatedAt: user.UpdatedAt,
                DateOfBirth: FormatDateOfBirth(user.DateOfBirth),
                AvatarUrl: BuildAvatarUrl(user.ProfileImage)
            );
            userDtos.Add(userDto);
        }

        var result = new PagedResult<UserManagementDto>(
            Data: userDtos,
            Page: pagedUsers.Page,
            PageSize: pagedUsers.PageSize,
            TotalCount: pagedUsers.TotalCount,
            TotalPages: pagedUsers.TotalPages
        );

        _logger.LogInformation(
            "Successfully retrieved {Count} users from page {Page} of {TotalPages}",
            userDtos.Count,
            page,
            result.TotalPages);

        return result;
    }

    /// <summary>
    /// Gets a specific user by ID
    /// Validates: Requirements 12.2
    /// </summary>
    public async Task<UserManagementDto?> GetUserByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting user by ID: {UserId}", userId);

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            _logger.LogWarning("User {UserId} not found", userId);
            return null;
        }

        var roles = await _userManager.GetRolesAsync(user);

        var userDto = new UserManagementDto(
            Id: user.Id,
            Email: user.Email ?? string.Empty,
            FirstName: user.FirstName,
            LastName: user.LastName,
            PhoneNumber: user.PhoneNumber,
            EmailConfirmed: user.EmailConfirmed,
            PhoneNumberConfirmed: user.PhoneNumberConfirmed,
            Status: user.Status,
            Roles: roles.ToList(),
            CreatedAt: user.CreatedAt,
            UpdatedAt: user.UpdatedAt,
            DateOfBirth: FormatDateOfBirth(user.DateOfBirth),
            AvatarUrl: BuildAvatarUrl(user.ProfileImage)
        );

        _logger.LogInformation("Successfully retrieved user {UserId}", userId);
        return userDto;
    }

    /// <summary>
    /// Creates a new user account
    /// Validates: Requirements 12.3
    /// </summary>
    public async Task<UserManagementResponse> CreateUserAsync(
        CreateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating new user with email: {Email}", request.Email);

        // Check if email already exists
        var existingUser = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (existingUser != null)
        {
            _logger.LogWarning("Attempt to create user with existing email: {Email}", request.Email);
            throw new ConflictException("A user with this email address already exists");
        }

        // Create new user
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            Status = request.Status ?? "Active",
            DateOfBirth = ParseDateOfBirth(request.DateOfBirth),
            EmailConfirmed = true, // Admin-created users are pre-confirmed
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create user with password
        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.ToDictionary(
                e => e.Code,
                e => new[] { e.Description });
            _logger.LogError("Failed to create user {Email}: {Errors}", request.Email, string.Join(", ", result.Errors.Select(e => e.Description)));
            throw new ValidationException(errors);
        }

        // Assign roles if specified
        if (request.Roles != null && request.Roles.Any())
        {
            foreach (var roleName in request.Roles)
            {
                // Verify role exists
                var roleExists = await _roleManager.RoleExistsAsync(roleName);
                if (!roleExists)
                {
                    _logger.LogWarning("Role {RoleName} does not exist, skipping assignment", roleName);
                    continue;
                }

                var roleResult = await _userManager.AddToRoleAsync(user, roleName);
                if (!roleResult.Succeeded)
                {
                    _logger.LogWarning("Failed to assign role {RoleName} to user {UserId}", roleName, user.Id);
                }
            }
        }

        _logger.LogInformation("Successfully created user {UserId} with email {Email}", user.Id, request.Email);

        return new UserManagementResponse(
            Success: true,
            Message: "User created successfully",
            UserId: user.Id
        );
    }

    /// <summary>
    /// Updates an existing user account
    /// Validates: Requirements 12.4
    /// </summary>
    public async Task<UserManagementResponse> UpdateUserAsync(
        Guid userId,
        UpdateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating user {UserId}", userId);

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            _logger.LogWarning("User {UserId} not found for update", userId);
            throw new NotFoundException($"User with ID {userId} not found");
        }

        // Update basic properties
        user.FirstName = request.FirstName;
        user.LastName = request.LastName;

        var previousStatus = user.Status;
        user.Status = request.Status;
        user.DateOfBirth = ParseDateOfBirth(request.DateOfBirth);
        user.UpdatedAt = DateTime.UtcNow;

        // Update phone number if changed
        if (user.PhoneNumber != request.PhoneNumber)
        {
            // Check if phone number is already in use by another user
            if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
            {
                var phoneExists = await _userManager.Users
                    .AnyAsync(u => u.PhoneNumber == request.PhoneNumber && u.Id != userId, cancellationToken);

                if (phoneExists)
                {
                    throw new ConflictException("Phone number is already in use by another user");
                }
            }

            user.PhoneNumber = request.PhoneNumber;
            user.PhoneNumberConfirmed = false; // Reset confirmation when phone changes
        }

        // Update user
        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var errors = updateResult.Errors.ToDictionary(
                e => e.Code,
                e => new[] { e.Description });
            _logger.LogError("Failed to update user {UserId}: {Errors}", userId, string.Join(", ", updateResult.Errors.Select(e => e.Description)));
            throw new ValidationException(errors);
        }

        // Update roles if specified
        if (request.Roles != null)
        {
            var currentRoles = await _userManager.GetRolesAsync(user);

            // Remove current roles
            if (currentRoles.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                {
                    _logger.LogWarning("Failed to remove existing roles from user {UserId}", userId);
                }
            }

            // Add new roles
            foreach (var roleName in request.Roles)
            {
                var roleExists = await _roleManager.RoleExistsAsync(roleName);
                if (!roleExists)
                {
                    _logger.LogWarning("Role {RoleName} does not exist, skipping assignment", roleName);
                    continue;
                }

                var roleResult = await _userManager.AddToRoleAsync(user, roleName);
                if (!roleResult.Succeeded)
                {
                    _logger.LogWarning("Failed to assign role {RoleName} to user {UserId}", roleName, userId);
                }
            }
        }

        // Apply or remove supplier restriction
        if (previousStatus != request.Status && request.Status != null)
        {
            var adminIdString = _httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var adminId = Guid.TryParse(adminIdString, out var parsedId) ? parsedId : Guid.Empty;

            if (await _userManager.IsInRoleAsync(user, "Supplier"))
            {
                if (request.Status.Equals("Restricted", StringComparison.OrdinalIgnoreCase) ||
                    request.Status.Equals("Blocked", StringComparison.OrdinalIgnoreCase))
                {
                    await _supplierRestrictionService.ApplyRestrictionAsync(user.Id, adminId, cancellationToken);
                }
                else if (request.Status.Equals("Active", StringComparison.OrdinalIgnoreCase) &&
                         (previousStatus == "Restricted" || previousStatus == "Blocked" ||
                          previousStatus == "RESTRICTED" || previousStatus == "BLOCKED"))
                {
                    await _supplierRestrictionService.RemoveRestrictionAsync(user.Id, adminId, cancellationToken);
                }
            }
        }

        _logger.LogInformation("Successfully updated user {UserId}", userId);

        return new UserManagementResponse(
            Success: true,
            Message: "User updated successfully",
            UserId: userId
        );
    }
}