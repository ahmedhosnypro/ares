using Backend.Application.DTOs.Terms;

namespace Backend.Application.Services;

public interface ITermsService
{
    Task<List<TermsSectionDto>> GetAllAsync(CancellationToken ct = default);
    Task<TermsSectionDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<TermsSectionDto> CreateAsync(CreateTermsSectionRequest request, CancellationToken ct = default);
    Task<TermsSectionDto> UpdateAsync(Guid id, UpdateTermsSectionRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
