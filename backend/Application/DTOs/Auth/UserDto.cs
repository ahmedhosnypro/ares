namespace Backend.Application.DTOs.Auth;

/// <summary>
/// Logged-in user shape returned by every authentication endpoint
/// (login / refresh / demo / google). The optional <see cref="Status"/>
/// field surfaces <c>ApplicationUser.Status</c> verbatim — currently
/// one of <c>"Pending"</c>, <c>"Active"</c>, <c>"Blocked"</c> — so the
/// frontend can route a freshly-registered user to <c>/complete-profile</c>.
/// </summary>
public record UserDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    List<string> Roles,
    bool EmailVerified,
    string? Status = null,
    string? Phone = null
);
