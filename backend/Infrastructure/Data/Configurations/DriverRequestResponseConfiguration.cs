using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class DriverRequestResponseConfiguration : IEntityTypeConfiguration<DriverRequestResponse>
    {
        public void Configure(EntityTypeBuilder<DriverRequestResponse> builder)
        {
            builder.HasOne(drr => drr.DriverRequest)
                .WithMany(dr => dr.Responses)
                .HasForeignKey(drr => drr.DriverRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(drr => drr.DriverProfile)
                .WithMany()
                .HasForeignKey(drr => drr.DriverProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Property(drr => drr.Action)
                .HasConversion<string>();

            builder.HasIndex(drr => new { drr.DriverRequestId, drr.DriverProfileId })
                .IsUnique();
        }
    }
}
