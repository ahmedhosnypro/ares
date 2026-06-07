namespace Backend.Application.DTOs.Dashboard;

public record RevenueOverviewDto(
    decimal TotalRevenue,
    decimal TotalBookings,
    decimal TotalRefunds,
    IReadOnlyList<ChartDataPointDto> ChartData
);
