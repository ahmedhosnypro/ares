using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System;
using System.Collections.Generic;
using Backend.Domain.Entities.Enums;

namespace Backend.Domain.Entities
{
    public class Category : AuditableEntity
    {


        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal CommissionPercentage { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal DiscountPercentage { get; set; }

        [NotMapped]
        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
        public ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();
        public ICollection<CategoryOffer> Offers { get; set; } = new List<CategoryOffer>();
    }
}
