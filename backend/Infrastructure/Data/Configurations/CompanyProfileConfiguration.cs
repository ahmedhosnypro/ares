using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class CompanyProfileConfiguration : IEntityTypeConfiguration<CompanyProfile>
    {
        public void Configure(EntityTypeBuilder<CompanyProfile> builder)
        {
            builder
                .HasOne(cp => cp.User)
                .WithOne(u => u.CompanyProfile)
                .HasForeignKey<CompanyProfile>(cp => cp.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
