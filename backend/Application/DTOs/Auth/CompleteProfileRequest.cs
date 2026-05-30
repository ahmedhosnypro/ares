namespace Backend.Application.DTOs.Auth;

/// <summary>
/// Payload for <c>POST /api/auth/complete-profile</c>.
///
/// The endpoint is called from the frontend <c>/complete-profile</c> page
/// after a freshly registered user (whose <c>ApplicationUser.Status</c> is
/// <c>"Pending"</c>) confirms the remaining account fields they want to
/// fill in. All fields are optional so the form is permissive — what
/// matters is that the user reaches the screen and confirms. The
/// backend then flips <c>Status</c> from <c>"Pending"</c> to
/// <c>"Active"</c>.
/// </summary>
/// <param name="Phone">Optional phone number override (e.g. user entered
///     one at completion time rather than at registration).</param>
/// <param name="FirstName">Optional override for the user's first name.</param>
/// <param name="LastName">Optional override for the user's last name.</param>
public record CompleteProfileRequest(
    string? Phone = null,
    string? FirstName = null,
    string? LastName = null
);
