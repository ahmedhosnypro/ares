namespace Backend.Application.DTOs.Common;

/// <summary>
/// DTO for supplier information
/// </summary>
public record SupplierDto(
    Guid Id,
    string FullName,
    string? Name = null,
    string? Email = null,
    string? Phone = null,
    string? CompanyName = null);