using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Auth;

public record RefreshTokenRequest(
    [Required] string RefreshToken
);
