using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Domain.Entities.Enums;

namespace Backend.Domain.Entities
{
    /// <summary>
    /// Append-only ledger tracking the driver's earnings from a single booking.
    /// Created automatically when a booking reaches "Completed" status.
    /// </summary>
    [Table("driver_earnings")]
    public class DriverEarning : AuditableEntity
    {
        // ── Booking → Driver ├──
        /// <summary>
        /// The completed booking that generated this earning.
        /// </summary>
        [Required]
        public Guid BookingId { get; set; }

        [ForeignKey(nameof(BookingId))]
        public Booking? Booking { get; set; }

        /// <summary>
        /// The driver profile that owns this earning.
        /// </summary>
        [Required]
        public Guid DriverProfileId { get; set; }

        [ForeignKey(nameof(DriverProfileId))]
        public DriverProfile? DriverProfile { get; set; }

        // ── Earning amounts ├──
        /// <summary>
        /// The raw driver fee as set at checkout time.
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        [Required]
        public decimal GrossEarning { get; set; }

        /// <summary>
        /// Platform commission/deduction taken from the gross earning.
        /// Configurable via `driver.commission_percentage` system setting.
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        [Required]
        public decimal PlatformDeduction { get; set; }

        /// <summary>
        /// Net amount available to the driver after platform deduction.
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        [Required]
        public decimal NetEarning { get; set; }

        // ── Lifecycle ├──
        /// <summary>
        /// Current status of this earning: Available, PendingPayout, Paid, or Reversed.
        /// </summary>
        [Required]
        public DriverEarningStatus Status { get; set; } = DriverEarningStatus.Available;

        /// <summary>
        /// Nullable FK to the payout that settled this earning (if any).
        /// </summary>
        public Guid? PayoutId { get; set; }

        [ForeignKey(nameof(PayoutId))]
        public DriverPayout? Payout { get; set; }

        /// <summary>
        /// Timestamp when this earning was reversed (due to booking cancellation/refund).
        /// </summary>
        public DateTime? ReversedAt { get; set; }

        /// <summary>
        /// Timestamp when the booking was completed and this earning was created.
        /// </summary>
        [Required]
        public DateTime EarnedAt { get; set; } = DateTime.UtcNow;
    }
}