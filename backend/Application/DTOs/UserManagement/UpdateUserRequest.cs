using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.UserManagement;

/// <summary>
/// Request DTO for updating an existing user account
/// </summary>
public record UpdateUserRequest(
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