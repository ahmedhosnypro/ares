namespace Backend.Domain.Entities;

public class AboutSection : AuditableEntity
{
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public int Order { get; set; }
    public string SectionType { get; set; } = "story";
}
