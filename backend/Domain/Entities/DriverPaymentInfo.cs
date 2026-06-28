using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Domain.Entities.Enums;

namespace Backend.Domain.Entities
{
    /// <summary>
    /// Payout destination information for a driver.
    /// Drivers must set this up before requesting withdrawals.
    /// </summary>
    [Table("driver_payment_info")]
    public class DriverPaymentInfo : AuditableEntity
    {
        /// <summary>
        /// The driver profile this payout info belongs to.
        /// </summary>
        [Required]
        public Guid DriverProfileId { get; set; }

        [ForeignKey(nameof(DriverProfileId))]
        public DriverProfile? DriverProfile { get; set; }

        /// <summary>
        /// Payout method (only "Wallet" supported initially).
        /// </summary>
        [Required]
        public DriverPayoutMethod PayoutMethod { get; set; } = DriverPayoutMethod.Wallet;

        /// <summary>
        /// Phone number linked to the driver's wallet (e.g., Paymob wallet).
        /// Required for "Wallet" payouts.
        /// </summary>
        [MaxLength(30)]
        [Required]
        public string? WalletPhoneNumber { get; set; }

        /// <summary>
        /// Whether this wallet info has been verified by an admin.
        /// Only verified wallets are allowed in payout processing.
        /// </summary>
        [Required]
        public bool IsVerified { get; set; } = false;
    }
}