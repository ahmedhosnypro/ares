namespace Backend.Application.DTOs.Dashboard;

public record DashboardSummaryDto(
    int TotalUsers,
    int ActiveBookings,
    int PendingVerifications,
    int AvailableVehicles,
    int PendingInspections,
    Dictionary<string, int>? VehiclesPerCategory = null
);
