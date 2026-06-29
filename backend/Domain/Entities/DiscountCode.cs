using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities
{
    public class DiscountCode : AuditableEntity
    {
        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string DiscountType { get; set; } = "percentage";

        [Column(TypeName = "decimal(10,2)")]
        [Range(0.01, double.MaxValue)]
        public decimal DiscountValue { get; set; }

        public DateTime ValidFrom { get; set; }
        public DateTime ValidTo { get; set; }

        public int? UsageLimitTotal { get; set; }
        public int UsageLimitPerCustomer { get; set; } = 1;
        public int CurrentUsageCount { get; set; } = 0;

        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string CustomerSegments { get; set; } = "[\"all\"]";

        public int? MinimumDuration { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? MinimumValue { get; set; }

        public bool AllowStacking { get; set; } = false;
        public bool IsAutomatic { get; set; } = false;
        public int Priority { get; set; } = 0;
        public bool IsActive { get; set; } = true;

        [Required]
        public Guid SupplierId { get; set; }

        [ForeignKey(nameof(SupplierId))]
        public CompanyProfile? Supplier { get; set; }

        [Required]
        public Guid CreatedById { get; set; }

        [ForeignKey(nameof(CreatedById))]
        public ApplicationUser? CreatedByUser { get; set; }

        public ICollection<DiscountVehicleCategory> VehicleCategories { get; set; } = new List<DiscountVehicleCategory>();
        public ICollection<DiscountUsage> Usages { get; set; } = new List<DiscountUsage>();
    }
}
