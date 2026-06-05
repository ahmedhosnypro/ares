using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Driver;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Application.Exceptions;

namespace Backend.Application.Services
{
    public class DriverRequestService : IDriverRequestService
    {
        private readonly IDriverRequestRepository _requestRepository;
        private readonly IDriverProfileRepository _profileRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly IDriverPricingService _pricingService;
        private readonly IDriverNotificationService _notificationService;
        private readonly IDriverReviewRepository _reviewRepository;
        private readonly IServiceAreaRepository _serviceAreaRepository;

        public DriverRequestService(
            IDriverRequestRepository requestRepository,
            IDriverProfileRepository profileRepository,
            IBookingRepository bookingRepository,
            IDriverPricingService pricingService,
            IDriverNotificationService notificationService,
            IDriverReviewRepository reviewRepository,
            IServiceAreaRepository serviceAreaRepository)
        {
            _requestRepository = requestRepository;
            _profileRepository = profileRepository;
            _bookingRepository = bookingRepository;
            _pricingService = pricingService;
            _notificationService = notificationService;
            _reviewRepository = reviewRepository;
            _serviceAreaRepository = serviceAreaRepository;
        }

        public async Task<IEnumerable<DriverRequestDto>> GetAvailableRequestsAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            var profile = await _profileRepository.GetByIdWithWorkAreasAsync(driverProfileId, cancellationToken);
            if (profile == null) throw new NotFoundException("Driver profile not found.");

            if (profile.Status != DriverProfileStatus.Verified || profile.Availability != DriverAvailability.Available || !profile.IsActive)
            {
                return Enumerable.Empty<DriverRequestDto>();
            }

            var serviceAreaIds = profile.WorkAreas.Select(wa => wa.ServiceAreaId).ToList();
            var requests = new List<DriverRequest>();

            foreach (var areaId in serviceAreaIds)
            {
                var areaRequests = await _requestRepository.GetOpenRequestsForServiceAreaAsync(areaId, cancellationToken);
                requests.AddRange(areaRequests);
            }

            var uniqueRequests = requests.DistinctBy(r => r.Id).ToList();
            var dtos = new List<DriverRequestDto>();

            var dailyRate = await _pricingService.GetDailyRateAsync(cancellationToken);

            foreach (var r in uniqueRequests)
            {
                var booking = await _bookingRepository.GetByIdAsync(r.BookingId, cancellationToken);
                if (booking != null && booking.PickupDate.HasValue && booking.ReturnDate.HasValue)
                {
                    var hasOverlap = await _profileRepository.HasOverlappingAssignmentAsync(driverProfileId, booking.PickupDate.Value, booking.ReturnDate.Value, null, cancellationToken);
                    if (!hasOverlap)
                    {
                        var hasResponded = await _requestRepository.GetByIdWithResponsesAsync(r.Id, cancellationToken);
                        
                        dtos.Add(new DriverRequestDto
                        {
                            Id = r.Id,
                            BookingId = r.BookingId,
                            PickupDate = booking.PickupDate.Value,
                            ReturnDate = booking.ReturnDate.Value,
                            PickupLocationText = r.PickupLocationText,
                            PickupServiceAreaId = r.PickupServiceAreaId,
                            Status = r.Status,
                            ExpiresAt = r.ExpiresAt,
                            EstimatedEarnings = (booking.TotalDays ?? 1) * dailyRate,
                            HasResponded = hasResponded?.Responses.Any(res => res.DriverProfileId == driverProfileId) ?? false
                        });
                    }
                }
            }

            return dtos;
        }

        public async Task<IEnumerable<DriverRequestDto>> GetMyRequestsAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            var requests = await _requestRepository.GetRequestsRespondedByDriverAsync(driverProfileId, cancellationToken);
            var dtos = new List<DriverRequestDto>();
            var dailyRate = await _pricingService.GetDailyRateAsync(cancellationToken);

            foreach (var r in requests)
            {
                dtos.Add(new DriverRequestDto
                {
                    Id = r.Id,
                    BookingId = r.BookingId,
                    PickupDate = r.Booking?.PickupDate ?? DateTime.MinValue,
                    ReturnDate = r.Booking?.ReturnDate ?? DateTime.MinValue,
                    PickupLocationText = r.PickupLocationText,
                    PickupServiceAreaId = r.PickupServiceAreaId,
                    Status = r.Status,
                    ExpiresAt = r.ExpiresAt,
                    EstimatedEarnings = (r.Booking?.TotalDays ?? 1) * dailyRate,
                    HasResponded = true
                });
            }

