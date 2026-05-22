using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class InspectionImageConfiguration : IEntityTypeConfiguration<InspectionImage>
    {
        public void Configure(EntityTypeBuilder<InspectionImage> builder)
        {
            builder.ToTable("InspectionImages");

            builder.HasKey(i => i.Id);

            builder.Property(i => i.ImageUrl)
                .IsRequired()
                .HasMaxLength(500);

            builder.HasOne(i => i.Inspection)
                .WithMany(i => i!.Images)
                .HasForeignKey(i => i.InspectionId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(i => i.InspectionId);
        }
    }
}
