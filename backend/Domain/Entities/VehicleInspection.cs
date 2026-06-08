using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Domain.Entities.Enums;

namespace Backend.Domain.Entities
{
    public class VehicleInspection : AuditableEntity
    {
        [Key]
        public Guid InspectionId { get; set; }

        [Required]
        public Guid VehicleId { get; set; }

        [ForeignKey(nameof(VehicleId))]
        public Vehicle? Vehicle { get; set; }

        [Required]
        public Guid BookingId { get; set; }

        [ForeignKey(nameof(BookingId))]
        public Booking? Booking { get; set; }

        public Guid? InspectorId { get; set; }

        [ForeignKey(nameof(InspectorId))]
        public ApplicationUser? Inspector { get; set; }

        [Required]
        [MaxLength(20)]
        public string InspectionType { get; set; } = string.Empty; // Pickup, Return, Routine

        public DateTime InspectionDate { get; set; } = DateTime.UtcNow;

        public int OdometerReading { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal FuelLevel { get; set; }

        public string? GeneralCondition { get; set; } // Excellent, Good, Fair

        public string? Notes { get; set; }

        // ─── Inspection workflow extensions ──────────────────────────────
        public InspectionStatus Status { get; set; } = InspectionStatus.Pending;

        public DateTime? SubmittedAt { get; set; }

        // True once the inspector has finalised the report. After this point
        // notes / images / decision become immutable.
        public bool IsSubmitted { get; set; } = false;

        // Images uploaded by the inspector for this inspection (the
        // photographic evidence). Distinct from the older InspectionPhoto
        // entity which is kept for backwards compatibility.
        public virtual ICollection<InspectionImage> Images { get; set; } = new List<InspectionImage>();
    }
}
