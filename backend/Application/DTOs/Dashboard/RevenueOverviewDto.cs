namespace Backend.Application.DTOs.Dashboard;

public record RevenueOverviewDto(
    decimal TotalRevenue,
    decimal PlatformRevenue,
    decimal SupplierRevenue,
    decimal TotalBookings,
    decimal TotalRefunds,
    decimal NetRevenue,
    IReadOnlyList<ChartDataPointDto> ChartData
);
