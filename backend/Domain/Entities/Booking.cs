using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System;
using Backend.Domain.Entities.Enums;

namespace Backend.Domain.Entities
{
    public class Booking : AuditableEntity
    {
        [MaxLength(100)]
        public string? BookingNumber { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public ApplicationUser? User { get; set; }

        [Required]
        public Guid VehicleId { get; set; }

        [ForeignKey(nameof(VehicleId))]
        public Vehicle? Vehicle { get; set; }

        public DateTime? PickupDate { get; set; }
        public DateTime? ReturnDate { get; set; }

        public int? TotalDays { get; set; }

        public bool RequiresDriver { get; set; } = false;

        public Guid? DriverId { get; set; }

        [ForeignKey(nameof(DriverId))]
        public Driver? Driver { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? TotalPrice { get; set; }

        [MaxLength(50)]
        public string? Status { get; set; }

        public DateTime? CancelledAt { get; set; }
        
        public string? CancellationReason { get; set; }
    }
}
