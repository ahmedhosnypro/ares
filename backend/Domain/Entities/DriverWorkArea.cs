using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities
{
    [Table("driver_work_areas")]
    public class DriverWorkArea
    {
        public Guid DriverProfileId { get; set; }

        [ForeignKey(nameof(DriverProfileId))]
        public DriverProfile? DriverProfile { get; set; }

        public Guid ServiceAreaId { get; set; }

        [ForeignKey(nameof(ServiceAreaId))]
        public ServiceArea? ServiceArea { get; set; }
    }
}
