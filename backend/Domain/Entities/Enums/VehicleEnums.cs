namespace Backend.Domain.Entities.Enums
{
    public enum VehicleCategory
    {
        Economy,
        Standard,
        Luxury,
        SUV,
        Van,
        Electric,
        Hybrid
    }

    public enum TransmissionType
    {
        Automatic,
        Manual,
        CVT
    }

    public enum FuelType
    {
        Gasoline,
        Diesel,
        Electric,
        Hybrid,
        PluginHybrid
    }

    public enum VehicleStatus
    {
        Available,
        Unavailable,
        FullyBooked,
        ComingSoon,
        Maintenance,
        Retired
    }
}
