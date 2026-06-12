namespace Backend.Application.DTOs.Dashboard;

public record DashboardSummaryDto(
    int TotalUsers,
    int ActiveBookings,
    int PendingVerifications,
    int AvailableVehicles,
    int PendingInspections,
    int TotalCategories = 0,
    int ActivePromotions = 0,
    Dictionary<string, int>? VehiclesPerCategory = null
);
