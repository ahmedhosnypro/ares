using Backend.Application.DTOs.Privacy;

namespace Backend.Application.Services;

public interface IPrivacyService
{
    Task<List<PrivacySectionDto>> GetAllAsync(string? locale = null, CancellationToken ct = default);
    Task<PrivacySectionDto> GetByIdAsync(Guid id, string? locale = null, CancellationToken ct = default);
    Task<PrivacySectionDto> CreateAsync(CreatePrivacySectionRequest request, CancellationToken ct = default);
    Task<PrivacySectionDto> UpdateAsync(Guid id, UpdatePrivacySectionRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
