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
                .HasIndex(b => b.BookingNumber)
                .IsUnique();

        }
    }
}
