namespace Backend.Application.DTOs.Dashboard;

public record BookingsByStatusDto(
    int Pending,
    int Confirmed,
    int Active,
    int Completed,
    int Cancelled
);