            return dtos;
        }

        public async Task AcceptRequestAsync(Guid driverProfileId, Guid requestId, CancellationToken cancellationToken = default)
        {
            var request = await _requestRepository.GetByIdWithResponsesAsync(requestId, cancellationToken);
            if (request == null) throw new NotFoundException("Request not found.");

            if (request.Status != DriverRequestStatus.Open)
            {
                throw new BadRequestException("Request is not open.");
            }

            if (request.ExpiresAt <= DateTime.UtcNow)
            {
                throw new BadRequestException("Request has expired.");
            }

            if (request.Responses.Any(r => r.DriverProfileId == driverProfileId))
            {
                throw new BadRequestException("You have already responded to this request.");
            }

            var booking = await _bookingRepository.GetByIdAsync(request.BookingId, cancellationToken);
            if (booking != null && booking.PickupDate.HasValue && booking.ReturnDate.HasValue)
            {
                var hasOverlap = await _profileRepository.HasOverlappingAssignmentAsync(driverProfileId, booking.PickupDate.Value, booking.ReturnDate.Value, null, cancellationToken);
                if (hasOverlap)
                {
                    throw new BadRequestException("You already have a booking that overlaps with this request's dates.");
                }
            }

            request.Responses.Add(new DriverRequestResponse
            {
                DriverRequestId = request.Id,
                DriverProfileId = driverProfileId,
                Action = DriverResponseAction.Accepted,
                RespondedAt = DateTime.UtcNow
            });

            await _requestRepository.UpdateAsync(request, cancellationToken);
            await _requestRepository.SaveChangesAsync(cancellationToken);

            if (booking != null)
            {
                await _notificationService.NotifyCustomerDriverAcceptedAsync(booking.UserId, booking, cancellationToken);
            }
        }

        public async Task DeclineRequestAsync(Guid driverProfileId, Guid requestId, CancellationToken cancellationToken = default)
        {
            var request = await _requestRepository.GetByIdWithResponsesAsync(requestId, cancellationToken);
            if (request == null) throw new NotFoundException("Request not found.");

            if (request.Status != DriverRequestStatus.Open)
            {
                throw new BadRequestException("Request is not open.");
            }

            if (request.Responses.Any(r => r.DriverProfileId == driverProfileId))
            {
                throw new BadRequestException("You have already responded to this request.");
            }

            request.Responses.Add(new DriverRequestResponse
            {
                DriverRequestId = request.Id,
                DriverProfileId = driverProfileId,
                Action = DriverResponseAction.Declined,
                RespondedAt = DateTime.UtcNow
            });

            await _requestRepository.UpdateAsync(request, cancellationToken);
            await _requestRepository.SaveChangesAsync(cancellationToken);
        }

        public async Task<IEnumerable<PublicDriverDto>> GetInterestedDriversAsync(Guid bookingId, Guid customerId, CancellationToken cancellationToken = default)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken);
            if (booking == null) throw new NotFoundException("Booking not found.");
            if (booking.UserId != customerId) throw new ForbiddenException("You don't own this booking.");

            var request = await _requestRepository.GetByBookingIdAsync(bookingId, cancellationToken);
            if (request == null) return Enumerable.Empty<PublicDriverDto>();

            var requestWithResponses = await _requestRepository.GetByIdWithResponsesAsync(request.Id, cancellationToken);
            if (requestWithResponses == null) return Enumerable.Empty<PublicDriverDto>();

            var driverDtos = new List<PublicDriverDto>();

            foreach (var res in requestWithResponses.Responses.Where(r => r.Action == DriverResponseAction.Accepted))
            {
                var dp = await _profileRepository.GetByIdWithUserAsync(res.DriverProfileId, cancellationToken);
                if (dp != null && dp.IsActive)
                {
                    var (avgRating, totalTrips) = await _reviewRepository.GetDriverRatingStatsAsync(dp.Id, cancellationToken);

                    // PII-safe projection (business rule 8): expose only photo, name,
                    // rating and completed trips. Phone, email, address, license and
                    // national-ID images are deliberately NOT included.
                    driverDtos.Add(new PublicDriverDto
                    {
                        DriverProfileId = dp.Id,
                        FirstName = dp.User?.FirstName,
                        LastName = dp.User?.LastName,
                        ProfilePictureUrl = dp.User?.ProfileImage,
                        AverageRating = avgRating,
                        TotalTrips = totalTrips
                    });
                }
            }

            return driverDtos;
        }

        public async Task RetryRequestAsync(Guid bookingId, Guid customerId, CancellationToken cancellationToken = default)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken);
            if (booking == null) throw new NotFoundException("Booking not found.");
            if (booking.UserId != customerId) throw new ForbiddenException("You don't own this booking.");

            if (booking.DriverAssignmentStatus != DriverAssignmentStatus.Expired)
            {
                throw new BadRequestException("Booking must be in Expired driver assignment status to retry.");
            }

            booking.DriverAssignmentStatus = DriverAssignmentStatus.Waiting;
            await _bookingRepository.UpdateAsync(booking, cancellationToken);
            
            await CheckAndEmitRequestAsync(bookingId, cancellationToken);
        }

        public async Task CheckAndEmitRequestAsync(Guid bookingId, CancellationToken cancellationToken = default)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken);
            if (booking == null || !booking.RequiresDriver || booking.AssignedDriverProfileId.HasValue) return;

            var existingRequest = await _requestRepository.GetByBookingIdAsync(bookingId, cancellationToken);
            if (existingRequest != null) return;

            // Resolve the pickup location text to a known service area so the
            // work-area matching (GetOpenRequestsForServiceAreaAsync) can find
            // this request. Without a PickupServiceAreaId no driver would ever
            // be matched.
            Guid? pickupServiceAreaId = null;
            if (!string.IsNullOrWhiteSpace(booking.PickupLocation))
            {
                var area = await _serviceAreaRepository.GetByNameAsync(booking.PickupLocation.Trim(), cancellationToken);
                if (area == null)
                {
                    // Fallback: match any active area whose name is contained in the pickup text.
                    var activeAreas = await _serviceAreaRepository.GetActiveAreasAsync(cancellationToken);
                    area = activeAreas.FirstOrDefault(a =>
                        booking.PickupLocation.Contains(a.Name, StringComparison.OrdinalIgnoreCase));
                }
                pickupServiceAreaId = area?.Id;
            }

            var newRequest = new DriverRequest
            {
                BookingId = bookingId,
                PickupServiceAreaId = pickupServiceAreaId,
                PickupLocationText = booking.PickupLocation,
                Status = DriverRequestStatus.Open,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60)
            };

            await _requestRepository.AddAsync(newRequest, cancellationToken);
            await _requestRepository.SaveChangesAsync(cancellationToken);

            // Notify eligible drivers in the pickup service area (business rules 5, 6, 17).
            if (pickupServiceAreaId.HasValue)
            {
                var eligible = await _profileRepository.GetEligibleDriversForServiceAreaAsync(pickupServiceAreaId.Value, cancellationToken);
                var driverUserIds = eligible.Select(d => d.UserId).ToList();
                await _notificationService.NotifyDriversOfNewRequestAsync(newRequest, driverUserIds, cancellationToken);
            }
        }

        public async Task ProcessExpirationsAsync(CancellationToken cancellationToken = default)
        {
            var expired = await _requestRepository.GetExpiredRequestsAsync(cancellationToken);
            foreach (var req in expired)
            {
                var rWithResponses = await _requestRepository.GetByIdWithResponsesAsync(req.Id, cancellationToken);
                if (rWithResponses != null && !rWithResponses.Responses.Any(r => r.Action == DriverResponseAction.Accepted))
                {
                    var booking = await _bookingRepository.GetByIdAsync(req.BookingId, cancellationToken);
                    if (booking != null)
                    {
                        booking.DriverAssignmentStatus = DriverAssignmentStatus.Expired;
                        await _bookingRepository.UpdateAsync(booking, cancellationToken);
                        await _notificationService.NotifyCustomerNoDriverAvailableAsync(booking.UserId, booking, cancellationToken);
                    }
                }
                req.Status = DriverRequestStatus.Expired;
                await _requestRepository.UpdateAsync(req, cancellationToken);
            }
            if (expired.Any())
            {
                await _requestRepository.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
