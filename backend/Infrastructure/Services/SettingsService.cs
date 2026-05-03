using System.Text.Json;
using Backend.Application.DTOs.Settings;
using Backend.Application.Services;

namespace Backend.Infrastructure.Services;

public class SettingsService : ISettingsService
{
    private readonly string _settingsFilePath;
    private static readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

    public SettingsService()
    {
        // Store settings in a json file in the application directory
        _settingsFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app-settings.json");
    }

    public async Task<SettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        await _semaphore.WaitAsync(cancellationToken);
        try
        {
            if (!File.Exists(_settingsFilePath))
            {
                return new SettingsDto { Language = "en", Currency = "USD" };
            }

            var json = await File.ReadAllTextAsync(_settingsFilePath, cancellationToken);
            var settings = JsonSerializer.Deserialize<SettingsDto>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            return settings ?? new SettingsDto { Language = "en", Currency = "USD" };
        }
        catch (Exception)
        {
            // On error, return defaults
            return new SettingsDto { Language = "en", Currency = "USD" };
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<SettingsDto> UpdateSettingsAsync(SettingsDto settings, CancellationToken cancellationToken = default)
    {
        await _semaphore.WaitAsync(cancellationToken);
        try
        {
            var json = JsonSerializer.Serialize(settings, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(_settingsFilePath, json, cancellationToken);
            return settings;
        }
        finally
        {
            _semaphore.Release();
        }
    }
}
