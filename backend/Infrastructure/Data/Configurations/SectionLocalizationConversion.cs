using System.Text.Json;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Backend.Infrastructure.Data.Configurations;

internal static class SectionLocalizationConversion
{
    public static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    public static readonly ValueComparer<Dictionary<string, SectionLocalization>> Comparer = new(
        (a, b) => a == null && b == null || a != null && b != null && a.SequenceEqual(b),
        v => v == null ? 0 : v.Aggregate(0, (h, kv) => HashCode.Combine(h, kv.Key, kv.Value.Title, kv.Value.Content)),
        v => v == null ? new() : new Dictionary<string, SectionLocalization>(v))!;
}
