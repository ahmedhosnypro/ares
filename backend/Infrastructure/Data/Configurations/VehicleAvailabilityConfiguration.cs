using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class VehicleAvailabilityConfiguration : IEntityTypeConfiguration<VehicleAvailability>
    {
        public void Configure(EntityTypeBuilder<VehicleAvailability> builder)
        {
            builder.HasOne(v => v.Vehicle)
                .WithMany(v => v.AvailabilityPeriods)
                .HasForeignKey(v => v.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(v => v.Booking)
                .WithMany()
                .HasForeignKey(v => v.BookingId)
                .OnDelete(DeleteBehavior.SetNull); // Optional relation, if booking is deleted, keep availability but remove booking reference, or restrict. Let's use SetNull as it's nullable.

            // Ensure StartDate is less than EndDate
            builder.ToTable(t => t.HasCheckConstraint("CK_VehicleAvailability_Dates", "\"StartDate\" < \"EndDate\""));

            // Enum Conversion
            builder.Property(v => v.Status)
                .HasConversion<string>()
                .HasMaxLength(50);

            // Composite Index
            builder.HasIndex(v => new { v.VehicleId, v.StartDate, v.EndDate });
        }
    }
}
