using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    /// <summary>
    /// EF Core configuration for <see cref="DriverProfile"/>. Mirrors the
    /// conventions used by <c>DriverConfiguration</c> (the legacy
    /// customer-license entity) so the codebase stays consistent.
    /// </summary>
    public class DriverProfileConfiguration : IEntityTypeConfiguration<DriverProfile>
    {
        public void Configure(EntityTypeBuilder<DriverProfile> builder)
        {
            builder.ToTable("driver_profiles");

            builder.HasKey(p => p.Id);

            // One DriverProfile per ApplicationUser. Restrict on delete so
            // an accidental user delete doesn't cascade-remove driver data
            // (mirrors the legacy Driver entity).
            builder
                .HasOne(p => p.User)
                .WithOne()
                .HasForeignKey<DriverProfile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder
                .HasIndex(p => p.UserId)
                .IsUnique()
                .HasDatabaseName("IX_driver_profiles_UserId");

            // Persist enums as strings — safer for migrations / debugging
            // and matches Booking.Status which is also stored as a string.
            builder
                .Property(p => p.Status)
                .HasConversion<string>()
                .HasMaxLength(30)
                .HasDefaultValue(DriverProfileStatus.Incomplete);

            builder
                .Property(p => p.Availability)
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(DriverAvailability.Unavailable);

            builder
                .Property(p => p.IsActive)
                .HasDefaultValue(true);

            // Optimistic-concurrency token (SQL Server rowversion). Guards
            // every assignment mutation against concurrent driver selection.
            builder
                .Property(p => p.RowVersion)
                .IsRowVersion();

            // Unique filtered index on LicenseNumber — only enforced for
            // rows where a license number has been submitted. Allows many
            // Incomplete profiles (LicenseNumber NULL) to coexist.
            builder
                .HasIndex(p => p.LicenseNumber)
                .IsUnique()
                .HasFilter("[LicenseNumber] IS NOT NULL")
                .HasDatabaseName("IX_driver_profiles_LicenseNumber");

            // Composite index for the eligibility scan (Phase 4 + 6):
            //   WHERE Status='Verified' AND Availability='Available' AND IsActive=1
            builder
                .HasIndex(p => new { p.Status, p.Availability, p.IsActive })
                .HasDatabaseName("IX_driver_profiles_Status_Availability_IsActive");
        }
    }
}
