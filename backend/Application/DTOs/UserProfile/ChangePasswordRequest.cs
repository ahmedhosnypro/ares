namespace Backend.Application.DTOs.UserProfile;

/// <summary>
/// Request DTO for changing user password
/// </summary>
public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword);
