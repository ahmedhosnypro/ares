using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities
{
    public class BookingPayment : AuditableEntity
    {
        [Key]
        public Guid PaymentId { get; set; }

        [Required]
        public Guid BookingId { get; set; }

        [ForeignKey(nameof(BookingId))]
        public Booking? Booking { get; set; }

        [Required]
        [MaxLength(100)]
        public Guid TransactionId { get; set; }

        [Required]
        [MaxLength(50)]
        public string PaymentMethod { get; set; } = string.Empty;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        [MaxLength(3)]
        public string Currency { get; set; } = "USD";

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Authorized, Captured, Failed, Refunded

        [MaxLength(50)]
        public string? AuthorizationCode { get; set; }

        public DateTime? ProcessedAt { get; set; }

        public string? FailureReason { get; set; }

    }
}
