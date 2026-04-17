using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core configuration for ApplicationUser — enforces column constraints
/// that mirror the FluentValidation rules and Zod schemas.
/// </summary>
public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        // FirstName / LastName — required, max 100 (mirrors [Required][MaxLength] on entity)
        builder.Property(u => u.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.LastName)
            .IsRequired()
            .HasMaxLength(100);

        // Status
        builder.Property(u => u.Status)
            .HasMaxLength(50);

        // Profile image URL — no hard length limit, stored as nvarchar(max)
        builder.Property(u => u.ProfileImage)
            .HasMaxLength(500);

        // Date of birth — nullable, no DB constraint beyond type
        builder.Property(u => u.DateOfBirth)
            .HasColumnType("date"); // store as DATE, not DATETIME2

        // Language / currency preferences — short codes, required with defaults
        builder.Property(u => u.LanguagePreference)
            .IsRequired()
            .HasMaxLength(10)
            .HasDefaultValue("en");

        builder.Property(u => u.CurrencyPreference)
            .IsRequired()
            .HasMaxLength(10)
            .HasDefaultValue("USD");

        // Emergency contact — optional, reasonable max lengths
        builder.Property(u => u.EmergencyContactName)
            .HasMaxLength(200);

        builder.Property(u => u.EmergencyContactPhone)
            .HasMaxLength(20);

        builder.Property(u => u.EmergencyContactRelationship)
            .HasMaxLength(50);

        // Audit timestamps
        builder.Property(u => u.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(u => u.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");
    }
}
