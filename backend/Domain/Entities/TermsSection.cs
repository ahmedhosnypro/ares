namespace Backend.Domain.Entities;

public class TermsSection : AuditableEntity
{
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public int Order { get; set; }
}
