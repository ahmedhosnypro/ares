using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System;
using Backend.Domain.Entities.Enums;

namespace Backend.Domain.Entities
{
    public class Review : AuditableEntity
    {
        [Required]
        public Guid BookingId { get; set; }
        
        [ForeignKey(nameof(BookingId))]
        public Booking? Booking { get; set; }

        [Required]
        public Guid UserId { get; set; }
        
        [ForeignKey(nameof(UserId))]
        public ApplicationUser? User { get; set; }

        [Required]
        public Guid VehicleId { get; set; }
        
        [ForeignKey(nameof(VehicleId))]
        public Vehicle? Vehicle { get; set; }

        public int? Rating { get; set; }

        public string? Comment { get; set; }

        public string? AdminResponse { get; set; }

        // ── Supplier reply (one reply per review) ────────────────────────────
        /// <summary>
        /// Optional reply written by the supplier that owns the reviewed vehicle.
        /// Exactly one reply per review — overwriting this field constitutes an edit.
        /// Nullable so existing review rows keep working unchanged.
        /// </summary>
        [MaxLength(2000)]
        public string? SupplierReply { get; set; }

        /// <summary>
        /// UTC timestamp the most recent supplier reply was saved.
        /// Null when no supplier has replied yet.
        /// </summary>
        public DateTime? RepliedAt { get; set; }

        // ── Report (basic flagging only — no moderation pipeline yet) ────────
        /// <summary>
        /// True when the supplier has flagged this review as inappropriate.
        /// </summary>
        public bool IsReported { get; set; } = false;

        /// <summary>
        /// Free-text reason supplied by the reporter; null when not reported.
        /// </summary>
        [MaxLength(1000)]
        public string? ReportReason { get; set; }

        /// <summary>
        /// UTC timestamp the review was reported. Null when not reported.
        /// </summary>
        public DateTime? ReportedAt { get; set; }
    }
}
