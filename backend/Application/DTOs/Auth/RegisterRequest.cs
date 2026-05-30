namespace Backend.Application.DTOs.Auth;

/// <summary>
/// Self-service registration payload.
///
/// The original positional parameters (Email, Password, FirstName, LastName,
/// AcceptedTerms, AcceptedPrivacy) are preserved at their original positions
/// so existing callers / unit tests that construct this record positionally
/// keep compiling. The new fields are appended with defaults so they're
/// optional on the wire and only meaningful when supplied.
/// </summary>
/// <param name="Phone">Optional phone number captured at signup; persisted to
///     <c>ApplicationUser.PhoneNumber</c>. Required by the new register UI
///     and validated by <c>RegisterRequestValidator</c> when present.</param>
/// <param name="ConfirmPassword">Mirror of <see cref="Password"/> for
///     server-side confirmation. Optional so legacy clients still work;
///     when supplied, the validator enforces it matches <see cref="Password"/>.</param>
/// <param name="Role">Requested role — <c>"customer"</c> or <c>"supplier"</c>
///     (case-insensitive). When omitted the user is created as a Customer,
///     which is the historical default in <c>AuthService.RegisterAsync</c>.</param>
public record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    bool AcceptedTerms,
    bool AcceptedPrivacy,
    string? Phone = null,
    string? ConfirmPassword = null,
    string? Role = null
);
