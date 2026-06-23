using Backend.Application.DTOs.Booking;
using Backend.Application.DTOs.Common;

namespace Backend.Application.Services;

/// <summary>
/// Service interface for booking-related operations
/// </summary>
public interface IBookingService
{
    /// <summary>
    /// Creates a new booking for a vehicle
    /// </summary>
    /// <param name="request">Booking creation request</param>
    /// <param name="userId">ID of the user creating the booking</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Booking response with booking details</returns>
    Task<BookingResponse> CreateBookingAsync(
        CreateBookingRequest request,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets paginated list of user bookings with filters
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="request">Booking list request with filters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated booking list</returns>
    Task<PagedResult<BookingListDto>> GetUserBookingsAsync(
        Guid userId,
        BookingListRequest request,
        string? sortBy = null,
        string? sortOrder = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets detailed information about a specific booking
    /// </summary>
    /// <param name="bookingId">Booking ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Booking details</returns>
    Task<BookingDetailsDto> GetBookingDetailsAsync(
        Guid bookingId,
        Guid userId,
        bool isAdmin = false,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Cancels a booking
    /// </summary>
    /// <param name="bookingId">Booking ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if cancellation was successful</returns>
    Task<bool> CancelBookingAsync(
        Guid bookingId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a user has any bookings
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if user has bookings</returns>
    Task<bool> HasUserBookingsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a paginated list of bookings for the admin/supplier dashboard
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="size">Page size</param>
    /// <param name="request">Filter request</param>
    /// <param name="currentUserId">ID of the authenticated user</param>
    /// <param name="isAdmin">Whether the authenticated user is an admin</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of bookings</returns>
    Task<PagedResult<BookingListDto>> GetAdminBookingsAsync(
        int page,
        int size,
        BookingListRequest request,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets booking statistics for admin dashboard
    /// </summary>
    /// <param name="currentUserId">ID of the authenticated user</param>
    /// <param name="isAdmin">Whether the authenticated user is an admin</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Admin booking statistics</returns>
    Task<AdminBookingStatsDto> GetAdminBookingStatsAsync(
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    Task<AdminBookingAnalyticsDto> GetAdminBookingAnalyticsAsync(
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets detailed information about a specific booking for admin/supplier
    /// </summary>
    /// <param name="bookingId">Booking ID</param>
    /// <param name="currentUserId">ID of the authenticated user</param>
    /// <param name="isAdmin">Whether the user is an admin</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Booking details</returns>
    Task<BookingDetailsDto> GetAdminBookingByIdAsync(
        Guid bookingId,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates the status of a booking
    /// </summary>
    /// <param name="bookingId">Booking ID</param>
    /// <param name="newStatus">New status</param>
    /// <param name="userId">ID of the user performing the update</param>
    /// <param name="isAdmin">Whether the user is an admin</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if the update was successful</returns>
    Task<bool> UpdateBookingStatusAsync(
        Guid bookingId,
        string newStatus,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Partially updates a booking. Only the editable fields
    /// (dates, locations, status) can be changed. Recalculates total days
    /// and total price when dates change.
    /// </summary>
    /// <returns>The refreshed booking details</returns>
    Task<BookingDetailsDto> UpdateBookingAsync(
        Guid bookingId,
        UpdateBookingRequest request,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes multiple bookings
    /// </summary>
    /// <param name="bookingIds">List of booking IDs to delete</param>
    /// <param name="userId">ID of the user performing the deletion</param>
    /// <param name="isAdmin">Whether the user is an admin</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if deletion was successful</returns>
    Task<bool> DeleteBookingsAsync(
        List<Guid> bookingIds,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    Task<Backend.Application.Interfaces.RefundResult> GetRefundPreviewAsync(Guid bookingId, CancellationToken ct = default);
}
