using System;

namespace Backend.Domain.Entities.Enums
{
    public enum BookingStatus
    {
        Pending,
        Confirmed,
        Active,
        Completed,
        Cancelled,
        // ─── Inspection workflow extensions ───────────────────────────────
        // Appended at the end so any existing rows persisted by index keep
        // their meaning. BookingStatus is persisted as a string (see
        // BookingConfiguration), so adding values is safe.
        Approved,             // Admin approved booking, ready for inspector assignment
        ReadyForDelivery,     // Inspection approved — vehicle ready to hand over
        InspectionFailed,     // Inspection rejected — vehicle not safe to deliver
        // ─── Driver workflow extensions ────────────────────────────────
        WaitingForDriver,     // Customer requested a driver, waiting for selection/expiration
        NoDriverAvailable,    // Request expired with no drivers, customer must retry or cancel

        // ─── Staged checkout lifecycle (double-booking prevention) ──────
        // Appended at the end so existing string-persisted rows keep their
        // meaning. These drive the customer self-service checkout funnel:
        //   Draft → DriverSelected → PaymentPending → Confirmed
        // with PaymentPending placing a time-boxed hold on the vehicle and
        // Expired auto-releasing it. See CheckoutService / BookingRepository.
        Draft,                // Vehicle selected; does NOT reserve the vehicle
        DriverSelected,       // Driver chosen (or self-drive); still does NOT reserve
        PaymentPending,       // On the payment page; vehicle is HELD until HoldExpiresAt
        Expired               // Hold elapsed without payment; vehicle released
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
