using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.Privacy;

public class PrivacySectionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public int Order { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Dictionary<string, SectionLocalizationDto> Localizations { get; set; } = new();
}

public class CreatePrivacySectionRequest
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = null!;
    [Required]
    public string Content { get; set; } = null!;
    public int Order { get; set; }
    public Dictionary<string, SectionLocalizationDto> Localizations { get; set; } = new();
}

public class UpdatePrivacySectionRequest
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = null!;
    [Required]
    public string Content { get; set; } = null!;
    public int Order { get; set; }
    public Dictionary<string, SectionLocalizationDto> Localizations { get; set; } = new();
}
