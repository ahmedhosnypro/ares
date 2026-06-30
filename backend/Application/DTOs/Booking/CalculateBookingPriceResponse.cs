namespace Backend.Application.DTOs.Booking;

/// <summary>
/// Response DTO for calculated booking price
/// </summary>
public record CalculateBookingPriceResponse(
    int TotalDays,
    decimal VehicleFee,
    decimal DriverFee,
    decimal GrandTotal
);
