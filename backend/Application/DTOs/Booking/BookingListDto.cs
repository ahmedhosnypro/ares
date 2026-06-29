using Backend.Application.DTOs.Common;

namespace Backend.Application.DTOs.Booking;

/// <summary>
/// DTO for booking list item
/// </summary>
public record BookingListDto(
    Guid Id,
    string? BookingNumber,
    string? CustomerName,
    int? TotalDays,
    VehicleBasicDto Car,
    SupplierDto Supplier,
    DriverDto? Driver,
    LocationDto PickupLocation,
    LocationDto DropOffLocation,
    DateTime From,
    DateTime To,
    decimal Price,
    string Status,
    bool PayLater,
    string? PaymentStatus = null,
    string? PaymentMethod = null,
    /// <summary>UTC timestamp when this booking record was created in the database.</summary>
    DateTime? CreatedAt = null,
    DateTime? UpdatedAt = null,
    Guid? ApprovedBy = null,
    DateTime? ApprovedAt = null,
    string? RejectionReason = null);
