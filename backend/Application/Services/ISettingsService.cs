using Backend.Application.DTOs.Settings;

namespace Backend.Application.Services;

public interface ISettingsService
{
    Task<SettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default);
    Task<SettingsDto> UpdateSettingsAsync(SettingsDto settings, CancellationToken cancellationToken = default);
}
