using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities
{
    public class InspectionPhoto : AuditableEntity
    {
        [Key]
        public Guid PhotoId { get; set; }

        [Required]
        public Guid InspectionId { get; set; }

        [ForeignKey(nameof(InspectionId))]
        public VehicleInspection? Inspection { get; set; }

        [Required]
        [MaxLength(255)]
        public string PhotoUrl { get; set; } = string.Empty;

        [MaxLength(50)]
        public string ViewAngle { get; set; } = string.Empty; // Front, Rear, Left, Right, Interior

        public bool AiProcessed { get; set; } = false;

        public DateTime CapturedAt { get; set; }

    }
}
