using System;

namespace Backend.Application.DTOs.UserManagement;

/// <summary>
/// DTO for driver-specific details in user management operations
/// </summary>
public record DriverDetailsDto(
    string? LicenseNumber,
    string? LicenseExpiryDate,
    string? Availability,
    int AssignedBookings,
    int CompletedTrips
);
