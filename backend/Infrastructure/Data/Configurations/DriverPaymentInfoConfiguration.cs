using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations;

public class DriverPaymentInfoConfiguration : IEntityTypeConfiguration<DriverPaymentInfo>
{
    public void Configure(EntityTypeBuilder<DriverPaymentInfo> builder)
    {
        builder.ToTable("driver_payment_info");

        builder.HasOne(e => e.DriverProfile)
            .WithOne(dp => dp.PaymentInfo)
            .HasForeignKey<DriverPaymentInfo>(e => e.DriverProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(e => e.PayoutMethod)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(e => e.DriverProfileId)
            .IsUnique()
            .HasDatabaseName("IX_driver_payment_info_DriverProfileId");
    }
}
