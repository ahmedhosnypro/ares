using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class ServiceAreaConfiguration : IEntityTypeConfiguration<ServiceArea>
    {
        public void Configure(EntityTypeBuilder<ServiceArea> builder)
        {
            builder.HasIndex(sa => sa.Name).IsUnique();
        }
    }
}
