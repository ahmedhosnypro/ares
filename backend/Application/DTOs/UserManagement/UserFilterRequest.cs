namespace Backend.Application.DTOs.UserManagement;

/// <summary>
/// Request DTO for filtering and searching users in the admin dashboard
/// </summary>
/// <param name="SearchTerm">Optional search term to filter by first name, last name, or email</param>
/// <param name="Role">Optional role name to filter users by role (e.g. "Admin", "Supplier", "Customer")</param>
/// <param name="Status">Optional status to filter by (e.g. "Active", "Blocked")</param>
public record UserFilterRequest(
    string? SearchTerm,
    string? Role,
    string? Status
);
