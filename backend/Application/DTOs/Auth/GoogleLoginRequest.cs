namespace Backend.Application.DTOs.Auth;

/// <summary>
/// Request payload for Google OAuth sign-in / sign-up.
/// </summary>
/// <param name="IdToken">
/// The Google-issued OpenID Connect ID token obtained on the client via
/// Google Identity Services (GIS). Validated server-side against
/// <c>Google.Apis.Auth.GoogleJsonWebSignature</c> using the configured
/// <c>Google:ClientId</c>.
/// </param>
/// <param name="Role">
/// The role the user wants for a brand-new account. Only honoured when the
/// account does not exist yet; for existing users the stored role is kept
/// to prevent privilege manipulation. Must be one of
/// <c>Customer</c>, <c>Supplier</c>, or <c>Driver</c>.
/// </param>
/// <param name="StayConnected">
/// Optional — mirrors the email/password login flag. Extends the access
/// token's lifetime for trusted devices.
/// </param>
public record GoogleLoginRequest(
    string IdToken,
    string Role,
    bool? StayConnected
);
