using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Driver;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Application.Exceptions;

namespace Backend.Application.Services
{
    public class DriverReviewService : IDriverReviewService
    {
        private readonly IDriverReviewRepository _reviewRepository;
        private readonly IBookingRepository _bookingRepository;

        public DriverReviewService(IDriverReviewRepository reviewRepository, IBookingRepository bookingRepository)
        {
            _reviewRepository = reviewRepository;
            _bookingRepository = bookingRepository;
        }

        public async Task<IEnumerable<DriverReviewDto>> GetReviewsForDriverAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            var reviews = await _reviewRepository.GetByDriverProfileIdAsync(driverProfileId, cancellationToken);
            return reviews.Select(r => new DriverReviewDto
            {
                Id = r.Id,
                BookingId = r.BookingId,
                DriverProfileId = r.DriverProfileId,
                CustomerId = r.CustomerId,
                CustomerName = r.Customer?.FirstName,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            }).ToList();
        }

        public async Task<DriverReviewDto> CreateReviewAsync(Guid bookingId, CreateDriverReviewRequest request, Guid customerId, CancellationToken cancellationToken = default)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken);
            if (booking == null) throw new NotFoundException("Booking not found.");
            if (booking.UserId != customerId) throw new ForbiddenException("You don't own this booking.");
            if (booking.AssignedDriverProfileId == null) throw new BadRequestException("No driver was assigned to this booking.");
            if (booking.Status != Backend.Domain.Entities.Enums.BookingStatus.Completed)
                throw new BadRequestException("You can only review a driver after the trip is completed.");

            // Check if review already exists
            var existing = await _reviewRepository.GetByBookingIdAsync(bookingId, cancellationToken);
            if (existing != null) throw new BadRequestException("Review already submitted.");

            var review = new DriverReview
            {
                BookingId = bookingId,
                DriverProfileId = booking.AssignedDriverProfileId.Value,
                CustomerId = customerId,
                Rating = request.Rating,
                Comment = request.Comment
            };

            await _reviewRepository.AddAsync(review, cancellationToken);
            await _reviewRepository.SaveChangesAsync(cancellationToken);

            return new DriverReviewDto
            {
                Id = review.Id,
                BookingId = review.BookingId,
                DriverProfileId = review.DriverProfileId,
                CustomerId = review.CustomerId,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt
            };
        }
    }
}
