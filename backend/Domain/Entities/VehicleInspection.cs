using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

        [Required]
        public Guid InspectorId { get; set; }

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

    }
}
