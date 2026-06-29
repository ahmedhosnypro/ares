using System.Text.Json;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations;

public class PrivacySectionConfiguration : IEntityTypeConfiguration<PrivacySection>
{
    public void Configure(EntityTypeBuilder<PrivacySection> builder)
    {
        builder.ToTable("PrivacySections");

        builder.Property(p => p.Localizations)
            .HasColumnType("nvarchar(max)")
            .HasConversion(
                v => JsonSerializer.Serialize(v, SectionLocalizationConversion.JsonOptions),
                v => string.IsNullOrWhiteSpace(v)
                    ? new()
                    : JsonSerializer.Deserialize<Dictionary<string, SectionLocalization>>(v, SectionLocalizationConversion.JsonOptions) ?? new()
            )
            .Metadata.SetValueComparer(SectionLocalizationConversion.Comparer);
    }
}
