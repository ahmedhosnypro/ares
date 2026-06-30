namespace Backend.Application.DTOs.Booking;

/// <summary>
/// Lightweight customer item for the create-booking customer picker.
/// </summary>
public record CustomerPickerItemDto(
    Guid Id,
    string FullName,
    string? Email,
    string? Phone,
    bool HasApprovedLicense = false);

/// <summary>
/// Lightweight available-vehicle item for the create-booking vehicle picker.
/// Only vehicles that pass the availability/active filters reach this DTO.
/// </summary>
public record VehiclePickerItemDto(
    Guid Id,
    string Name,
    string? Thumbnail,
    string? PlateNumber,
    decimal? DailyRate,
    string? SupplierName);
