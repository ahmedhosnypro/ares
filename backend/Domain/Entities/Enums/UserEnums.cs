namespace Backend.Domain.Entities.Enums
{
    public enum UserRole
    {
        Customer,
        Supplier,
        Admin
    }

    public enum VerificationStatus
    {
        Unverified,
        PendingVerification,
        Verified
    }

    public enum AccountStatus
    {
        Active,
        Suspended,
        Locked,
        Deleted
    }
}
