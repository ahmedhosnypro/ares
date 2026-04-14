using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Domain.Entities
{
    public class Driver : AuditableEntity
    {
        [Key]
        public new Guid Id { get; set; }
        
        [Required]
        public Guid UserId { get; set; }

        public ApplicationUser? User { get; set; }

        [Required]
        [MaxLength(50)]
        public string LicenseNumber { get; set; } = string.Empty;

        [Required]
        public DateTime LicenseExpiryDate { get; set; }

        public string? LicenseImage { get; set; }

        public bool IsAvailable { get; set; } = true;
        
        public bool IsVerified { get; set; } = false;
        
        public bool IsActive { get; set; } = true;

        public new DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public new DateTime? UpdatedAt { get; set; }
    }
}
