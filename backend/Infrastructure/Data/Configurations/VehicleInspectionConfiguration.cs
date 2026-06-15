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

            // ─── Inspection workflow ─────────────────────────────────────
            builder
                .Property(i => i.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(Backend.Domain.Entities.Enums.InspectionStatus.Pending)
                .HasSentinel(Backend.Domain.Entities.Enums.InspectionStatus.Pending);

            builder
                .Property(i => i.IsSubmitted)
                .HasDefaultValue(false);

            builder
                .HasMany(i => i.Images)
                .WithOne(p => p.Inspection!)
                .HasForeignKey(p => p.InspectionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Business rule §5: one inspection per booking. We use a
            // standard index (not unique) on existing schemas — the
            // uniqueness is enforced in the application layer via the
            // dedicated assignment service that always reuses any
            // existing inspection record instead of creating duplicates.
            builder
                .HasIndex(i => i.BookingId);
        }
    }
}
