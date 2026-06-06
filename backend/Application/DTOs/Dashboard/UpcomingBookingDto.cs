namespace Backend.Application.DTOs.Dashboard;

public record UpcomingBookingDto(
    string Id,
    string Customer,
    string Car,
    string PickupDate,
    string ReturnDate
);
