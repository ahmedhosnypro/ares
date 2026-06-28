using System;

namespace Backend.Application.DTOs.Dashboard;

public record RecentBookingDto(
    Guid BookingId,
    string BookingNumber,
    string CustomerName,
    string VehicleName,
    string? VehicleImage,
    DateTime BookingDate,
    string Status
);
