using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Domain.Entities.Enums;

namespace Backend.Domain.Entities
{
    [Table("driver_requests")]
    public class DriverRequest
    {
        [Key]
        public Guid Id { get; set; }

        public Guid BookingId { get; set; }

        [ForeignKey(nameof(BookingId))]
        public Booking? Booking { get; set; }

        public Guid? PickupServiceAreaId { get; set; }

        [ForeignKey(nameof(PickupServiceAreaId))]
        public ServiceArea? PickupServiceArea { get; set; }

        [MaxLength(255)]
        public string? PickupLocationText { get; set; }

        [MaxLength(30)]
        public DriverRequestStatus Status { get; set; } = DriverRequestStatus.Open;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; }

        public DateTime? FulfilledAt { get; set; }

        public Guid? FulfilledByDriverProfileId { get; set; }

        [ForeignKey(nameof(FulfilledByDriverProfileId))]
        public DriverProfile? FulfilledByDriverProfile { get; set; }

        /// <summary>
        /// Optimistic-concurrency token. The Open→Fulfilled transition during
        /// driver selection is the per-booking serialization point: two
        /// concurrent selections on the same booking (e.g. a double-click on
        /// two different drivers) race on this token, so only one commit wins
        /// and the loser receives a <see cref="ConflictException"/> rather than
        /// reserving a second driver.
        /// </summary>
        [System.ComponentModel.DataAnnotations.Timestamp]
        public byte[]? RowVersion { get; set; }

        public ICollection<DriverRequestResponse> Responses { get; set; } = new List<DriverRequestResponse>();
    }
}
