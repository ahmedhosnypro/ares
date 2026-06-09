namespace Backend.Application.DTOs.Inspection;

/// <summary>
/// Snapshot of today's KPI metrics for an inspector's dashboard.
/// </summary>
public sealed record InspectorTodayStatsDto(
    int CheckOutsCount,
    int CheckInsCount,
    int OverdueCount,
    int CompletedTodayCount);
