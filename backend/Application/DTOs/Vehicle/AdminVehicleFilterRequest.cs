namespace Backend.Application.DTOs.Vehicle;

/// <summary>
/// Request DTO for filtering vehicles in the admin/supplier dashboard
/// </summary>
/// <param name="Suppliers">List of supplier IDs to filter by (Admin only)</param>
/// <param name="Keyword">Search term to filter by Make or Model</param>
public record AdminVehicleFilterRequest(
    List<Guid>? Suppliers,
    string? Keyword
);
