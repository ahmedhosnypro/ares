using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.UserManagement;

/// <summary>
/// Request DTO for creating a new user account
/// </summary>
public record CreateUserRequest(
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    string Email,

    [Required]
    [MinLength(6)]
    [MaxLength(100)]
    string Password,

    [Required]
    [MaxLength(100)]
    string FirstName,

    [Required]
    [MaxLength(100)]
    string LastName,

    [Phone]
    [MaxLength(20)]
    string? PhoneNumber,

    [MaxLength(50)]
    string? Status,

    List<string>? Roles,

    string? DateOfBirth = null
);