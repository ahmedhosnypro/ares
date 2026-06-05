using System;
using Backend.Domain.Entities.Enums;

namespace Backend.Application.DTOs.Driver
{
    public class DriverRequestDto
    {
        public Guid Id { get; set; }
        public Guid BookingId { get; set; }
        public DateTime PickupDate { get; set; }
        public DateTime ReturnDate { get; set; }
        public string? PickupLocationText { get; set; }
        public Guid? PickupServiceAreaId { get; set; }
        public string? PickupServiceAreaName { get; set; }
        public DriverRequestStatus Status { get; set; }
        public DateTime ExpiresAt { get; set; }
        public decimal EstimatedEarnings { get; set; }
        public bool HasResponded { get; set; }
    }
}
