using System;

namespace Backend.Domain.Entities.Enums
{

    public enum SecurityEventSeverity
    {
        Critical,
        High,
        Medium,
        Low,
        Info
    }

    public enum EventStatus
    {
        Open,
        Investigating,
        Resolved,
        FalsePositive
    }

    public enum ViolationChangeType
    {
        Modified,
        Deleted,
        Created
    }

    public enum ViolationStatus
    {
        Open,
        Investigating,
        Resolved,
        Authorized
    }

    public enum IncidentSeverity
    {
        Critical,
        High,
        Medium,
        Low
    }

    public enum IncidentStatus
    {
        Open,
        Investigating,
        Contained,
        Resolved,
        Closed
    }

    public enum AlertNotificationChannel
    {
        Email,
        Sms,
        Push,
        Dashboard
    }

    public enum NotificationDeliveryStatus
    {
        Pending,
        Sent,
        Delivered,
        Failed
    }

    public enum SAQType
    {
        SAQA,
        SAQAEP,
        SAQD
    }

    public enum AssessmentStatus
    {
        NotStarted,
        InProgress,
        Completed,
        Failed,
        Submitted
    }

    public enum QuestionResponse
    {
        Yes,
        No,
        NotApplicable,
        NotTested
    }

    public enum ScanType
    {
        Quarterly,
        AdHoc,
        PostChange
    }

    public enum ScanStatus
    {
        Scheduled,
        InProgress,
        Completed,
        Failed
    }

    public enum PassingStatus
    {
        Passed,
        Failed,
        Pending
    }

    public enum VulnerabilityStatus
    {
        Open,
        InRemediation,
        Resolved,
        AcceptedRisk
    }



    public enum ReportFormat
    {
        Pdf,
        Json,
        Csv
    }



    public enum AssessmentType
    {
        QsaOnsite,
        AsvScan
    }

    public enum AssessmentOutcome
    {
        Compliant,
        NonCompliant,
        Conditional,
        Pending
    }
}
