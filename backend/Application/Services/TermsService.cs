using Backend.Application.DTOs.Terms;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services;

public class TermsService : ITermsService
{
    private readonly IRepository<TermsSection> _repo;
    private readonly IApplicationDbContext _context;

    public TermsService(IRepository<TermsSection> repo, IApplicationDbContext context)
    {
        _repo = repo;
        _context = context;
    }

    public async Task<List<TermsSectionDto>> GetAllAsync(CancellationToken ct = default) =>
        await _context.TermsSections
            .OrderBy(t => t.Order)
            .Select(t => Map(t))
            .ToListAsync(ct);

    public async Task<TermsSectionDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var section = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Terms section {id} not found.");
        return Map(section);
    }

    public async Task<TermsSectionDto> CreateAsync(CreateTermsSectionRequest request, CancellationToken ct = default)
    {
        var section = new TermsSection
        {
            Title = request.Title,
            Content = request.Content,
            Order = request.Order
        };
        await _repo.AddAsync(section, ct);
        await _repo.SaveChangesAsync(ct);
        return Map(section);
    }

    public async Task<TermsSectionDto> UpdateAsync(Guid id, UpdateTermsSectionRequest request, CancellationToken ct = default)
    {
        var section = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Terms section {id} not found.");
        section.Title = request.Title;
        section.Content = request.Content;
        section.Order = request.Order;
        await _repo.UpdateAsync(section, ct);
        await _repo.SaveChangesAsync(ct);
        return Map(section);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var section = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Terms section {id} not found.");
        await _repo.DeleteAsync(section, ct);
        await _repo.SaveChangesAsync(ct);
    }

    private static TermsSectionDto Map(TermsSection t) => new()
    {
        Id = t.Id,
        Title = t.Title,
        Content = t.Content,
        Order = t.Order,
        UpdatedAt = t.UpdatedAt
    };
}
