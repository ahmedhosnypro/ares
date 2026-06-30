using Backend.Application.DTOs.Inspection;
using MediatR;
using System.Collections.Generic;

namespace Backend.Application.Features.VehicleInspections.Queries.GetPendingAssignments;

public record GetPendingAssignmentsQuery : IRequest<IReadOnlyList<PendingAssignmentDto>>
{
}
