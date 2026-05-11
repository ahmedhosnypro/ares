namespace Backend.Application.Services;

/// <summary>
/// Central registry of supplier-notification type tags + helpers that
/// encode the deep-link entity id into the existing
/// <see cref="Backend.Domain.Entities.Notification.Type"/> column.
///
/// The notification table's <c>Type</c> field is <c>nvarchar(64)</c>.
/// The format we write is <c>"&lt;Tag&gt;:&lt;Guid&gt;"</c> (e.g.
/// <c>"VehicleApproved:8a3b…"</c>) — the longest tag we use is
/// <c>VehiclePendingReview</c> (20 chars) so even with a 36-char Guid
/// the value stays comfortably under the 64-char cap.
///
/// Why this approach (vs. adding columns to the entity)?
///   * No schema migration is needed — the supplier notifications
///     module can ship without touching the EF snapshot file or
///     coordinating a DB deployment.
///   * Existing customer notifications (with simple type tags like
///     <c>"BookingApproved"</c>) keep working unchanged. The parser
///     treats any tag without a <c>":"</c> separator as a plain tag
///     with no entity id, so the schema stays backward compatible.
///   * The supplier service derives <c>entity_type</c>, <c>entity_id</c>
///     and <c>redirect_url</c> at read time using <see cref="Parse"/>,
///     so the wire DTO matches the spec exactly.
/// </summary>
public static class SupplierNotificationTypes
{
    /// <summary>Separator between the type tag and the optional entity id.</summary>
    public const char Separator = ':';

    // ── Type tags used by supplier notifications ─────────────────────────
    // Tags suffixed with "Supplier" exist where there's already a
    // customer-facing tag with the same prefix (e.g. "BookingCompleted"
    // is sent to the customer; "BookingCompletedSupplier" is sent to
    // the vehicle owner). This avoids any chance of the customer tag
    // being misinterpreted as a supplier deep-link.

    public const string VehicleApproved = "VehicleApproved";
    public const string VehicleRejected = "VehicleRejected";
    public const string VehiclePendingReview = "VehiclePendingReview";
    public const string BookingReceived = "BookingReceived";
    public const string BookingCompletedSupplier = "BookingCompletedSupplier";

    // ── Entity-type logical names ────────────────────────────────────────
    public const string EntityTypeVehicle = "Vehicle";
    public const string EntityTypeBooking = "Booking";

    /// <summary>
    /// Builds a structured type value for storage in <c>Notification.Type</c>.
    /// </summary>
    public static string Format(string tag, Guid entityId) =>
        $"{tag}{Separator}{entityId:D}";

    /// <summary>
    /// Splits a stored type value back into its tag and (optional) entity id.
    /// Falls back gracefully: a value with no separator is returned as
    /// <paramref name="tag"/> with <paramref name="entityId"/> = null;
    /// a value with an unparseable Guid after the separator likewise
    /// yields a null id (rather than throwing).
    /// </summary>
    public static void Parse(string? raw, out string? tag, out Guid? entityId)
    {
        tag = null;
        entityId = null;
        if (string.IsNullOrWhiteSpace(raw)) return;

        var sepIndex = raw.IndexOf(Separator);
        if (sepIndex < 0)
        {
            tag = raw;
            return;
        }

        tag = raw[..sepIndex];
        var idSegment = raw[(sepIndex + 1)..];
        if (Guid.TryParse(idSegment, out var parsed))
        {
            entityId = parsed;
        }
    }

    /// <summary>
    /// Returns the logical entity name ("Vehicle" / "Booking") for a tag.
    /// Returns null when the tag is unknown or doesn't refer to an entity.
    /// </summary>
    public static string? EntityTypeFor(string? tag) => tag switch
    {
        VehicleApproved or VehicleRejected or VehiclePendingReview => EntityTypeVehicle,
        BookingReceived or BookingCompletedSupplier => EntityTypeBooking,
        _ => null,
    };

    /// <summary>
    /// Computes the supplier-portal redirect URL for a tag + entity id.
    /// Returns null when no deep link can be produced (unknown tag, or
    /// known tag but no id).
    /// </summary>
    public static string? RedirectUrlFor(string? tag, Guid? entityId)
    {
        if (entityId is null) return null;
        var id = entityId.Value.ToString("D");

        return tag switch
        {
            VehicleApproved or VehicleRejected or VehiclePendingReview
                => $"/supplier/vehicles/{id}",
            BookingReceived or BookingCompletedSupplier
                => $"/supplier/bookings/{id}",
            _ => null,
        };
    }
}
