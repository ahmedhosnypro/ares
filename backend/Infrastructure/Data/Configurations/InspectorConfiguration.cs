using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class InspectorConfiguration : IEntityTypeConfiguration<Inspector>
    {
        public void Configure(EntityTypeBuilder<Inspector> builder)
        {
            builder.HasOne(i => i.User)
                .WithOne()
                .HasForeignKey<Inspector>(i => i.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
