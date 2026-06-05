using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Backend.Domain.Entities.Enums;

namespace Backend.Domain.Entities
{
    /// <summary>
    /// Profile for an ApplicationUser whose role is <c>Driver</c>. Holds
    /// the driver-specific data the existing <see cref="ApplicationUser"/>
    /// does not carry — license, national ID images, verification status,
    /// availability flag, work areas (added in Phase 5), and assignment
    /// lock window.
    /// </summary>
    /// <remarks>
    /// <para>
    /// This entity is intentionally separate from the legacy
    /// <see cref="Driver"/> entity, which holds the *customer's* driving
    /// license submission (see <c>DriverLicenseController</c>). The two
    /// concepts share no rows and are mapped to different tables so the
    /// existing customer driver-license verification flow keeps working
    /// unchanged.
    /// </para>
    /// <para>
    /// A row is created automatically with <see cref="Status"/> set to
    /// <see cref="DriverProfileStatus.Incomplete"/> the moment a user
    /// registers with role <c>Driver</c>. The driver must complete the
    /// profile (Phase 2) before any driver-side feature unlocks.
    /// </para>
    /// </remarks>
    [Table("driver_profiles")]
    public class DriverProfile : AuditableEntity
    {
        // ── Owner ────────────────────────────────────────────────────────
        /// <summary>The owning Identity user. One-to-one (unique).</summary>
        [Required]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public ApplicationUser? User { get; set; }

        // ── License ──────────────────────────────────────────────────────
        /// <summary>
        /// Government-issued driving license number. Optional until the
        /// driver completes the profile; required by the profile-completion
        /// flow (Phase 2) and persisted unique-when-present at the DB level.
        /// </summary>
        [MaxLength(50)]
        public string? LicenseNumber { get; set; }

        public DateTime? LicenseExpiryDate { get; set; }

        /// <summary>Public URL of the uploaded license image.</summary>
        [MaxLength(500)]
        public string? LicenseImage { get; set; }

        // ── National ID ──────────────────────────────────────────────────
        [MaxLength(500)]
        public string? NationalIdFrontImage { get; set; }

        [MaxLength(500)]
        public string? NationalIdBackImage { get; set; }

        // ── Contact / safety ─────────────────────────────────────────────
        [MaxLength(500)]
        public string? Address { get; set; }

        [MaxLength(150)]
        public string? EmergencyContactName { get; set; }

        [MaxLength(30)]
        public string? EmergencyContactPhone { get; set; }

        // ── Lifecycle ────────────────────────────────────────────────────
        /// <summary>
        /// Profile lifecycle. Persisted as a string for forward compatibility.
        /// Default <see cref="DriverProfileStatus.Incomplete"/> for new rows.
        /// </summary>
        public DriverProfileStatus Status { get; set; } = DriverProfileStatus.Incomplete;

        /// <summary>
        /// Real-time availability flag. Default
        /// <see cref="DriverAvailability.Unavailable"/> per the brief
        /// (drivers opt in). The system may set this to
        /// <see cref="DriverAvailability.Reserved"/> while assigned.
        /// </summary>
        public DriverAvailability Availability { get; set; } = DriverAvailability.Unavailable;

        /// <summary>
        /// Admin can disable an account (Phase Admin). Eligibility filter
        /// requires <c>IsActive = true</c>.
        /// </summary>
        public bool IsActive { get; set; } = true;

        // ── Admin review fields (mirror DriverLicense pattern) ───────────
        /// <summary>Reason supplied by the admin when rejecting.</summary>
        [MaxLength(500)]
        public string? RejectionReason { get; set; }

        /// <summary>Admin user who approved or rejected.</summary>
        public Guid? ReviewedBy { get; set; }

        /// <summary>Timestamp of the most recent admin review decision.</summary>
        public DateTime? ReviewedAt { get; set; }

        /// <summary>
        /// Set when an assignment exists: drives the
        /// <see cref="DriverAvailability.Reserved"/> auto-flip and lets the
        /// overlap check skip drivers whose lock window is still in force.
        /// Nullable — drivers without active assignments leave this null.
        /// </summary>
        public DateTime? LockedUntil { get; set; }

        // ── Concurrency token ────────────────────────────────────────────
        /// <summary>
        /// SQL Server <c>rowversion</c> used for optimistic concurrency.
        /// Every assignment-related operation (driver selection, change,
        /// cancellation, driver-initiated cancellation) mutates this profile
        /// row, so two concurrent operations on the same driver will produce a
        /// <see cref="Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException"/>
        /// on the second commit — preventing double assignment and overlapping
        /// reservations without a table lock.
        /// </summary>
        [System.ComponentModel.DataAnnotations.Timestamp]
        public byte[]? RowVersion { get; set; }

        // ── Navigation ───────────────────────────────────────────────────
        public ICollection<DriverWorkArea> WorkAreas { get; set; } = new List<DriverWorkArea>();
    }
}
