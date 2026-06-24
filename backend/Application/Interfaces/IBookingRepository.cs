using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;

namespace Backend.Application.Interfaces;

/// <summary>
/// Repository interface for Booking entity with specialized booking operations
/// </summary>
public interface IBookingRepository : IPaginatedRepository<Booking>
{
    /// <summary>
    /// Atomically transitions <paramref name="booking"/> into a reserving
    /// status (typically <c>PaymentPending</c> or <c>Confirmed</c>) while
    /// guaranteeing no other booking holds the same vehicle for an overlapping
    /// window.
    ///
    /// On SQL Server this runs inside a SERIALIZABLE transaction and re-checks
    /// for overlapping reservations using <c>WITH (UPDLOCK, HOLDLOCK)</c> range
    /// locks, so two concurrent requests are serialised: the first wins, the
    /// second receives a <see cref="Backend.Application.Exceptions.ConflictException"/>
    /// (surfaced as HTTP 409). Any other pending changes already staged on the
    /// shared DbContext (e.g. a payment row, a driver-profile lock) are
    /// committed in the same transaction.
    /// </summary>
    /// <param name="booking">The tracked booking to transition.</param>
    /// <param name="targetStatus">The reserving status to move into.</param>
    /// <param name="holdStartedAt">Hold start (UTC) or null to clear.</param>
    /// <param name="holdExpiresAt">Hold expiry (UTC) or null to clear.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task ReserveVehicleAtomicAsync(
        Booking booking,
        BookingStatus targetStatus,
        DateTime? holdStartedAt,
        DateTime? holdExpiresAt,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets bookings for a specific user with optional filters
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="suppliers">Optional list of supplier IDs to filter by</param>
    /// <param name="statuses">Optional list of booking statuses to filter by</param>
    /// <param name="carId">Optional vehicle ID to filter by</param>
    /// <param name="fromDate">Optional start date filter</param>
    /// <param name="toDate">Optional end date filter</param>
    /// <param name="keyword">Optional keyword to search in booking number, vehicle name, and location names</param>
    /// <param name="pickupLocationId">Optional pickup location ID filter</param>
    /// <param name="dropOffLocationId">Optional drop-off location ID filter</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Collection of bookings matching the criteria</returns>
    Task<IEnumerable<Booking>> GetUserBookingsAsync(
        Guid userId,
        List<Guid>? suppliers = null,
        List<string>? statuses = null,
        Guid? carId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? keyword = null,
        Guid? pickupLocationId = null,
        Guid? dropOffLocationId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a vehicle has any active (non-cancelled) bookings
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if vehicle has active bookings, false otherwise</returns>
    Task<bool> HasActiveBookingsAsync(
        Guid vehicleId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a user has any bookings
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if user has bookings, false otherwise</returns>
    Task<bool> HasUserBookingsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <returns>Booking with all related data if found, null otherwise</returns>
    Task<Booking?> GetBookingWithDetailsAsync(
        Guid bookingId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all bookings with optional filters (Admin/Supplier view)
    /// </summary>
    /// <param name="supplierId">Optional supplier ID to filter by</param>
    /// <param name="statuses">Optional list of statuses</param>
    /// <param name="carId">Optional vehicle ID</param>
    /// <param name="fromDate">Optional start date</param>
    /// <param name="toDate">Optional end date</param>
    /// <param name="keyword">Optional keyword</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Collection of bookings</returns>
    Task<IEnumerable<Booking>> GetAdminBookingsAsync(
        Guid? supplierId = null,
        List<string>? statuses = null,
        Guid? carId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? keyword = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// All bookings currently assigned to the given driver profile, including
    /// customer and vehicle navigation for display in the driver's
    /// assignments list. Ordered by pickup date.
    /// </summary>
    Task<IEnumerable<Booking>> GetAssignmentsForDriverAsync(
        Guid driverProfileId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all bookings that are confirmed and starting within the specified time,
    /// and haven't exceeded pickup assignment retry limits.
    /// </summary>
    Task<IEnumerable<Booking>> GetBookingsForPickupAutoAssignmentAsync(
        DateTime targetTime,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all bookings that are active and returning within the specified time,
    /// and haven't exceeded return assignment retry limits.
    /// </summary>
    Task<IEnumerable<Booking>> GetBookingsForReturnAutoAssignmentAsync(
        DateTime targetTime,
        CancellationToken cancellationToken = default);
}
