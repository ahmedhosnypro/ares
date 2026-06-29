using System;
using System.Collections.Generic;

namespace Backend.Application.DTOs.Promotions
{
    public class DiscountCodeCreateRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string DiscountType { get; set; } = "percentage";
        public decimal DiscountValue { get; set; }
        public DateTime ValidFrom { get; set; }
        public DateTime ValidTo { get; set; }
        public int? UsageLimitTotal { get; set; }
        public int UsageLimitPerCustomer { get; set; } = 1;
        public List<string> CustomerSegments { get; set; } = new() { "all" };
        public List<Guid>? VehicleCategoryIds { get; set; }
        public int? MinimumDuration { get; set; }
        public decimal? MinimumValue { get; set; }
        public bool AllowStacking { get; set; }
        public bool IsAutomatic { get; set; }
        public int Priority { get; set; }
        public Guid SupplierId { get; set; }
    }
}
