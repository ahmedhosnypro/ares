using Backend.Application.DTOs.About;

namespace Backend.Application.Services;

public interface IAboutService
{
    Task<List<AboutSectionDto>> GetAllAsync(CancellationToken ct = default);
    Task<AboutSectionDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<AboutSectionDto> CreateAsync(CreateAboutSectionRequest request, CancellationToken ct = default);
    Task<AboutSectionDto> UpdateAsync(Guid id, UpdateAboutSectionRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
