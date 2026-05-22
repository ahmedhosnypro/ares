using System.ComponentModel.DataAnnotations;

using System.Text.Json.Serialization;

namespace Backend.Application.DTOs.Settings;

public class SettingsDto
{
    [JsonPropertyName("_id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string Language { get; set; } = "en";

    [Required]
    public string Currency { get; set; } = "USD";
}
