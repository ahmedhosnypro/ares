using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class DriverConfiguration : IEntityTypeConfiguration<Driver>
    {
        public void Configure(EntityTypeBuilder<Driver> builder)
        {
            builder.HasOne(d => d.User)
                .WithOne()
                .HasForeignKey<Driver>(d => d.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
