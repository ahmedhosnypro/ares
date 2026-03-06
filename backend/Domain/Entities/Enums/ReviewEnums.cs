using System;

namespace Backend.Domain.Entities.Enums
{
    public enum ModerationStatus
    {
        Pending,
        Approved,
        Flagged,
        Rejected
    }

    public enum VoteType
    {
        Helpful,
        Unhelpful
    }

    public enum ReportReason
    {
        Spam,
        Offensive,
        Fake,
        Other
    }

    public enum ReportStatus
    {
        Pending,
        Reviewed,
        Resolved,
        Dismissed
    }
}
