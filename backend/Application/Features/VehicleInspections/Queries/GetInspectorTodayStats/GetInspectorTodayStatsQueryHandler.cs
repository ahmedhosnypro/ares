using Backend.Application.DTOs.Inspection;
using Backend.Application.Interfaces;
using Backend.Domain.Entities.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Features.VehicleInspections.Queries.GetInspectorTodayStats;

/// <summary>
/// Counts four key metrics for an inspector's dashboard:
///   1. CheckOuts — today's Pickup inspections not yet completed
///   2. CheckIns  — today's Return inspections not yet completed
///   3. Overdue   — any incomplete inspection whose scheduled time is in the past
///   4. CompletedToday — inspections completed (submitted) today
/// </summary>
public sealed class GetInspectorTodayStatsQueryHandler
    : IRequestHandler<GetInspectorTodayStatsQuery, InspectorTodayStatsDto>
{
    private readonly IApplicationDbContext _context;

    public GetInspectorTodayStatsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<InspectorTodayStatsDto> Handle(
        GetInspectorTodayStatsQuery request,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var tomorrowStart = todayStart.AddDays(1);

        // Base query: inspections assigned to this inspector
        var myInspections = _context.VehicleInspections
            .Where(i => i.InspectorId == request.InspectorId);

        // 1. Check-Outs: today's Pickup inspections that are still incomplete
        var checkOutsCount = await myInspections
            .Where(i => i.InspectionType == "Pickup"
                     && i.InspectionDate >= todayStart
                     && i.InspectionDate < tomorrowStart
                     && !i.IsSubmitted)
            .CountAsync(cancellationToken);

        // 2. Check-Ins: today's Return inspections that are still incomplete
        var checkInsCount = await myInspections
            .Where(i => i.InspectionType == "Return"
                     && i.InspectionDate >= todayStart
                     && i.InspectionDate < tomorrowStart
                     && !i.IsSubmitted)
            .CountAsync(cancellationToken);

        // 3. Overdue: any incomplete inspection whose scheduled time has passed
        var overdueCount = await myInspections
            .Where(i => !i.IsSubmitted
                     && i.InspectionDate < now)
            .CountAsync(cancellationToken);

        // 4. Completed today: inspections submitted today
        var completedTodayCount = await myInspections
            .Where(i => i.IsSubmitted
                     && i.SubmittedAt != null
                     && i.SubmittedAt >= todayStart
                     && i.SubmittedAt < tomorrowStart)
            .CountAsync(cancellationToken);

        return new InspectorTodayStatsDto(
            checkOutsCount,
            checkInsCount,
            overdueCount,
            completedTodayCount);
    }
}
