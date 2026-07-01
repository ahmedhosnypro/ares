using System;

namespace Backend.Application.DTOs.UserManagement;

/// <summary>
/// DTO for supplier-specific details in user management operations
/// </summary>
public record SupplierDetailsDto(
    string? CompanyName,
    string? CommercialRegistration,
    string? TaxNumber,
    int VehiclesCount,
    int TotalBookings
);
