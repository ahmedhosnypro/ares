namespace Backend.Application.DTOs.UserManagement;

public record UserManagementListResponse(
    List<UserManagementDto> Items,
    int CurrentPage,
    int PageSize,
    int TotalCount,
    int TotalPages,
    UserStatsDto Stats
);
