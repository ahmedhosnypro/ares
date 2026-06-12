namespace Backend.Application.DTOs.Dashboard;

public record ChartDataPointDto(
    string Date,
    decimal Revenue,
    decimal PlatformRevenue,
    decimal SupplierRevenue,
    decimal Bookings,
    decimal Refunds,
    decimal NetRevenue
);
