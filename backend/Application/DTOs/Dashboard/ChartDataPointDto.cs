namespace Backend.Application.DTOs.Dashboard;

public record ChartDataPointDto(
    string Date,
    decimal Revenue,
    decimal Bookings,
    decimal Refunds
);
