namespace Backend.Application.DTOs.UserManagement;

public record UserStatsDto(
    int TotalUsers,
    int Customers,
    int Suppliers,
    int Drivers,
    int Inspectors,
    int BlockedUsers
);
