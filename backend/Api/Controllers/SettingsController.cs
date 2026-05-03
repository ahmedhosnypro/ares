using Backend.Application.DTOs.Settings;
using Backend.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;

    public SettingsController(ISettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    [HttpGet("api/settings")]
    [ProducesResponseType(typeof(SettingsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettings(CancellationToken cancellationToken)
    {
        var settings = await _settingsService.GetSettingsAsync(cancellationToken);
        return Ok(settings);
    }

    [HttpPut("api/update-settings")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(SettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateSettings([FromBody] SettingsDto settings, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var updatedSettings = await _settingsService.UpdateSettingsAsync(settings, cancellationToken);
        return Ok(updatedSettings);
    }
}
