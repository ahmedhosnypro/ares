using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Domain.Entities
{
    public class Inspector : AuditableEntity
    {
        [Key]
        public new Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        public ApplicationUser? User { get; set; }

        [Required]
        [MaxLength(50)]
        public string EmployeeCode { get; set; } = string.Empty;

        public bool IsAvailable { get; set; } = true;

        public bool IsActive { get; set; } = true;

        public new DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public new DateTime? UpdatedAt { get; set; }

        [MaxLength(100)]
        public string? Region { get; set; }
    }
}
