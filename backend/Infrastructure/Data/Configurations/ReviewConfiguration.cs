using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class ReviewConfiguration : IEntityTypeConfiguration<Review>
    {
        public void Configure(EntityTypeBuilder<Review> builder)
        {
            // One-to-one: a Booking has at most one Review, and a Review belongs to exactly one Booking.
            // Pair both navigations to the same FK so EF Core does not invent a shadow `BookingId1` column
            // for the inverse `Booking.Review` navigation. Without this, every SELECT on Reviews emits
            // `[r].[BookingId1]` and SQL Server returns "Invalid column name 'BookingId1'" (HTTP 500).
            builder
                .HasOne(r => r.Booking)
                .WithOne(b => b.Review)
                .HasForeignKey<Review>(r => r.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

            builder
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder
                .HasOne(r => r.Vehicle)
                .WithMany()
                .HasForeignKey(r => r.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            builder
                .HasIndex(r => r.BookingId)
                .IsUnique();
        }
    }
}
