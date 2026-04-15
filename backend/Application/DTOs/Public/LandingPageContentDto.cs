namespace Backend.Application.DTOs.Public;

public record LandingPageContentDto(
    string HeroKicker,
    string HeroTitle,
    string HeroDescription,
    IReadOnlyList<LandingValuePropDto> ValueProps,
    IReadOnlyList<FaqItemDto> FaqItems,
    SupportContentDto Support);

public record LandingValuePropDto(
    string Title,
    string Description,
    string Accent);

public record FaqItemDto(
    string Question,
    string Answer);

public record SupportContentDto(
    string Title,
    string Description,
    string ActionLabel);