using System.Text.Json.Serialization;

namespace Backend.Domain.Entities.Enums
{
    /// <summary>
    /// Lifecycle status of a <see cref="DriverProfile"/>. Persisted as a
    /// string in the <c>driver_profiles.Status</c> column so adding new
    /// values is safe and ordering does not matter on disk.
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum DriverProfileStatus
    {
        /// <summary>
        /// Profile row created by registration but the driver has not yet
        /// submitted license + ID + work areas. Driver cannot receive
        /// requests; UI must force completion.
        /// </summary>
        Incomplete,

        /// <summary>
        /// Driver has submitted the complete profile and is waiting for an
        /// admin decision. Driver can log in but cannot receive requests,
        /// cannot appear in search, cannot be assigned.
        /// </summary>
        PendingVerification,

        /// <summary>
        /// Admin approved the driver. Together with
        /// <see cref="DriverAvailability.Available"/> and
        /// <c>IsActive = true</c> the driver becomes eligible for requests.
        /// </summary>
        Verified,

        /// <summary>
        /// Admin rejected the driver. <c>RejectionReason</c> is set. Driver
        /// may resubmit which flips the status back to PendingVerification.
        /// </summary>
        Rejected,

        /// <summary>
        /// Admin has disabled the driver account. Treated like Rejected for
        /// eligibility purposes but preserved separately for audit.
        /// </summary>
        Suspended
    }

    /// <summary>
    /// Real-time availability flag the driver can toggle from their dashboard.
    /// <see cref="Reserved"/> is set by the system while a driver is assigned
    /// to an active booking and is not user-toggleable.
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum DriverAvailability
    {
        /// <summary>Default. Driver does not appear in matching results.</summary>
        Unavailable,

        /// <summary>Driver opted in and can receive new requests.</summary>
        Available,

        /// <summary>System-managed — set while a booking is active.</summary>
        Reserved
    }

}
