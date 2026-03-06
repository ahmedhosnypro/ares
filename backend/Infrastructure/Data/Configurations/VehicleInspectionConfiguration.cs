using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class VehicleInspectionConfiguration : IEntityTypeConfiguration<VehicleInspection>
    {
        public void Configure(EntityTypeBuilder<VehicleInspection> builder)
        {
            builder
                .HasOne(i => i.Vehicle)
                .WithMany()
                .HasForeignKey(i => i.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            builder
                .HasOne(i => i.Booking)
                .WithMany()
                .HasForeignKey(i => i.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

            builder
                .HasOne(i => i.Inspector)
                .WithMany()
                .HasForeignKey(i => i.InspectorId)
                .OnDelete(DeleteBehavior.Restrict);

        }
    }
}
