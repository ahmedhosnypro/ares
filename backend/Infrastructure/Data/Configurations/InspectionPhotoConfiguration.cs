using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class InspectionPhotoConfiguration : IEntityTypeConfiguration<InspectionPhoto>
    {
        public void Configure(EntityTypeBuilder<InspectionPhoto> builder)
        {
            builder
                .HasOne(p => p.Inspection)
                .WithMany()
                .HasForeignKey(p => p.InspectionId)
                .OnDelete(DeleteBehavior.Restrict);

        }
    }
}
