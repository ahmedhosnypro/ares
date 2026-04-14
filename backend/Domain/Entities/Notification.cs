using System.ComponentModel.DataAnnotations.Schema;
using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Domain.Entities
{
    public class Notification : AuditableEntity
    {
        [Key]
        public new Guid Id { get; set; }
        
        [Required]
        public Guid UserId { get; set; }
        public virtual ApplicationUser User { get; set; } = null!;
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        public DateTime? ReadAt { get; set; }

        public new DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
