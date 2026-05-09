namespace Backend.Application.DTOs.Vehicle;

/// <summary>
/// Body of <c>PATCH /api/supplier/vehicles/{id}/availability</c>.
///
/// A boolean is intentionally enough for the v1 toggle: the service maps it
/// to <c>"Available"</c> / <c>"Unavailable"</c> so the supplier can't
/// accidentally land the vehicle in some half-state like "FullyBooked".
/// </summary>
/// <param name="Available">
/// <c>true</c> ⇒ make the vehicle available to renters;
/// <c>false</c> ⇒ remove from public listings.
/// </param>
public record SupplierAvailabilityToggleRequest(bool Available);
