using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Review;

namespace Backend.Application.Services;

/// <summary>
/// Service interface for review-related operations
/// </summary>
public interface IReviewService
{
    /// <summary>
    /// Gets reviews for a specific vehicle with pagination and sorting
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <param name="sortBy">Sort field (date, rating, helpfulness)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of reviews</returns>
    Task<PagedResult<ReviewDto>> GetVehicleReviewsAsync(
        Guid vehicleId,
        int page,
        int pageSize,
        string sortBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new review for a vehicle
    /// </summary>
    /// <param name="request">Review creation request</param>
    /// <param name="userId">User ID creating the review</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Review creation response</returns>
    Task<ReviewResponse> CreateReviewAsync(
        CreateReviewRequest request,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the review attached to a specific booking, if any.
    /// Used by the customer Booking Details page only.
    /// Returns null when no review exists yet for the booking.
    /// </summary>
    /// <param name="bookingId">Booking ID</param>
    /// <param name="userId">Authenticated user ID (must own the booking)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task<BookingReviewDto?> GetReviewByBookingAsync(
        Guid bookingId,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing review owned by the user, only if the 24h edit window
    /// has not expired.
    /// </summary>
    /// <param name="reviewId">Review ID</param>
    /// <param name="request">Updated rating and comment</param>
    /// <param name="userId">Authenticated user ID (must own the review)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task<BookingReviewDto> UpdateReviewAsync(
        Guid reviewId,
        UpdateReviewRequest request,
        Guid userId,
        CancellationToken cancellationToken = default);
}
