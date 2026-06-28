using Backend.Application.DTOs.Privacy;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/privacy")]
public class PrivacyController : ControllerBase
{
    private readonly IPrivacyService _privacy;
    public PrivacyController(IPrivacyService privacy) => _privacy = privacy;

    [HttpGet]
    [ProducesResponseType(typeof(List<PrivacySectionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] string? locale, [FromQuery] bool includeLocalizations = false, CancellationToken ct = default)
    {
        var effectiveLocale = includeLocalizations ? null : locale;
        return Ok(await _privacy.GetAllAsync(effectiveLocale, ct));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PrivacySectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, [FromQuery] string? locale, CancellationToken ct = default) =>
        Ok(await _privacy.GetByIdAsync(id, locale, ct));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PrivacySectionDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreatePrivacySectionRequest request, CancellationToken ct)
    {
        var result = await _privacy.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PrivacySectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePrivacySectionRequest request, CancellationToken ct = default) =>
        Ok(await _privacy.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _privacy.DeleteAsync(id, ct);
        return NoContent();
    }
}
