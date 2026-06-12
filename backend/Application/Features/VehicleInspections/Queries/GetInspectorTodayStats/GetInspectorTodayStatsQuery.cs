using Backend.Application.DTOs.Inspection;
using MediatR;

namespace Backend.Application.Features.VehicleInspections.Queries.GetInspectorTodayStats;

/// <summary>
/// Retrieves today's dashboard KPI stats for the given inspector.
/// </summary>
public sealed class GetInspectorTodayStatsQuery : IRequest<InspectorTodayStatsDto>
{
    public Guid InspectorId { get; }

    public GetInspectorTodayStatsQuery(Guid inspectorId)
    {
        InspectorId = inspectorId;
    }
}
