using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Backend.Application.DTOs.UserManagement;

/// <summary>
/// DTO for user management operations
/// </summary>
public record UserManagementDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string? PhoneNumber,
    bool EmailConfirmed,
    bool PhoneNumberConfirmed,
    string? Status,
    List<string> Roles,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string? DateOfBirth = null,
    string? AvatarUrl = null,
    DriverDetailsDto? DriverDetails = null,
    SupplierDetailsDto? SupplierDetails = null
);