using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.UserManagement;
using Backend.Application.DTOs.UserProfile;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Controller for user profile management and user management operations
/// Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 12.1, 12.2, 12.3, 12.4
/// </summary>
[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserProfileService _userProfileService;
    private readonly IUserManagementService _userManagementService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IUserProfileService userProfileService,
        IUserManagementService userManagementService,
        ILogger<UsersController> logger)
    {
        _userProfileService = userProfileService;
        _userManagementService = userManagementService;
        _logger = logger;
    }

    /// <summary>
    /// Get user profile information
    /// Validates: Requirements 6.1, 6.2, 6.3
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Complete user profile with verification status and completeness</returns>
    [HttpGet("{userId}/profile")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserProfileDto>> GetProfile(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Get authenticated user ID
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var authenticatedUserId = Guid.Parse(userIdClaim.Value);

        // Verify userId matches authenticated user (Requirement 6.2)
        if (userId != authenticatedUserId)
        {
            _logger.LogWarning(
                "User {AuthenticatedUserId} attempted to access profile of user {RequestedUserId}",
                authenticatedUserId,
                userId);
            return Forbid();
        }

        var profile = await _userProfileService.GetProfileAsync(userId, cancellationToken);

        _logger.LogInformation("Retrieved profile for user {UserId}", userId);

        return Ok(profile);
    }

    /// <summary>
    /// Update user profile information
    /// Validates: Requirements 6.4, 6.5, 6.6, 6.7
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="request">Profile update request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Update response with verification requirements</returns>
    [HttpPut("{userId}/profile")]
    [ProducesResponseType(typeof(UpdateProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UpdateProfileResponse>> UpdateProfile(
        Guid userId,
        [FromBody] UpdateProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate request
        var validator = new Backend.Application.Validators.UpdateProfileRequestValidator();
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

        // Get authenticated user ID
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var authenticatedUserId = Guid.Parse(userIdClaim.Value);

        // Verify userId matches authenticated user
        if (userId != authenticatedUserId)
        {
            _logger.LogWarning(
                "User {AuthenticatedUserId} attempted to update profile of user {RequestedUserId}",
                authenticatedUserId,
                userId);
            return Forbid();
        }

        var response = await _userProfileService.UpdateProfileAsync(
            userId,
            request,
            cancellationToken);

        _logger.LogInformation("Updated profile for user {UserId}", userId);

        return Ok(response);
    }

    /// <summary>
    /// Upload user profile photo
    /// Validates: Requirements 6.8, 6.9
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="photo">Photo file</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>URL of the uploaded photo</returns>
    [HttpPost("{userId}/profile/photo")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UploadProfilePhoto(
        Guid userId,
        IFormFile photo,
        CancellationToken cancellationToken = default)
    {
        // Get authenticated user ID
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var authenticatedUserId = Guid.Parse(userIdClaim.Value);

        // Verify userId matches authenticated user
        if (userId != authenticatedUserId)
        {
            _logger.LogWarning(
                "User {AuthenticatedUserId} attempted to upload photo for user {RequestedUserId}",
                authenticatedUserId,
                userId);
            return Forbid();
        }

        var photoUrl = await _userProfileService.UploadProfilePhotoAsync(
            userId,
            photo,
            cancellationToken);

        _logger.LogInformation("Uploaded profile photo for user {UserId}", userId);

        return Ok(new
        {
            Success = true,
            ProfilePhotoUrl = photoUrl
        });
    }

    /// <summary>
    /// Change user password
    /// </summary>
    [HttpPost("{userId}/profile/change-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ChangePassword(
        Guid userId,
        [FromBody] Backend.Application.DTOs.UserProfile.ChangePasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate request
        var validator = new Backend.Application.Validators.ChangePasswordRequestValidator();
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

        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return Unauthorized(new { Message = "User not authenticated" });

        var authenticatedUserId = Guid.Parse(userIdClaim.Value);
        if (userId != authenticatedUserId)
            return Forbid();

        await _userProfileService.ChangePasswordAsync(userId, request, cancellationToken);
        _logger.LogInformation("Password changed for user {UserId}", userId);
        return Ok(new { Message = "Password changed successfully." });
    }

}
/// <summary>
/// Controller for admin user management operations
/// </summary>
[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public class AdminUsersController : ControllerBase
{
    private readonly IUserManagementService _userManagementService;
    private readonly IUserDeletionService _userDeletionService;
    private readonly IUserProfileService _userProfileService;
    private readonly ILogger<AdminUsersController> _logger;

    public AdminUsersController(
        IUserManagementService userManagementService,
        IUserDeletionService userDeletionService,
        IUserProfileService userProfileService,
        ILogger<AdminUsersController> logger)
    {
        _userManagementService = userManagementService;
        _userDeletionService = userDeletionService;
        _userProfileService = userProfileService;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated list of users (Admin only)
    /// Validates: Requirements 12.1
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="size">Page size</param>
    /// <param name="request">Optional filter request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of users and statistics</returns>
    [HttpPost("{page}/{size}")]
    [ProducesResponseType(typeof(UserManagementListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<UserManagementListResponse>> GetUsers(
        int page,
        int size,
        [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] UserFilterRequest? request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Admin requesting paginated users list - Page: {Page}, Size: {Size}", page, size);

        var result = await _userManagementService.GetUsersAsync(page, size, request, cancellationToken);

        _logger.LogInformation(
            "Successfully retrieved {Count} users from page {Page} of {TotalPages}",
            result.Items.Count,
            page,
            result.TotalPages);

        return Ok(result);
    }

    /// <summary>
    /// Get user by ID (Admin only)
    /// Validates: Requirements 12.2
    /// </summary>
    /// <param name="id">User ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>User details if found</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(UserManagementDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserManagementDto>> GetUser(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Admin requesting user details for ID: {UserId}", id);

        var user = await _userManagementService.GetUserByIdAsync(id, cancellationToken);
        if (user == null)
        {
            _logger.LogWarning("User {UserId} not found", id);
            return NotFound(new { Message = $"User with ID {id} not found" });
        }

        _logger.LogInformation("Successfully retrieved user {UserId}", id);
        return Ok(user);
    }

    /// <summary>
    /// Create a new user account (Admin only)
    /// Validates: Requirements 12.3
    /// </summary>
    /// <param name="request">User creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>User creation response</returns>
    [HttpPost("create")]
    [ProducesResponseType(typeof(UserManagementResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserManagementResponse>> CreateUser(
        [FromBody] CreateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Admin creating new user with email: {Email}", request.Email);

        var response = await _userManagementService.CreateUserAsync(request, cancellationToken);

        _logger.LogInformation("Successfully created user {UserId} with email {Email}", response.UserId, request.Email);

        return CreatedAtAction(
            nameof(GetUser),
            "AdminUsers",
            new { id = response.UserId },
            response);
    }

    /// <summary>
    /// Update an existing user account (Admin only)
    /// Validates: Requirements 12.4
    /// </summary>
    /// <param name="id">User ID to update</param>
    /// <param name="request">User update request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>User update response</returns>
    [HttpPut("{id}/edit")]
    [ProducesResponseType(typeof(UserManagementResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserManagementResponse>> UpdateUser(
        Guid id,
        [FromBody] UpdateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Admin updating user {UserId}", id);

        var response = await _userManagementService.UpdateUserAsync(id, request, cancellationToken);

        _logger.LogInformation("Successfully updated user {UserId}", id);

        return Ok(response);
    }

    /// <summary>
    /// Toggle user status between Active and Blocked (Admin only)
    /// </summary>
    /// <param name="id">User ID to toggle status</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Status change result</returns>
    [HttpPut("{id}/toggle-status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ToggleUserStatus(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Admin toggling status for user {UserId}", id);

        var user = await _userManagementService.GetUserByIdAsync(id, cancellationToken);
        if (user == null)
        {
            return NotFound(new { Message = $"User with ID {id} not found" });
        }

        var newStatus = user.Status == "Active" ? "Blocked" : "Active";

        var request = new UpdateUserRequest(
            FirstName: user.FirstName,
            LastName: user.LastName,
            PhoneNumber: user.PhoneNumber,
            Status: newStatus,
            Roles: user.Roles,
            DateOfBirth: user.DateOfBirth
        );

        await _userManagementService.UpdateUserAsync(id, request, cancellationToken);

        // Fetch user again to get the final status determined by restriction workflow
        var updatedUser = await _userManagementService.GetUserByIdAsync(id, cancellationToken);
        var finalStatus = updatedUser?.Status ?? newStatus;

        _logger.LogInformation("Successfully toggled status for user {UserId} to {FinalStatus}", id, finalStatus);

        return Ok(new { Message = $"User status changed to {finalStatus}", Status = finalStatus });
    }

    /// <summary>
    /// Upload profile photo for a user (Admin only)
    /// </summary>
    [HttpPost("{id}/photo")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadUserPhoto(
        Guid id,
        IFormFile photo,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Admin uploading photo for user {UserId}", id);

        var user = await _userManagementService.GetUserByIdAsync(id, cancellationToken);
        if (user == null)
            return NotFound(new { Message = $"User with ID {id} not found" });

        var photoUrl = await _userProfileService.UploadProfilePhotoAsync(id, photo, cancellationToken);

        _logger.LogInformation("Admin successfully uploaded photo for user {UserId}", id);

        return Ok(new { Success = true, AvatarUrl = photoUrl });
    }

    /// <summary>
    /// Permanently delete a user (Admin only).
    ///
    /// Performs a true hard delete, but ONLY when the user holds no critical
    /// business records. If the user has bookings, payments, reviews, driver
    /// assignments, owned vehicles, or inspections, the request is rejected
    /// with a 409 Conflict explaining why. Non-critical child records
    /// (profiles, addresses, verifications, favorites, payment methods,
    /// notifications, refresh tokens) are removed alongside the user.
    /// </summary>
    /// <param name="id">User ID to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Deletion result</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(DeleteUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DeleteUserResponse>> DeleteUser(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Admin requested deletion of user {UserId}", id);

        var response = await _userDeletionService.DeleteUserAsync(id, cancellationToken);

        _logger.LogInformation("Successfully deleted user {UserId}", id);

        return Ok(response);
    }
}
