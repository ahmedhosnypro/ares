using System;
using Backend.Domain.Entities.Enums;

namespace Backend.Domain.Entities
{
    public class BookingCancellation : AuditableEntity
    {

        public Guid BookingId { get; set; }
        public Booking? Booking { get; set; }

        public Guid CancelledBy { get; set; }
        public ApplicationUser? CancelledByUser { get; set; }

        public PolicyType PolicyType { get; set; }
        
        public decimal RefundPercentage { get; set; }
        public decimal OriginalAmount { get; set; }
        public decimal CancellationFee { get; set; }
        
        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public decimal RefundAmount => OriginalAmount - CancellationFee;
        
        public string Currency { get; set; } = "USD";

        public RefundStatus RefundStatus { get; set; } = RefundStatus.Pending;
        public Guid? RefundTransactionId { get; set; }public DateTime? RefundProcessedAt { get; set; }
        public string? RefundMethod { get; set; }

        public string? Reason { get; set; }
        public ReasonCategory? ReasonCategory { get; set; }

    }
}
