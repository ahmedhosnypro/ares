using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class BookingConfiguration : IEntityTypeConfiguration<Booking>
    {
        public void Configure(EntityTypeBuilder<Booking> builder)
        {
            builder
                .HasOne(b => b.User)
                .WithMany()
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder
                .HasOne(b => b.Vehicle)
                .WithMany()
                .HasForeignKey(b => b.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            builder
                .HasOne(b => b.Driver)
                .WithMany()
                .HasForeignKey(b => b.DriverId)
                .OnDelete(DeleteBehavior.Restrict);

            builder
                .HasIndex(b => b.BookingNumber)
                .IsUnique();

            builder
                .Property(b => b.Status)
                .HasConversion<string>()
                .HasMaxLength(50);

            // ─── Inspection workflow ─────────────────────────────────────
            builder
                .HasOne(b => b.AssignedInspector)
                .WithMany()
                .HasForeignKey(b => b.AssignedInspectorId)
                .OnDelete(DeleteBehavior.Restrict);

            builder
                .Property(b => b.InspectionStatus)
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(Backend.Domain.Entities.Enums.InspectionStatus.NotRequired);

            // ─── Driver Module ───────────────────────────────────────────
            builder
                .Property(b => b.DriverAssignmentStatus)
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(Backend.Domain.Entities.Enums.DriverAssignmentStatus.NotRequired);

            builder
                .HasIndex(b => b.AssignedInspectorId);

            // ─── Driver Module ───────────────────────────────────────────
            builder
                .HasOne(b => b.AssignedDriverProfile)
                .WithMany()
                .HasForeignKey(b => b.AssignedDriverProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            builder
                .HasIndex(b => b.AssignedDriverProfileId);

            builder
                .HasIndex(b => new { b.AssignedDriverProfileId, b.PickupDate, b.ReturnDate });

            // ─── Double-booking prevention indexes ───────────────────────
            // Fast overlap/availability lookups for a vehicle by status+window.
            builder
                .HasIndex(b => new { b.VehicleId, b.Status, b.PickupDate, b.ReturnDate })
                .HasDatabaseName("IX_Bookings_Vehicle_Status_Window");

            // Fast background sweep for expiring holds.
            builder
                .HasIndex(b => new { b.Status, b.HoldExpiresAt })
                .HasDatabaseName("IX_Bookings_Status_HoldExpiresAt");

            // Fast booking-recovery lookup (a user's in-flight checkout).
            builder
                .HasIndex(b => new { b.UserId, b.Status })
                .HasDatabaseName("IX_Bookings_User_Status");

            builder
                .Property(b => b.RowVersion)
                .IsRowVersion();
        }
    }
}
