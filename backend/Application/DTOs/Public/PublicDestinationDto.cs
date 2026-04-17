namespace Backend.Application.DTOs.Public;

public record PublicDestinationDto(
    Guid Id,
    string City,
    string Country,
    string? ImageUrl,
    decimal StartingPrice,
    int VehicleCount);
