using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities
{
    [Table("category_offers")]
    public class CategoryOffer : AuditableEntity
    {
        [Key]
        [Column("id")]
        public new Guid Id { get; set; }

        [Column("category_id")]
        public Guid CategoryId { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public Category? Category { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("offer_name")]
        public string OfferName { get; set; } = string.Empty;

        [Column("discount_percentage", TypeName = "decimal(5,2)")]
        [Range(0, 100)]
        public decimal DiscountPercentage { get; set; }

        [Column("start_date")]
        public DateTime StartDate { get; set; }

        [Column("end_date")]
        public DateTime EndDate { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;
    }
}
