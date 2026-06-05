using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Driver;
using Backend.Application.Interfaces;
using Backend.Application.Exceptions;
using Backend.Domain.Entities.Enums;

namespace Backend.Application.Services
{
    public class DriverDashboardService : IDriverDashboardService
    {
        private readonly IDriverProfileRepository _profileRepository;
        private readonly IDriverReviewRepository _reviewRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly IDriverRequestRepository _requestRepository;

        public DriverDashboardService(
            IDriverProfileRepository profileRepository,
            IDriverReviewRepository reviewRepository,
            IBookingRepository bookingRepository,
            IDriverRequestRepository requestRepository)
        {
            _profileRepository = profileRepository;
            _reviewRepository = reviewRepository;
            _bookingRepository = bookingRepository;
            _requestRepository = requestRepository;
        }

        public async Task<DriverDashboardSummaryDto> GetSummaryAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            var profile = await _profileRepository.GetByIdAsync(driverProfileId, cancellationToken);
            if (profile == null) throw new NotFoundException("Driver profile not found.");

            var (avgRating, _) = await _reviewRepository.GetDriverRatingStatsAsync(driverProfileId, cancellationToken);

            // All bookings ever assigned to this driver (cancelled excluded for "total").
            var assignments = (await _bookingRepository.GetAssignmentsForDriverAsync(driverProfileId, cancellationToken)).ToList();
            var now = DateTime.UtcNow;

            var totalTrips = assignments.Count(b => b.Status != BookingStatus.Cancelled);
            var completedTrips = assignments.Count(b => b.Status == BookingStatus.Completed);
            var activeTrips = assignments.Count(b =>
                b.Status == BookingStatus.Active || (b.Status == BookingStatus.Confirmed && b.InspectionStatus == InspectionStatus.Approved));
            var upcomingTrips = assignments.Count(b =>
                b.Status == BookingStatus.Confirmed
                && b.PickupDate.HasValue && b.PickupDate.Value > now);

            // Earnings recognised on completed trips only.
            var totalEarnings = assignments
                .Where(b => b.Status == BookingStatus.Completed)
                .Sum(b => b.DriverFee ?? 0m);

            // Open requests the driver has expressed interest in but are not yet resolved.
            var myRequests = await _requestRepository.GetRequestsRespondedByDriverAsync(driverProfileId, cancellationToken);
            var activeRequestsCount = myRequests.Count(r => r.Status == DriverRequestStatus.Open);

            return new DriverDashboardSummaryDto
            {
                Status = profile.Status.ToString(),
                Availability = profile.Availability.ToString(),
                IsActive = profile.IsActive,
                AverageRating = avgRating,
                TotalEarnings = totalEarnings,
                TotalTrips = totalTrips,
                ActiveTrips = activeTrips,
                CompletedTrips = completedTrips,
                UpcomingTrips = upcomingTrips,
                // Back-compat fields
                TotalTripsCompleted = completedTrips,
                ActiveRequestsCount = activeRequestsCount,
                UpcomingAssignmentsCount = upcomingTrips
            };
        }
    }
}
