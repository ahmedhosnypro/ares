using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System;
using Backend.Domain.Entities.Enums;
using System.Collections.Generic;

namespace Backend.Domain.Entities
{
    public class Vehicle : AuditableEntity
    {
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public ApplicationUser? User { get; set; }

        [MaxLength(100)]
        public string? Make { get; set; }

        [MaxLength(100)]
        public string? Model { get; set; }

        public int? Year { get; set; }

        [MaxLength(50)]
        public string? Color { get; set; }

        [MaxLength(50)]
        public string? LicensePlate { get; set; }

        [MaxLength(50)]
        public string? Transmission { get; set; }

        [MaxLength(50)]
        public string? FuelType { get; set; }

        public int? Seats { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? PricePerDay { get; set; }

        [MaxLength(100)]
        public string? LocationCity { get; set; }

        public string? Description { get; set; }

        [MaxLength(50)]
        public string? Status { get; set; }

        [MaxLength(50)]
        public string? AvailabilityStatus { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime? ApprovedAt { get; set; }

        public ICollection<VehicleImage> Images { get; set; } = new List<VehicleImage>();

        public ICollection<VehicleAvailability> AvailabilityPeriods { get; set; } = new List<VehicleAvailability>();
    }
}
