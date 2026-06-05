namespace Backend.Domain.Entities.Enums
{
    public enum UserRole
    {
        Customer,
        Supplier,
        Admin,
        // Appended at the end so any rows previously persisted by ordinal
        // keep their meaning. The Driver role is added with the Driver
        // Module and is a self-service role on /api/auth/register.
        Driver
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
