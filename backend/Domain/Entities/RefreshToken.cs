using System.ComponentModel.DataAnnotations;

namespace Backend.Domain.Entities;

/// <summary>
/// Represents a refresh token for JWT authentication with rotation support
/// </summary>
public class RefreshToken
{
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// The actual refresh token value (hashed)
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// User ID this token belongs to
    /// </summary>
    [Required]
    public Guid UserId { get; set; }

    /// <summary>
    /// When the token expires
    /// </summary>
    [Required]
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// When the token was created
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// IP address that created this token
    /// </summary>
    [MaxLength(45)]
    public string? CreatedByIp { get; set; }

    /// <summary>
    /// When the token was revoked (if applicable)
    /// </summary>
    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// IP address that revoked this token
    /// </summary>
    [MaxLength(45)]
    public string? RevokedByIp { get; set; }

    /// <summary>
    /// Token that replaced this one (for rotation tracking)
    /// </summary>
    [MaxLength(500)]
    public string? ReplacedByToken { get; set; }

    /// <summary>
    /// Reason for revocation
    /// </summary>
    [MaxLength(200)]
    public string? ReasonRevoked { get; set; }

    /// <summary>
    /// Navigation property to user
    /// </summary>
    public ApplicationUser User { get; set; } = null!;

    // Helper properties
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt != null;
    public bool IsActive => !IsRevoked && !IsExpired;
}
