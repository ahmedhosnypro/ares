using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Domain.Entities.Enums;

namespace Backend.Domain.Entities
{
    /// <summary>
    /// Represents a driver's withdrawal request from their available earnings balance.
    /// </summary>
    [Table("driver_payouts")]
    public class DriverPayout : AuditableEntity
    {
        /// <summary>
        /// The driver profile requesting the payout.
        /// </summary>
        [Required]
        public Guid DriverProfileId { get; set; }

        [ForeignKey(nameof(DriverProfileId))]
        public DriverProfile? DriverProfile { get; set; }

        /// <summary>
        /// Total amount requested (must not exceed available balance).
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        [Required]
        public decimal Amount { get; set; }

        /// <summary>
        /// Current status of the payout request.
        /// </summary>
        [Required]
        public DriverPayoutStatus Status { get; set; } = DriverPayoutStatus.Requested;

        /// <summary>
        /// Timestamp when the driver submitted the request.
        /// </summary>
        [Required]
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Admin user who reviewed the request (nullable if still pending).
        /// </summary>
        public Guid? ReviewedBy { get; set; }

        /// <summary>
        /// Timestamp when the request was reviewed (nullable if still pending).
        /// </summary>
        public DateTime? ReviewedAt { get; set; }

        /// <summary>
        /// Reason provided by admin if rejected.
        /// </summary>
        [MaxLength(500)]
        public string? RejectionReason { get; set; }

        /// <summary>
        /// Timestamp when Paymob disbursement was initiated (nullable).
        /// </summary>
        public DateTime? ProcessedAt { get; set; }

        /// <summary>
        /// Paymob transaction ID for the disbursement (nullable).
        /// </summary>
        [MaxLength(100)]
        public string? PaymobTransactionId { get; set; }

        /// <summary>
        /// Paymob's internal payout reference (nullable).
        /// </summary>
        public long? PaymobPayoutId { get; set; }

        /// <summary>
        /// Reason provided by Paymob if disbursement failed (nullable).
        /// </summary>
        [MaxLength(500)]
        public string? FailureReason { get; set; }
    }
}