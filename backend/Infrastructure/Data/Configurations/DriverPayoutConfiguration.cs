using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations;

public class DriverPayoutConfiguration : IEntityTypeConfiguration<DriverPayout>
{
    public void Configure(EntityTypeBuilder<DriverPayout> builder)
    {
        builder.ToTable("driver_payouts");

        builder.HasOne(e => e.DriverProfile)
            .WithMany(dp => dp.Payouts)
            .HasForeignKey(e => e.DriverProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(e => e.DriverProfileId)
            .HasDatabaseName("IX_driver_payouts_DriverProfileId");
    }
}
