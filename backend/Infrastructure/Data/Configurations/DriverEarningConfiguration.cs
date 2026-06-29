using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations;

public class DriverEarningConfiguration : IEntityTypeConfiguration<DriverEarning>
{
    public void Configure(EntityTypeBuilder<DriverEarning> builder)
    {
        builder.ToTable("driver_earnings");

        builder.HasOne(e => e.Booking)
            .WithOne(b => b.DriverEarning)
            .HasForeignKey<DriverEarning>(e => e.BookingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.DriverProfile)
            .WithMany(dp => dp.Earnings)
            .HasForeignKey(e => e.DriverProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Payout)
            .WithMany()
            .HasForeignKey(e => e.PayoutId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(e => e.BookingId)
            .IsUnique()
            .HasDatabaseName("IX_driver_earnings_BookingId");

        builder.HasIndex(e => e.DriverProfileId)
            .HasDatabaseName("IX_driver_earnings_DriverProfileId");
    }
}
