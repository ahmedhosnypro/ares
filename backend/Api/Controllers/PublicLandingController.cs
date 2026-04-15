using Backend.Application.DTOs.Public;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/public/landing")]
public class PublicLandingController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public PublicLandingController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet]
    [ProducesResponseType(typeof(LandingPageContentDto), StatusCodes.Status200OK)]
    public ActionResult<LandingPageContentDto> Get()
    {
        var landingSection = _configuration.GetSection("LandingPage");
        var content = landingSection.Get<LandingPageContentDto>() ?? GetFallbackContent();
        return Ok(content);
    }

    private static LandingPageContentDto GetFallbackContent()
    {
        return new LandingPageContentDto(
            HeroKicker: "Business-first car rental",
            HeroTitle: "Find the right car without dead ends.",
            HeroDescription: "Real suppliers, seeded inventory, and local image storage backed by the API.",
            ValueProps: new[]
            {
                new LandingValuePropDto("Immediate results", "Seeded inventory is ready on first load.", "Search live"),
                new LandingValuePropDto("Trusted suppliers", "Public supplier cards come from backend data.", "Partner network"),
                new LandingValuePropDto("Clear pricing", "Search and featured cards stay in sync with the API.", "No guessing"),
            },
            FaqItems: new[]
            {
                new FaqItemDto("Is the landing page dynamic?", "Yes. Supplier, vehicle, and location sections are backed by API data."),
                new FaqItemDto("Where are images stored?", "Locally on the ASP.NET Core server under wwwroot/uploads."),
                new FaqItemDto("Does the demo work immediately?", "Yes. The seeder creates the demo graph on startup when enabled."),
            },
            Support: new SupportContentDto("Need help choosing?", "Use the search strip or contact the team for guidance on the best match.", "Contact support"));
    }
}
