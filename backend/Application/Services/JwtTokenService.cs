using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Backend.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Application.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(ApplicationUser user, IList<string> roles, bool stayConnected = false)
    {
        var secretKey = _configuration["Jwt:SecretKey"] 
            ?? throw new InvalidOperationException("JWT SecretKey is not configured");
        var issuer = _configuration["Jwt:Issuer"] 
            ?? throw new InvalidOperationException("JWT Issuer is not configured");
        var audience = _configuration["Jwt:Audience"] 
            ?? throw new InvalidOperationException("JWT Audience is not configured");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.GivenName, user.FirstName ?? string.Empty),
            new(ClaimTypes.Surname, user.LastName ?? string.Empty),
            new("emailVerified", user.EmailConfirmed.ToString())
        };

        // Add role claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var expiration = GetTokenExpiration(stayConnected);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiration,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public DateTime GetTokenExpiration(bool stayConnected = false)
    {
        if (stayConnected)
        {
            var extendedDays = int.Parse(_configuration["Jwt:ExtendedExpirationDays"] ?? "400");
            return DateTime.UtcNow.AddDays(extendedDays);
        }

        var expirationMinutes = int.Parse(_configuration["Jwt:ExpirationMinutes"] ?? "15");
        return DateTime.UtcNow.AddMinutes(expirationMinutes);
    }

    public DateTime GetRefreshTokenExpiration()
    {
        var expirationDays = int.Parse(_configuration["Jwt:RefreshTokenExpirationDays"] ?? "7");
        return DateTime.UtcNow.AddDays(expirationDays);
    }
}
