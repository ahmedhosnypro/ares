using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.UserManagement;

namespace Backend.Application.Services;

/// <summary>
/// Service interface for user management operations (admin functionality)
/// </summary>
public interface IUserManagementService
{
    /// <summary>
    /// Gets paginated list of users
    /// </summary>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of users</returns>
    Task<PagedResult<UserManagementDto>> GetUsersAsync(
        int page = 1,
        int pageSize = 20,
        UserFilterRequest? filter = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a specific user by ID
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>User details if found</returns>
    Task<UserManagementDto?> GetUserByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new user account
    /// </summary>
    /// <param name="request">User creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>User creation response</returns>
    Task<UserManagementResponse> CreateUserAsync(
        CreateUserRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing user account
    /// </summary>
    /// <param name="userId">User ID to update</param>
    /// <param name="request">User update request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>User update response</returns>
    Task<UserManagementResponse> UpdateUserAsync(
        Guid userId,
        UpdateUserRequest request,
        CancellationToken cancellationToken = default);
}