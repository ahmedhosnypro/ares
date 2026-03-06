using System;

namespace Backend.Domain.Entities.Enums
{
    public enum AddressType
    {
        Home,
        Work,
        Billing,
        Other
    }

    public enum LocationType
    {
        Home,
        Work,
        Airport,
        Hotel,
        Custom,
        Other
    }

    public enum ExportStatus
    {
        Pending,
        Processing,
        Completed,
        Failed
    }

    public enum DeletionRequestStatus
    {
        Pending,
        Cancelled,
        Completed
    }

    public enum PermissionState
    {
        Granted,
        Denied,
        NotRequested
    }

    public enum ProfileVisibility
    {
        Public,
        Private,
        Friends
    }

    public enum PersonaType
    {
        PowerRenter,
        ExperienceSeeker,
        YoungDriver,
        EcoConscious,
        AccessibleMobility
    }

    public enum HistoryLocationType
    {
        Pickup,
        Return
    }
}
