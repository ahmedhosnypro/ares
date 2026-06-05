using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class DriverReviewConfiguration : IEntityTypeConfiguration<DriverReview>
    {
        public void Configure(EntityTypeBuilder<DriverReview> builder)
        {
            builder.HasOne(dr => dr.Booking)
                .WithMany()
                .HasForeignKey(dr => dr.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(dr => dr.DriverProfile)
                .WithMany()
                .HasForeignKey(dr => dr.DriverProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(dr => dr.Customer)
                .WithMany()
                .HasForeignKey(dr => dr.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(dr => dr.BookingId)
                .IsUnique();

            builder.HasIndex(dr => dr.DriverProfileId);
        }
    }
}
