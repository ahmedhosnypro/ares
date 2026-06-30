using System;

namespace Backend.Application.DTOs.Inspection;

public record PendingAssignmentDto(
    Guid BookingId,
    string? BookingNumber,
    string CustomerName,
    string VehicleDisplayName,
    string InspectionType,
    DateTime InspectionDate,
    string BookingStatus
);
