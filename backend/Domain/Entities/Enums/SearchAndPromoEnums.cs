using System;

namespace Backend.Domain.Entities.Enums
{
    public enum DiscountType
    {
        Percentage,
        Fixed
    }

    public enum HierarchyLevel
    {
        Country,
        State,
        City,
        Location
    }

    public enum LocationPricingChangeType
    {
        MultiplierChanged,
        AirportPremiumEnabled,
        AirportPremiumDisabled,
        AirportPremiumChanged,
        RegionAssigned,
        RegionRemoved,
        RegionMultiplierChanged
    }

    public enum TrustScoreComponentStatus
    {
        Excellent,
        Good,
        Fair,
        Poor
    }

    public enum ImprovementTipPriority
    {
        High,
        Medium,
        Low
    }

    public enum ImprovementTipStatus
    {
        Active,
        Completed,
        Dismissed
    }
}
