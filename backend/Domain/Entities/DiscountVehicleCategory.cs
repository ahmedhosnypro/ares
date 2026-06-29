using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities
{
    [Table("DiscountVehicleCategories")]
    public class DiscountVehicleCategory
    {
        [Required]
        public Guid DiscountId { get; set; }

        [ForeignKey(nameof(DiscountId))]
        public DiscountCode? Discount { get; set; }

        [Required]
        public Guid CategoryId { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public Category? Category { get; set; }
    }
}
