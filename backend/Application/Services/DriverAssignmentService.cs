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
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services
{
    public class DriverAssignmentService : IDriverAssignmentService
    {
        private readonly IDriverProfileRepository _profileRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly IDriverRequestRepository _requestRepository;
        private readonly IDriverNotificationService _notificationService;
        private readonly IDriverRequestService _driverRequestService;

        public DriverAssignmentService(
            IDriverProfileRepository profileRepository,
            IBookingRepository bookingRepository,
            IDriverRequestRepository requestRepository,
            IDriverNotificationService notificationService,
            IDriverRequestService driverRequestService)
        {
            _profileRepository = profileRepository;
            _bookingRepository = bookingRepository;
            _requestRepository = requestRepository;
            _notificationService = notificationService;
            _driverRequestService = driverRequestService;
        }

        public async Task<IEnumerable<DriverAssignmentDto>> GetDriverAssignmentsAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            var bookings = await _bookingRepository.GetAssignmentsForDriverAsync(driverProfileId, cancellationToken);
            return bookings.Select(b => new DriverAssignmentDto
            {
                BookingId = b.Id,
                BookingNumber = b.Id.ToString(),
                PickupDate = b.PickupDate ?? DateTime.MinValue,
                ReturnDate = b.ReturnDate ?? DateTime.MinValue,
                PickupLocation = b.PickupLocation,
                DropoffLocation = b.PickupLocation,
                CustomerName = b.User != null ? $"{b.User.FirstName} {b.User.LastName}".Trim() : string.Empty,
                CustomerPhone = b.User?.PhoneNumber ?? string.Empty,
                VehicleName = b.Vehicle != null ? $"{b.Vehicle.Make} {b.Vehicle.Model}".Trim() : string.Empty,
                Earnings = b.DriverFee ?? 0m,
                Status = b.Status.ToString()
            }).ToList();
        }

        public async Task SelectDriverAsync(Guid bookingId, Guid driverProfileId, Guid customerId, CancellationToken cancellationToken = default)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken);
            if (booking == null) throw new NotFoundException("Booking not found.");
            if (booking.UserId != customerId) throw new ForbiddenException("You don't own this booking.");
            if (booking.AssignedDriverProfileId.HasValue)
                throw new BadRequestException("A driver is already assigned to this booking.");

            var request = await _requestRepository.GetByBookingIdAsync(bookingId, cancellationToken);
            if (request == null) throw new BadRequestException("No open request for this booking.");

            var requestWithResponses = await _requestRepository.GetByIdWithResponsesAsync(request.Id, cancellationToken);
            if (requestWithResponses == null || !requestWithResponses.Responses.Any(r => r.DriverProfileId == driverProfileId && r.Action == DriverResponseAction.Accepted))
            {
                throw new BadRequestException("This driver did not accept the request.");
            }

            if (!booking.PickupDate.HasValue || !booking.ReturnDate.HasValue)
                throw new BadRequestException("Booking is missing pickup/return dates.");

            // Overlap / double-booking prevention (business rules 9 & 10).
            var overlaps = await _profileRepository.HasOverlappingAssignmentAsync(
                driverProfileId, booking.PickupDate.Value, booking.ReturnDate.Value, booking.Id, cancellationToken);
            if (overlaps)
                throw new BadRequestException("This driver is already booked for an overlapping period.");

            var driverProfile = await _profileRepository.GetByIdAsync(driverProfileId, cancellationToken);
            if (driverProfile == null) throw new NotFoundException("Driver profile not found.");
            if (driverProfile.Status != DriverProfileStatus.Verified || !driverProfile.IsActive || driverProfile.Availability != DriverAvailability.Available)
                throw new BadRequestException("Driver is not eligible for assignment.");

            booking.AssignedDriverProfileId = driverProfileId;
            booking.DriverLockedUntil = booking.ReturnDate;
            booking.DriverAssignmentStatus = DriverAssignmentStatus.Assigned;
            // BookingStatus remains unchanged (e.g. Confirmed)

            request.Status = DriverRequestStatus.Fulfilled;
            request.FulfilledAt = DateTime.UtcNow;
            request.FulfilledByDriverProfileId = driverProfileId;

            driverProfile.LockedUntil = booking.ReturnDate;
            driverProfile.Availability = DriverAvailability.Reserved;
            await _profileRepository.UpdateAsync(driverProfile, cancellationToken);

            await _bookingRepository.UpdateAsync(booking, cancellationToken);
            await _requestRepository.UpdateAsync(request, cancellationToken);

            // Single atomic commit (booking + request + profile share one
            // DbContext). The DriverProfile rowversion makes this fail if
            // another selection mutated the same driver first — preventing a
            // double assignment / overlapping reservation under concurrency.
            try
            {
                await _bookingRepository.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new ConflictException(
                    "This driver was just assigned to another booking. Please refresh and choose another driver.");
            }

            await _notificationService.NotifyDriverAssignedAsync(driverProfile.UserId, booking, cancellationToken);

            // Notify the other interested drivers that they were not selected.
            var otherProfileIds = requestWithResponses.Responses
                .Where(x => x.DriverProfileId != driverProfileId)
                .Select(x => x.DriverProfileId)
                .Distinct()
                .ToList();

            var otherUserIds = new List<Guid>();
            foreach (var pid in otherProfileIds)
            {
                var p = await _profileRepository.GetByIdAsync(pid, cancellationToken);
                if (p != null) otherUserIds.Add(p.UserId);
            }
            await _notificationService.NotifyOtherDriversNotSelectedAsync(otherUserIds, booking, cancellationToken);
        }

        public async Task ChangeDriverAsync(Guid bookingId, ChangeDriverRequest request, Guid customerId, CancellationToken cancellationToken = default)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken);
            if (booking == null) throw new NotFoundException("Booking not found.");
            if (booking.UserId != customerId) throw new ForbiddenException("You don't own this booking.");

            if (booking.PickupDate.HasValue && DateTime.UtcNow > booking.PickupDate.Value.AddHours(-24))
            {
                throw new BadRequestException("Cannot change driver within 24 hours of pickup.");
            }

            var oldDriverProfileId = booking.AssignedDriverProfileId;
            booking.AssignedDriverProfileId = null;
            booking.DriverLockedUntil = null;
            booking.DriverAssignmentStatus = DriverAssignmentStatus.Waiting;
            await _bookingRepository.UpdateAsync(booking, cancellationToken);

            DriverProfile? oldProfile = null;
            if (oldDriverProfileId.HasValue)
            {
                oldProfile = await _profileRepository.GetByIdAsync(oldDriverProfileId.Value, cancellationToken);
                if (oldProfile != null)
                {
                    oldProfile.LockedUntil = null;
                    oldProfile.Availability = DriverAvailability.Available;
                    await _profileRepository.UpdateAsync(oldProfile, cancellationToken);
                }
            }

            // Atomic release of booking + old driver in one commit; rowversion
            // guards against a concurrent operation on the same driver.
            try
            {
                await _bookingRepository.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new ConflictException("The driver assignment changed concurrently. Please retry.");
            }

            if (oldProfile != null)
            {
                await _notificationService.NotifyDriverRemovedAsync(oldProfile.UserId, booking, cancellationToken);
            }

            // Re-open the driver search so the customer can pick a new driver.
            // (The prior request is Fulfilled, so a fresh Open request is created.)
            await _driverRequestService.CheckAndEmitRequestAsync(bookingId, cancellationToken);
        }

        public async Task CancelDriverAsync(Guid bookingId, Guid customerId, CancellationToken cancellationToken = default)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken);
            if (booking == null) throw new NotFoundException("Booking not found.");
            if (booking.UserId != customerId) throw new ForbiddenException("You don't own this booking.");

            // 24-hour rule (business rule 12): cannot cancel the driver inside the window.
            if (booking.PickupDate.HasValue && DateTime.UtcNow > booking.PickupDate.Value.AddHours(-24))
            {
                throw new BadRequestException("Cannot cancel driver within 24 hours of pickup.");
            }

            var oldDriverProfileId = booking.AssignedDriverProfileId;

            // Release the driver and drop the driver requirement on this booking.
            booking.AssignedDriverProfileId = null;
            booking.DriverLockedUntil = null;
            booking.RequiresDriver = false;
            booking.DriverAssignmentStatus = DriverAssignmentStatus.NotRequired;

            // Mark any open request for this booking as cancelled.
            var request = await _requestRepository.GetByBookingIdAsync(bookingId, cancellationToken);
            if (request != null)
            {
                request.Status = DriverRequestStatus.Cancelled;
                await _requestRepository.UpdateAsync(request, cancellationToken);
            }

            await _bookingRepository.UpdateAsync(booking, cancellationToken);

            DriverProfile? oldProfile = null;
            if (oldDriverProfileId.HasValue)
            {
                oldProfile = await _profileRepository.GetByIdAsync(oldDriverProfileId.Value, cancellationToken);
                if (oldProfile != null)
                {
                    oldProfile.LockedUntil = null;
                    oldProfile.Availability = DriverAvailability.Available;
                    await _profileRepository.UpdateAsync(oldProfile, cancellationToken);
                }
            }

            try
            {
                await _bookingRepository.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new ConflictException("The driver assignment changed concurrently. Please retry.");
            }

            if (oldProfile != null)
            {
                await _notificationService.NotifyDriverRemovedAsync(oldProfile.UserId, booking, cancellationToken);
            }
        }

        public async Task DriverCancelAssignmentAsync(Guid bookingId, Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken);
            if (booking == null) throw new NotFoundException("Booking not found.");
            if (booking.AssignedDriverProfileId != driverProfileId) throw new ForbiddenException("You are not assigned to this booking.");
            
            if (booking.PickupDate.HasValue && DateTime.UtcNow > booking.PickupDate.Value.AddHours(-24))
            {
                throw new BadRequestException("Cannot cancel assignment within 24 hours of pickup.");
            }
            
            booking.AssignedDriverProfileId = null;
            booking.DriverLockedUntil = null;
            booking.DriverAssignmentStatus = DriverAssignmentStatus.Waiting;

            var profile = await _profileRepository.GetByIdAsync(driverProfileId, cancellationToken);
            if (profile != null)
            {
                profile.LockedUntil = null;
                profile.Availability = DriverAvailability.Available;
                await _profileRepository.UpdateAsync(profile, cancellationToken);
            }

            await _bookingRepository.UpdateAsync(booking, cancellationToken);
            try
            {
                await _bookingRepository.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new ConflictException("The driver assignment changed concurrently. Please retry.");
            }

            await _notificationService.NotifyCustomerDriverCancelledAsync(booking.UserId, booking, cancellationToken);

            // Re-open the driver search so another driver can be selected.
            if (booking.RequiresDriver)
            {
                await _driverRequestService.CheckAndEmitRequestAsync(bookingId, cancellationToken);
            }
        }
    }
}
