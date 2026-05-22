namespace Backend.Domain.Entities.Enums
{
    /// <summary>
    /// Lifecycle status of a single VehicleInspection record.
    /// </summary>
    public enum InspectionStatus
    {
        Pending,
        Approved,
        Rejected
    }

    /// <summary>
    /// Inspection status as reflected on the parent Booking.
    /// NotRequired = no inspector assigned yet.
    /// </summary>
    public enum BookingInspectionStatus
    {
        NotRequired,
        Pending,
        Approved,
        Rejected
    }
}
