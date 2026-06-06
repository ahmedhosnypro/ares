namespace Backend.Application.DTOs.Dashboard;

public record LiveTrackingDto(
    int TotalActiveRentals,
    int ConnectedPhones
);
