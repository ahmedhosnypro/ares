using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities
{
    /// <summary>
    /// Image uploaded by an inspector as part of a VehicleInspection's
    /// photographic evidence. Stored separately from the older
    /// <see cref="InspectionPhoto"/> entity so legacy consumers are not
    /// affected.
    /// </summary>
    public class InspectionImage : AuditableEntity
    {
        [Key]
        public new Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid InspectionId { get; set; }

        [ForeignKey(nameof(InspectionId))]
        public VehicleInspection? Inspection { get; set; }

        [Required]
        [MaxLength(500)]
        public string ImageUrl { get; set; } = string.Empty;

        public new DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
