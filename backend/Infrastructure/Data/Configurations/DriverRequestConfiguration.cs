using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class DriverRequestConfiguration : IEntityTypeConfiguration<DriverRequest>
    {
        public void Configure(EntityTypeBuilder<DriverRequest> builder)
        {
            builder.HasOne(dr => dr.Booking)
                .WithMany()
                .HasForeignKey(dr => dr.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(dr => dr.PickupServiceArea)
                .WithMany()
                .HasForeignKey(dr => dr.PickupServiceAreaId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(dr => dr.FulfilledByDriverProfile)
                .WithMany()
                .HasForeignKey(dr => dr.FulfilledByDriverProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Property(dr => dr.Status)
                .HasConversion<string>();

            // Optimistic-concurrency token: serializes the Open→Fulfilled
            // transition so two concurrent selections on the same booking
            // cannot both succeed.
            builder.Property(dr => dr.RowVersion)
                .IsRowVersion();

            // Unique partial index: at most one active request per booking
            builder.HasIndex(dr => dr.BookingId)
                .IsUnique()
                .HasFilter("[Status] = 'Open'");

            builder.HasIndex(dr => new { dr.Status, dr.ExpiresAt });
        }
    }
}
