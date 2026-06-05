using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class DriverWorkAreaConfiguration : IEntityTypeConfiguration<DriverWorkArea>
    {
        public void Configure(EntityTypeBuilder<DriverWorkArea> builder)
        {
            builder.HasKey(dwa => new { dwa.DriverProfileId, dwa.ServiceAreaId });

            builder.HasOne(dwa => dwa.DriverProfile)
                .WithMany(dp => dp.WorkAreas)
                .HasForeignKey(dwa => dwa.DriverProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(dwa => dwa.ServiceArea)
                .WithMany()
                .HasForeignKey(dwa => dwa.ServiceAreaId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(dwa => dwa.ServiceAreaId);
        }
    }
}
