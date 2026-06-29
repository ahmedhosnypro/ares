using System;

namespace Backend.Application.DTOs.Promotions
{
    public class DiscountApplyRequest
    {
        public Guid BookingId { get; set; }
        public string Code { get; set; } = string.Empty;
    }
}
