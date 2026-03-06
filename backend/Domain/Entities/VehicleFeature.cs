using System;

namespace Backend.Domain.Entities
{
    public class VehicleFeature : AuditableEntity
    {
        
        public Guid VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }

        public string FeatureCategory { get; set; } = string.Empty; // Safety, Comfort, Technology, Accessibility
        public string FeatureName { get; set; } = string.Empty;
        public string? FeatureDescription { get; set; }
    }
}
