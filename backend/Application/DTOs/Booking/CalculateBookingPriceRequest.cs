namespace Backend.Application.DTOs.Booking;

/// <summary>
/// Request DTO for calculating booking price dynamically
/// </summary>
public record CalculateBookingPriceRequest(
    Guid VehicleId,
    DateTime PickupDate,
    DateTime ReturnDate,
    Guid? DriverProfileId = null
);
