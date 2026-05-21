using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Review;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services;

/// <summary>
/// Service implementation for review-related operations
/// Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
/// </summary>
public class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviewRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IApplicationDbContext _context;
    // Optional + nullable so existing unit tests that don't pass a notification
    // service keep compiling. Admin fan-out below is therefore best-effort.
    private readonly INotificationService? _notificationService;

    public ReviewService(
        IReviewRepository reviewRepository,
        IBookingRepository bookingRepository,
        IVehicleRepository vehicleRepository,
        IApplicationDbContext context,
        INotificationService? notificationService = null)
    {
        _reviewRepository = reviewRepository;
        _bookingRepository = bookingRepository;
        _vehicleRepository = vehicleRepository;
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<PagedResult<ReviewDto>> GetVehicleReviewsAsync(
        Guid vehicleId,
        int page,
        int pageSize,
        string sortBy,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle == null)
        {
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        var reviews = await _reviewRepository.GetVehicleReviewsAsync(
            vehicleId,
            page,
            pageSize,
            sortBy,
            cancellationToken);

        var totalCount = await _context.Reviews
            .CountAsync(r => r.VehicleId == vehicleId, cancellationToken);

        var reviewDtos = reviews.Select(r => new ReviewDto(
            r.Id,
            r.VehicleId,
            r.UserId,
            $"{r.User?.FirstName} {r.User?.LastName}".Trim(),
            r.Rating ?? 0,
            r.Comment,
            r.AdminResponse,
            r.SupplierReply,
            r.RepliedAt,
            r.CreatedAt
        )).ToList();

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResult<ReviewDto>(
            reviewDtos,
            page,
            pageSize,
            totalCount,
            totalPages);
    }

    public async Task<ReviewResponse> CreateReviewAsync(
        CreateReviewRequest request,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);
        if (vehicle == null)
        {
            throw new NotFoundException($"Vehicle with ID {request.VehicleId} not found");
        }

        var booking = await _bookingRepository.GetBookingWithDetailsAsync(
            request.BookingId,
            cancellationToken);

        if (booking == null)
        {
            throw new NotFoundException($"Booking with ID {request.BookingId} not found");
        }

        if (booking.UserId != userId)
        {
            throw new ForbiddenException("You can only review vehicles from your own bookings");
        }

        if (booking.VehicleId != request.VehicleId)
        {
            throw new ValidationException("BookingId", "The booking does not match the vehicle being reviewed");
        }

        if (!IsBookingCompleted(booking))
        {
            throw new ValidationException("BookingId", "You can only review vehicles from completed bookings");
        }

        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.BookingId == request.BookingId, cancellationToken);

        if (existingReview != null)
        {
            throw new ConflictException("A review already exists for this booking");
        }

        var review = new Review
        {
            VehicleId = request.VehicleId,
            UserId = userId,
            BookingId = request.BookingId,
            Rating = request.Rating,
            Comment = request.Comment
        };

        var createdReview = await _reviewRepository.AddAsync(review, cancellationToken);
        await _reviewRepository.SaveChangesAsync(cancellationToken);

        // Fan-out to admins so the admin notification feed reflects real
        // platform activity. Best-effort — never roll back the review save.
        if (_notificationService is not null)
        {
            try
            {
                var vehicleLabel = string.IsNullOrWhiteSpace(vehicle.Make) && string.IsNullOrWhiteSpace(vehicle.Model)
                    ? "a vehicle"
                    : $"{vehicle.Make} {vehicle.Model}".Trim();
                await _notificationService.NotifyAdminsAsync(
                    "New review submitted",
                    $"A customer submitted a {request.Rating}-star review for {vehicleLabel}.",
                    "ReviewSubmitted",
                    cancellationToken);
            }
            catch
            {
                // Best-effort only.
            }
        }

        return new ReviewResponse(
            createdReview.Id,
            createdReview.VehicleId,
            createdReview.Rating ?? 0,
            "Review created successfully");
    }

    private bool IsBookingCompleted(Booking booking)
    {
        var completedStatuses = new[] { Backend.Domain.Entities.Enums.BookingStatus.Completed, Backend.Domain.Entities.Enums.BookingStatus.Confirmed };
        var isStatusCompleted = completedStatuses.Contains(booking.Status);

        if (!isStatusCompleted)
        {
            return false;
        }

        if (booking.ReturnDate.HasValue && booking.ReturnDate.Value > DateTime.UtcNow)
        {
            return false;
        }

        return true;
    }

    /// <summary>
    /// 24-hour edit window. Reviews become read-only after this time.
    /// </summary>
    private static readonly TimeSpan EditWindow = TimeSpan.FromHours(24);

    private static BookingReviewDto ToBookingReviewDto(Review review)
    {
        var editDeadline = review.CreatedAt + EditWindow;
        return new BookingReviewDto(
            review.Id,
            review.BookingId,
            review.VehicleId,
            review.UserId,
            review.Rating ?? 0,
            review.Comment,
            review.CreatedAt,
            review.UpdatedAt,
            editDeadline,
            DateTime.UtcNow < editDeadline);
    }

    public async Task<BookingReviewDto?> GetReviewByBookingAsync(
        Guid bookingId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // Verify the booking exists and belongs to the caller before exposing review data.
        var booking = await _bookingRepository.GetBookingWithDetailsAsync(bookingId, cancellationToken);
        if (booking == null)
        {
            throw new NotFoundException($"Booking with ID {bookingId} not found");
        }

        if (booking.UserId != userId)
        {
            throw new ForbiddenException("You can only view reviews for your own bookings");
        }

        var review = await _context.Reviews
            .FirstOrDefaultAsync(r => r.BookingId == bookingId, cancellationToken);

        return review == null ? null : ToBookingReviewDto(review);
    }

    public async Task<BookingReviewDto> UpdateReviewAsync(
        Guid reviewId,
        UpdateReviewRequest request,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var review = await _context.Reviews
            .FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);

        if (review == null)
        {
            throw new NotFoundException($"Review with ID {reviewId} not found");
        }

        if (review.UserId != userId)
        {
            throw new ForbiddenException("You can only edit your own reviews");
        }

        // Block editing past the 24h window.
        if (DateTime.UtcNow >= review.CreatedAt + EditWindow)
        {
            throw new ValidationException("EditWindow", "This review can no longer be edited (24 hour window expired)");
        }

        review.Rating = request.Rating;
        review.Comment = request.Comment;
        review.UpdatedAt = DateTime.UtcNow;

        await _reviewRepository.UpdateAsync(review, cancellationToken);
        await _reviewRepository.SaveChangesAsync(cancellationToken);

        return ToBookingReviewDto(review);
    }
}
