namespace Backend.Application.DTOs.Dashboard;

public record DashboardSummaryDto(
    int TotalUsers,
    int TotalSuppliers,
    int TotalVehicles,
    int TotalBookings,
    int PendingBookings,
    decimal TotalRevenue
);
