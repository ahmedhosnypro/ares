using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Terms;

public class TermsSectionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public int Order { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Dictionary<string, SectionLocalizationDto> Localizations { get; set; } = new();
}

public class CreateTermsSectionRequest
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = null!;
    [Required]
    public string Content { get; set; } = null!;
    public int Order { get; set; }
    public Dictionary<string, SectionLocalizationDto> Localizations { get; set; } = new();
}

public class UpdateTermsSectionRequest
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = null!;
    [Required]
    public string Content { get; set; } = null!;
    public int Order { get; set; }
    public Dictionary<string, SectionLocalizationDto> Localizations { get; set; } = new();
}
