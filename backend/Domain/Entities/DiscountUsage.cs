using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities
{
    [Table("DiscountUsages")]
    public class DiscountUsage
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid DiscountId { get; set; }

        [ForeignKey(nameof(DiscountId))]
        public DiscountCode? Discount { get; set; }

        [Required]
        public Guid BookingId { get; set; }

        [ForeignKey(nameof(BookingId))]
        public Booking? Booking { get; set; }

        [Required]
        public Guid CustomerId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public ApplicationUser? Customer { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal DiscountAmount { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal OriginalPrice { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal FinalPrice { get; set; }

        public DateTime UsedAt { get; set; } = DateTime.UtcNow;
    }
}
