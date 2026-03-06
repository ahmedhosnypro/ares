using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System;
using Backend.Domain.Entities.Enums;

namespace Backend.Domain.Entities
{
    public class Review : AuditableEntity
    {
        [Required]
        public Guid BookingId { get; set; }
        
        [ForeignKey(nameof(BookingId))]
        public Booking? Booking { get; set; }

        [Required]
        public Guid UserId { get; set; }
        
        [ForeignKey(nameof(UserId))]
        public ApplicationUser? User { get; set; }

        [Required]
        public Guid VehicleId { get; set; }
        
        [ForeignKey(nameof(VehicleId))]
        public Vehicle? Vehicle { get; set; }

        public int? Rating { get; set; }

        public string? Comment { get; set; }
        
        public string? AdminResponse { get; set; }
    }
}
