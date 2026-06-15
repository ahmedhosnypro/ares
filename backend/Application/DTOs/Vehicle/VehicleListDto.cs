namespace Backend.Application.DTOs.Vehicle;

/// <summary>
/// DTO for vehicle list item in search results.
///
/// Shape is shared between the public search endpoint and the Admin/Supplier
/// dashboard endpoint. Admin-specific fields are appended at the end as
/// nullable / default-valued positional parameters so existing call sites
/// (public search) keep compiling and existing serialized payloads stay readable.
/// </summary>
public record VehicleListDto(
    Guid VehicleId,
    string Make,
    string Model,
    string Category,
    decimal DailyRate,
    decimal? OriginalDailyRate,
    decimal? DiscountPercentage,
    string Currency,
    string ImageUrl,
    double Rating,
    int ReviewCount,
    double? Distance,
    bool Available,
    string? LocationCity,
    DateTime? CreatedAt = null,
    int? Year = null,
    string? Transmission = null,
    string? SupplierName = null,
    bool IsOnRental = false,
    string? AvailabilityStatus = null,
    string? LicensePlate = null,
    Guid? CategoryId = null,
    string? CategoryName = null);
