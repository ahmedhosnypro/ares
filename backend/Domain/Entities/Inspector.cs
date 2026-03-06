using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Domain.Entities
{
    public class Inspector : AuditableEntity
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Phone { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string NationalId { get; set; } = string.Empty;

        public string? NationalIdImage { get; set; }

        [Required]
        [MaxLength(50)]
        public string EmployeeCode { get; set; } = string.Empty;

        public bool IsAvailable { get; set; } = true;
        
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
    }
}
