namespace Backend.Domain.Entities;

public class PrivacySection : AuditableEntity
{
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public int Order { get; set; }
    public Dictionary<string, SectionLocalization> Localizations { get; set; } = new();
}
