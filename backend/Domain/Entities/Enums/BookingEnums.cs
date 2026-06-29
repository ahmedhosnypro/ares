using System;

namespace Backend.Domain.Entities.Enums
{
    public enum BookingStatus
    {
        Draft,
        PaymentPending,
        PendingApproval,
        Confirmed,
        Active,
        Completed,
        Cancelled,
        CancelledByAdmin,
        Expired,
        Rejected
    }

    public enum DriverAssignmentStatus
    {
        NotRequired,
        Waiting,
        Assigned,
        Expired
    }

    public enum PaymentStatus
    {
        Pending,
        Authorized,
        Captured,
        Refunded,
        Failed
    }

    public enum ModificationType
    {
        Dates,
        Vehicle,
        Location,
        Services,
        Insurance,
        Other
    }

    public enum PaymentAdjustmentStatus
    {
        Pending,
        Processed,
        Failed
    }

    public enum PolicyType
    {
        Free,
        Partial,
        NoRefund,
        ForceMajeure
    }

    public enum RefundStatus
    {
        Pending,
        Processing,
        Completed,
        Failed
    }

    public enum ReasonCategory
    {
        PlansChanged,
        FoundAlternative,
        Emergency,
        Other
    }

    public enum BookingEventType
    {
        Created,
        Modified,
        Cancelled,
        Confirmed,
        PickupCompleted,
        ReturnCompleted,
        PaymentProcessed,
        RefundProcessed
    }

    public enum EventActorType
    {
        Customer,
        Admin,
        System,
        Support
    }

    public enum MaintenanceStatus
    {
        Scheduled,
        InProgress,
        Completed,
        Cancelled
    }
}
