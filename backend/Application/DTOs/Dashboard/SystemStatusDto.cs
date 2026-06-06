namespace Backend.Application.DTOs.Dashboard;

public record SystemMetricDto(
    string Label,
    string Value,
    int Amount,
    string Color
);

public record SystemStatusDto(
    bool IsOperational,
    string Message,
    IReadOnlyList<SystemMetricDto> Metrics
);
