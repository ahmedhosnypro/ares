namespace Backend.Application.DTOs.Vehicle;

/// <summary>
/// Request DTO for vehicle search with filters and pagination
/// </summary>
public record VehicleSearchRequest(
    Guid PickupLocationId,
    Guid? ReturnLocationId,
    DateTime PickupDate,
    DateTime ReturnDate,
    string? Category = null,
    string? Transmission = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    string? SortBy = null,
    int Page = 1,
    int Limit = 20,
    Guid? ExcludeUserId = null);
