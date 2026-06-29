using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities
{
    [Table("DiscountValidationLogs")]
    public class DiscountValidationLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid? DiscountId { get; set; }

        [ForeignKey(nameof(DiscountId))]
        public DiscountCode? Discount { get; set; }

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        public Guid? CustomerId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public ApplicationUser? Customer { get; set; }

        public Guid? VehicleId { get; set; }

        [ForeignKey(nameof(VehicleId))]
        public Vehicle? Vehicle { get; set; }

        public bool IsValid { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? ValidationErrors { get; set; }

        [MaxLength(45)]
        public string? IpAddress { get; set; }

        [MaxLength(500)]
        public string? UserAgent { get; set; }

        public DateTime ValidatedAt { get; set; } = DateTime.UtcNow;
    }
}
