namespace Backend.Application.DTOs.Inspection;

/// <summary>
/// Enriched task record returned to the Inspector mobile dashboard.
/// Contains vehicle, customer and scheduling information so the
/// inspector can act (call, navigate, open form) from a single card.
/// </summary>
public sealed record InspectorTaskDto(
    Guid     InspectionId,

    /// <summary>"CheckOut" (Pickup) or "CheckIn" (Return).</summary>
    string   InspectionType,

    string   VehicleName,
    string   PlateNumber,

    string   CustomerName,
    string   CustomerPhone,

    DateTime ScheduledTime,

    /// <summary>
    /// Human-readable address for the pickup or drop-off location.
    /// Used to build the Google Maps link on the client.
    /// </summary>
    string   Address
);
