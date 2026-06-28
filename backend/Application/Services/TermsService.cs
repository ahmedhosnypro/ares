using Backend.Application.DTOs;
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

    public async Task<List<TermsSectionDto>> GetAllAsync(string? locale = null, CancellationToken ct = default) =>
        await _context.TermsSections
            .OrderBy(t => t.Order)
            .Select(t => Map(t, locale))
            .ToListAsync(ct);

    public async Task<TermsSectionDto> GetByIdAsync(Guid id, string? locale = null, CancellationToken ct = default)
    {
        var section = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Terms section {id} not found.");
        return Map(section, locale);
    }

    public async Task<TermsSectionDto> CreateAsync(CreateTermsSectionRequest request, CancellationToken ct = default)
    {
        var section = new TermsSection
        {
            Title = request.Title,
            Content = request.Content,
            Order = request.Order,
            Localizations = MapLocalizations(request.Localizations)
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
        section.Localizations = MapLocalizations(request.Localizations);
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

    private static TermsSectionDto Map(TermsSection t, string? locale = null)
    {
        var (title, content) = ResolveLocale(t, locale);
        return new()
        {
            Id = t.Id,
            Title = title,
            Content = content,
            Order = t.Order,
            UpdatedAt = t.UpdatedAt,
            Localizations = string.IsNullOrEmpty(locale)
                ? t.Localizations.ToDictionary(k => k.Key, v => new SectionLocalizationDto { Title = v.Value.Title, Content = v.Value.Content })
                : new()
        };
    }

    private static (string Title, string Content) ResolveLocale(TermsSection t, string? locale)
    {
        if (string.IsNullOrEmpty(locale)) return (t.Title, t.Content);
        if (t.Localizations.TryGetValue(locale, out var loc) && !string.IsNullOrEmpty(loc.Title))
            return (loc.Title, loc.Content);
        return (t.Title, t.Content);
    }

    private static Dictionary<string, SectionLocalization> MapLocalizations(Dictionary<string, SectionLocalizationDto> dto)
    {
        return dto.ToDictionary(k => k.Key, v => new SectionLocalization { Title = v.Value.Title, Content = v.Value.Content });
    }
}
