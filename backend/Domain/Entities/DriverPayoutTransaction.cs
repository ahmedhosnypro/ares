using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities
{
    [Table("driver_payout_transactions")]
    public class DriverPayoutTransaction
    {
        [Required]
        public Guid DriverPayoutId { get; set; }

        [ForeignKey(nameof(DriverPayoutId))]
        public DriverPayout? DriverPayout { get; set; }

        [Required]
        public Guid DriverEarningId { get; set; }

        [ForeignKey(nameof(DriverEarningId))]
        public DriverEarning? DriverEarning { get; set; }

        /// <summary>
        /// Amount from this earning included in the payout.
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        [Required]
        public decimal Amount { get; set; }

        /// <summary>
        /// Timestamp when this join row was created.
        /// </summary>
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}