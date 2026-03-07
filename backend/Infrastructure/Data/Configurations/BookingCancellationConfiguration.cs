using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class BookingCancellationConfiguration : IEntityTypeConfiguration<BookingCancellation>
    {
        public void Configure(EntityTypeBuilder<BookingCancellation> builder)
        {
            builder
                .HasOne(c => c.Booking)
                .WithMany()
                .HasForeignKey(c => c.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            builder
                .HasIndex(c => c.BookingId)
                .IsUnique();

            builder
                .HasOne(c => c.CancelledByUser)
                .WithMany()
                .HasForeignKey(c => c.CancelledBy)
                .OnDelete(DeleteBehavior.Restrict);

            builder
                .Property(c => c.RefundPercentage).HasColumnType("decimal(5,2)");

            builder
                .Property(c => c.OriginalAmount).HasColumnType("decimal(10,2)");

            builder
                .Property(c => c.CancellationFee).HasColumnType("decimal(10,2)");

        }
    }
}
