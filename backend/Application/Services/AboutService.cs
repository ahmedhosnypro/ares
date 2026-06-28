using Backend.Application.DTOs;
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

    public async Task<List<AboutSectionDto>> GetAllAsync(string? locale = null, CancellationToken ct = default) =>
        await _context.AboutSections
            .OrderBy(a => a.Order)
            .Select(a => Map(a, locale))
            .ToListAsync(ct);

    public async Task<AboutSectionDto> GetByIdAsync(Guid id, string? locale = null, CancellationToken ct = default)
    {
        var section = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"About section {id} not found.");
        return Map(section, locale);
    }

    public async Task<AboutSectionDto> CreateAsync(CreateAboutSectionRequest request, CancellationToken ct = default)
    {
        var section = new AboutSection
        {
            Title = request.Title,
            Content = request.Content,
            Order = request.Order,
            SectionType = request.SectionType,
            Localizations = MapLocalizations(request.Localizations)
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
        section.Localizations = MapLocalizations(request.Localizations);
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

    private static AboutSectionDto Map(AboutSection a, string? locale = null)
    {
        var (title, content) = ResolveLocale(a, locale);
        return new()
        {
            Id = a.Id,
            Title = title,
            Content = content,
            Order = a.Order,
            SectionType = a.SectionType,
            UpdatedAt = a.UpdatedAt,
            Localizations = string.IsNullOrEmpty(locale)
                ? a.Localizations.ToDictionary(k => k.Key, v => new SectionLocalizationDto { Title = v.Value.Title, Content = v.Value.Content })
                : new()
        };
    }

    private static (string Title, string Content) ResolveLocale(AboutSection a, string? locale)
    {
        if (string.IsNullOrEmpty(locale)) return (a.Title, a.Content);
        if (a.Localizations.TryGetValue(locale, out var loc) && !string.IsNullOrEmpty(loc.Title))
            return (loc.Title, loc.Content);
        return (a.Title, a.Content);
    }

    private static Dictionary<string, SectionLocalization> MapLocalizations(Dictionary<string, SectionLocalizationDto> dto)
    {
        return dto.ToDictionary(k => k.Key, v => new SectionLocalization { Title = v.Value.Title, Content = v.Value.Content });
    }
}
