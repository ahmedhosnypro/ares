using System;

namespace Backend.Application.DTOs.Promotions
{
    public class DiscountValidationRequest
    {
        public string Code { get; set; } = string.Empty;
        public Guid VehicleId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Subtotal { get; set; }
    }
}
