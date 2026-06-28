using Backend.Application.DTOs;
using Backend.Application.DTOs.Privacy;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services;

public class PrivacyService : IPrivacyService
{
    private readonly IRepository<PrivacySection> _repo;
    private readonly IApplicationDbContext _context;

    public PrivacyService(IRepository<PrivacySection> repo, IApplicationDbContext context)
    {
        _repo = repo;
        _context = context;
    }

    public async Task<List<PrivacySectionDto>> GetAllAsync(string? locale = null, CancellationToken ct = default) =>
        await _context.PrivacySections
            .OrderBy(p => p.Order)
            .Select(p => Map(p, locale))
            .ToListAsync(ct);

    public async Task<PrivacySectionDto> GetByIdAsync(Guid id, string? locale = null, CancellationToken ct = default)
    {
        var section = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Privacy section {id} not found.");
        return Map(section, locale);
    }

    public async Task<PrivacySectionDto> CreateAsync(CreatePrivacySectionRequest request, CancellationToken ct = default)
    {
        var section = new PrivacySection
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

    public async Task<PrivacySectionDto> UpdateAsync(Guid id, UpdatePrivacySectionRequest request, CancellationToken ct = default)
    {
        var section = await _repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Privacy section {id} not found.");
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
            ?? throw new NotFoundException($"Privacy section {id} not found.");
        await _repo.DeleteAsync(section, ct);
        await _repo.SaveChangesAsync(ct);
    }

    private static PrivacySectionDto Map(PrivacySection p, string? locale = null)
    {
        var (title, content) = ResolveLocale(p, locale);
        return new()
        {
            Id = p.Id,
            Title = title,
            Content = content,
            Order = p.Order,
            UpdatedAt = p.UpdatedAt,
            Localizations = string.IsNullOrEmpty(locale)
                ? p.Localizations.ToDictionary(k => k.Key, v => new SectionLocalizationDto { Title = v.Value.Title, Content = v.Value.Content })
                : new()
        };
    }

    private static (string Title, string Content) ResolveLocale(PrivacySection p, string? locale)
    {
        if (string.IsNullOrEmpty(locale)) return (p.Title, p.Content);
        if (p.Localizations.TryGetValue(locale, out var loc) && !string.IsNullOrEmpty(loc.Title))
            return (loc.Title, loc.Content);
        return (p.Title, p.Content);
    }

    private static Dictionary<string, SectionLocalization> MapLocalizations(Dictionary<string, SectionLocalizationDto> dto)
    {
        return dto.ToDictionary(k => k.Key, v => new SectionLocalization { Title = v.Value.Title, Content = v.Value.Content });
    }
}
