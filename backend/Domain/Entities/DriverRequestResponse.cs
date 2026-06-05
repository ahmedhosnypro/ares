using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Domain.Entities.Enums;

namespace Backend.Domain.Entities
{
    [Table("driver_request_responses")]
    public class DriverRequestResponse
    {
        [Key]
        public Guid Id { get; set; }

        public Guid DriverRequestId { get; set; }

        [ForeignKey(nameof(DriverRequestId))]
        public DriverRequest? DriverRequest { get; set; }

        public Guid DriverProfileId { get; set; }

        [ForeignKey(nameof(DriverProfileId))]
        public DriverProfile? DriverProfile { get; set; }

        [MaxLength(20)]
        public DriverResponseAction Action { get; set; } = DriverResponseAction.Accepted;

        public DateTime RespondedAt { get; set; } = DateTime.UtcNow;
    }
}
