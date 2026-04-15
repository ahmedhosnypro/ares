namespace Backend.Application.DTOs.Public;

public record PublicSupplierDto(
    Guid Id,
    string CompanyName,
    string Email,
    string? PhoneNumber,
    string? ProfileImage,
    string? Status,
    string? CommercialRegistrationNumber,
    DateTime CreatedAt);
