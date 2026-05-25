using Backend.Application.DTOs.About;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/about")]
public class AboutController : ControllerBase
{
    private readonly IAboutService _about;
    public AboutController(IAboutService about) => _about = about;

    [HttpGet]
    [ProducesResponseType(typeof(List<AboutSectionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _about.GetAllAsync(ct));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AboutSectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct) =>
        Ok(await _about.GetByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(AboutSectionDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateAboutSectionRequest request, CancellationToken ct)
    {
        var result = await _about.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(AboutSectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAboutSectionRequest request, CancellationToken ct) =>
        Ok(await _about.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _about.DeleteAsync(id, ct);
        return NoContent();
    }
}
