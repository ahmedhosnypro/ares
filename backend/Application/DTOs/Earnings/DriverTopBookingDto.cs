using System;

namespace Backend.Application.DTOs.Earnings
{
    /// <summary>
    /// Top 5 highest-earning bookings for the driver.
    /// </summary>
    public record DriverTopBookingDto(
        Guid BookingId,
        string BookingNumber,
        string VehicleName,
        string CustomerName,
        decimal NetEarning,
        DateTime CompletedAt
    );
}