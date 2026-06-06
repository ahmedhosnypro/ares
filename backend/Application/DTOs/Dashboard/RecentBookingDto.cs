namespace Backend.Application.DTOs.Dashboard;

public record RecentBookingDto(
    string Id,
    string Customer,
    string Car,
    string Date,
    string Status,
    decimal Amount
);
