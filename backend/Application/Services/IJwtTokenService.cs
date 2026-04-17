using Backend.Domain.Entities;

namespace Backend.Application.Services;

public interface IJwtTokenService
{
    string GenerateToken(ApplicationUser user, IList<string> roles, bool stayConnected = false);
    string GenerateRefreshToken();
    DateTime GetTokenExpiration(bool stayConnected = false);
    DateTime GetRefreshTokenExpiration();
}
