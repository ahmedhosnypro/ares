using Backend.Application.DTOs.Inspection;
using MediatR;

namespace Backend.Application.Features.VehicleInspections.Queries.GetInspectorTasks;

/// <summary>
/// Returns today's enriched task list for the given inspector.
/// Each item carries vehicle, customer and scheduling data so the
/// mobile dashboard can render a fully actionable card without
/// additional round-trips.
/// </summary>
public sealed class GetInspectorTasksQuery : IRequest<IReadOnlyList<InspectorTaskDto>>
{
    public Guid InspectorId { get; }

    public GetInspectorTasksQuery(Guid inspectorId)
    {
        InspectorId = inspectorId;
    }
}
