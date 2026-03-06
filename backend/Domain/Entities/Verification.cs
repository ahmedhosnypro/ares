using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Domain.Entities.Enums;

namespace Backend.Domain.Entities
{
    public class Verification : AuditableEntity
    {
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public ApplicationUser? User { get; set; }

        [MaxLength(50)]
        public string? VerificationType { get; set; }

        [MaxLength(50)]
        public string? DocumentType { get; set; }

        public string? DocumentFront { get; set; }

        public string? DocumentBack { get; set; }

        [MaxLength(50)]
        public string? Status { get; set; }

        public DateTime? SubmittedAt { get; set; }

        public Guid? ReviewedBy { get; set; }

        public DateTime? ReviewedAt { get; set; }

        public string? RejectionReason { get; set; }

        public DateTime? ExpiresAt { get; set; }
    }
}
