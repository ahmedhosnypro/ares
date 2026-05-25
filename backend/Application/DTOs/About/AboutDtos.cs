using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTOs.About;

public class AboutSectionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public int Order { get; set; }
    public string SectionType { get; set; } = null!;
    public DateTime UpdatedAt { get; set; }
}

public class CreateAboutSectionRequest
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = null!;
    [Required]
    public string Content { get; set; } = null!;
    public int Order { get; set; }
    [Required, MaxLength(50)]
    public string SectionType { get; set; } = "story";
}

public class UpdateAboutSectionRequest
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = null!;
    [Required]
    public string Content { get; set; } = null!;
    public int Order { get; set; }
    [Required, MaxLength(50)]
    public string SectionType { get; set; } = "story";
}
