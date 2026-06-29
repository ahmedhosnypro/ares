using System;

namespace Backend.Application.DTOs.Promotions
{
    public class DiscountCodeUpdateRequest
    {
        public string? Description { get; set; }
        public DateTime? ValidTo { get; set; }
        public int? UsageLimitTotal { get; set; }
        public bool? IsActive { get; set; }
    }
}
