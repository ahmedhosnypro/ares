namespace Backend.Application.DTOs.Vehicle;

/// <summary>
/// DTO for updating a vehicle image
/// </summary>
public record VehicleImageUpdateDto(string Url, bool IsPrimary);

/// <summary>
/// DTO for updating a vehicle feature
/// </summary>
public record VehicleFeatureUpdateDto(string FeatureName, string? FeatureDescription = null, string? FeatureCategory = "General");
