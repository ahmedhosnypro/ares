using System;

namespace Backend.Domain.Entities.Enums
{
    public enum PaymentType
    {
        Card,
        PayPal,
        BankTransfer,
        Corporate,
        ApplePay,
        GooglePay
    }

    public enum TransactionType
    {
        Payment,
        Refund,
        Authorization,
        Capture,
        Void
    }

    public enum TransactionStatus
    {
        Pending,
        Processing,
        Completed,
        Failed,
        Cancelled,
        RequiresAuthentication
    }

    public enum FraudDecision
    {
        Accept,
        Review,
        Decline
    }

    public enum AuthorizationStatus
    {
        Pending,
        Authorized,
        Captured,
        Released,
        Expired,
        Failed
    }

    public enum RefundType
    {
        Full,
        Partial,
        Cancellation,
        Modification,
        DamageWaiver
    }


    public enum WebhookProcessingStatus
    {
        Pending,
        Processed,
        Failed,
        Ignored
    }

    public enum ScheduleStatus
    {
        DepositPending,
        DepositPaid,
        FullyPaid
    }

    public enum GuestCheckoutPaymentStatus
    {
        Pending,
        Completed,
        Failed
    }

    public enum InvoiceStatus
    {
        Pending,
        Sent,
        Paid,
        Overdue,
        Cancelled
    }

    public enum ReminderType
    {
        Hours48,
        Hours24,
        Hours12,
        Invoice15Days,
        Invoice25Days,
        Invoice30Days
    }

    public enum ReminderDeliveryStatus
    {
        Sent,
        Delivered,
        Failed
    }

    public enum ReminderChannel
    {
        Email,
        Sms,
        Push
    }
}
