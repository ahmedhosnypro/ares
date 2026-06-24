using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Inspection;

/// <summary>
/// Admin payload to assign an inspector to a booking. The
/// <see cref="InspectorUserId"/> must refer to the ApplicationUser ID of an
/// active inspector (not the Inspector profile ID).
/// </summary>
public record AssignInspectorRequest(
    [Required] Guid InspectorUserId,
    [Required] string InspectionType = "Pickup"
);
