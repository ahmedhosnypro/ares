using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace Backend.Domain.Entities
{
    public class VehicleImage : AuditableEntity
    {
        [Required]
        public Guid VehicleId { get; set; }
        
        [ForeignKey(nameof(VehicleId))]
        public Vehicle? Vehicle { get; set; }

        public string ImageUrl { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public bool IsPrimary { get; set; } = false;
        public int DisplayOrder { get; set; } = 0;
        
    }
}
