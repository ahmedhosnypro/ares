using Backend.Application.DTOs.Terms;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/terms")]
public class TermsController : ControllerBase
{
    private readonly ITermsService _terms;
    public TermsController(ITermsService terms) => _terms = terms;

    [HttpGet]
    [ProducesResponseType(typeof(List<TermsSectionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] string? locale, [FromQuery] bool includeLocalizations = false, CancellationToken ct = default)
    {
        var effectiveLocale = includeLocalizations ? null : locale;
        return Ok(await _terms.GetAllAsync(effectiveLocale, ct));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TermsSectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, [FromQuery] string? locale, CancellationToken ct = default) =>
        Ok(await _terms.GetByIdAsync(id, locale, ct));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(TermsSectionDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateTermsSectionRequest request, CancellationToken ct)
    {
        var result = await _terms.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(TermsSectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTermsSectionRequest request, CancellationToken ct = default) =>
        Ok(await _terms.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _terms.DeleteAsync(id, ct);
        return NoContent();
    }
}
