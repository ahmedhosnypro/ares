using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Api.Converters;

/// <summary>
/// Ensures all DateTime values with Kind == Utc serialize with a "Z" suffix,
/// and Kind == Unspecified values are treated as Utc (since all our DB values are UTC).
/// Without this converter, System.Text.Json omits the "Z" for Unspecified dates,
/// causing the frontend to interpret them as local time.
/// </summary>
public sealed class UtcDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetDateTime();

        // If the incoming JSON had no timezone info, treat as UTC
        if (value.Kind == DateTimeKind.Unspecified)
        {
            return DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }

        return value;
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        // Treat Unspecified as UTC — all our DB values are stored in UTC
        var normalized = value.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value;

        writer.WriteStringValue(normalized.ToString("O"));
    }
}

/// <summary>
/// Same logic for nullable DateTime fields.
/// </summary>
public sealed class UtcNullableDateTimeConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;

        var value = reader.GetDateTime();

        if (value.Kind == DateTimeKind.Unspecified)
        {
            return DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }

        return value;
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value is null)
        {
            writer.WriteNullValue();
            return;
        }

        var normalized = value.Value.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)
            : value.Value;

        writer.WriteStringValue(normalized.ToString("O"));
    }
}
