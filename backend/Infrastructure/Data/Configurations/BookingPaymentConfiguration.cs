using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class BookingPaymentConfiguration : IEntityTypeConfiguration<BookingPayment>
    {
        public void Configure(EntityTypeBuilder<BookingPayment> builder)
        {
            builder
                .HasOne(b => b.Booking)
                .WithMany()
                .HasForeignKey(b => b.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

        }
    }
}
