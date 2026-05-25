using Backend.Application.DTOs.About;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services;

public class AboutService : IAboutService
{
    private readonly IRepository<AboutSection> _repo;
    private readonly IApplicationDbContext _context;

    public AboutService(IRepository<AboutSection> repo, IApplicationDbContext context)
    {
        _repo = repo;
        _context = context;
    }

    public async Task<List<AboutSectionDto>> GetAllAsync(CancellationToken ct = default) =>
        await _context.AboutSections
            .OrderBy(a => a.Order)
            .Select(a => Map(a))
            .ToListAsync(ct);

    public async Task<AboutSectionDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var section = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"About section {id} not found.");
        return Map(section);
    }

    public async Task<AboutSectionDto> CreateAsync(CreateAboutSectionRequest request, CancellationToken ct = default)
    {
        var section = new AboutSection
        {
            Title = request.Title,
            Content = request.Content,
            Order = request.Order,
            SectionType = request.SectionType
        };
        await _repo.AddAsync(section, ct);
        await _repo.SaveChangesAsync(ct);
        return Map(section);
    }

    public async Task<AboutSectionDto> UpdateAsync(Guid id, UpdateAboutSectionRequest request, CancellationToken ct = default)
    {
        var section = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"About section {id} not found.");
        section.Title = request.Title;
        section.Content = request.Content;
        section.Order = request.Order;
        section.SectionType = request.SectionType;
        await _repo.UpdateAsync(section, ct);
        await _repo.SaveChangesAsync(ct);
        return Map(section);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var section = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"About section {id} not found.");
        await _repo.DeleteAsync(section, ct);
        await _repo.SaveChangesAsync(ct);
    }

    private static AboutSectionDto Map(AboutSection a) => new()
    {
        Id = a.Id,
        Title = a.Title,
        Content = a.Content,
        Order = a.Order,
        SectionType = a.SectionType,
        UpdatedAt = a.UpdatedAt
    };
}
