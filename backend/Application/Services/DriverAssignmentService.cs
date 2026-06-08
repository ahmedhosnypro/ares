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
        private readonly IDriverNotificationService _notificationService;
        private readonly IApplicationDbContext _context;
        private readonly IDriverReviewRepository _driverReviewRepository;
        private readonly IDriverPricingService _driverPricingService;

        public DriverAssignmentService(
            IDriverProfileRepository profileRepository,
            IBookingRepository bookingRepository,
            IDriverNotificationService notificationService,
            IApplicationDbContext context,
            IDriverReviewRepository driverReviewRepository,
            IDriverPricingService driverPricingService)
        {
            _profileRepository = profileRepository;
            _bookingRepository = bookingRepository;
            _notificationService = notificationService;
            _context = context;
            _driverReviewRepository = driverReviewRepository;
            _driverPricingService = driverPricingService;
        }

        public async Task<IEnumerable<DriverAssignmentDto>> GetDriverAssignmentsAsync(Guid driverProfileId, CancellationToken cancellationToken = default)
        {
            var bookings = await _bookingRepository.GetAssignmentsForDriverAsync(driverProfileId, cancellationToken);

            var results = new List<DriverAssignmentDto>();
            foreach (var b in bookings)
            {
                var pickupName = await ResolveDisplayLocationAsync(b.PickupLocation, cancellationToken);
                var dropoffName = await ResolveDisplayLocationAsync(b.DropoffLocation, cancellationToken);

                results.Add(new DriverAssignmentDto
                {
                    BookingId = b.Id,
                    BookingNumber = b.BookingNumber ?? b.Id.ToString(),
                    PickupDate = b.PickupDate ?? DateTime.MinValue,
                    ReturnDate = b.ReturnDate ?? DateTime.MinValue,
                    PickupLocation = pickupName,
                    DropoffLocation = dropoffName,
                    CustomerName = b.User != null ? $"{b.User.FirstName} {b.User.LastName}".Trim() : string.Empty,
                    CustomerPhone = b.User?.PhoneNumber ?? string.Empty,
                    VehicleName = b.Vehicle != null ? $"{b.Vehicle.Make} {b.Vehicle.Model}".Trim() : string.Empty,
                    Earnings = b.DriverFee ?? 0m,
                    Status = b.Status.ToString()
                });
            }
            return results;
        }

        private async Task<string> ResolveDisplayLocationAsync(string? locationStr, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(locationStr))
                return string.Empty;

            if (Guid.TryParse(locationStr, out var guid))
            {
                var loc = await _context.UserAddresses.FirstOrDefaultAsync(l => l.Id == guid, cancellationToken);
                if (loc != null)
                {
                    var parts = new List<string>();
                    if (!string.IsNullOrWhiteSpace(loc.City)) parts.Add(loc.City);
                    if (!string.IsNullOrWhiteSpace(loc.Governorate)) parts.Add(loc.Governorate);
                    if (!string.IsNullOrWhiteSpace(loc.Country)) parts.Add(loc.Country);
                    if (parts.Count > 0) return string.Join(", ", parts);
                }
                return "Unknown Location";
            }

            return locationStr;
        }

        public async Task<IEnumerable<PublicDriverDto>> GetAvailableDriversForBookingAsync(Guid bookingId, Guid customerId, CancellationToken cancellationToken = default)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken);
            if (booking == null) throw new NotFoundException("Booking not found.");
            if (booking.UserId != customerId) throw new ForbiddenException("You don't own this booking.");
            if (!booking.PickupDate.HasValue || !booking.ReturnDate.HasValue)
                return Enumerable.Empty<PublicDriverDto>();

            var profiles = await _profileRepository.GetAvailableDriversForWindowAsync(booking.PickupDate.Value, booking.ReturnDate.Value, booking.Id, cancellationToken);
            var driverDtos = new List<PublicDriverDto>();

            foreach (var dp in profiles)
            {
                if (dp.IsActive)
                {
                    var (avgRating, totalTrips) = await _driverReviewRepository.GetDriverRatingStatsAsync(dp.Id, cancellationToken);

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

        public async Task SelectDriverAsync(Guid bookingId, Guid driverProfileId, Guid customerId, CancellationToken cancellationToken = default)
        {
            var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken);
            if (booking == null) throw new NotFoundException("Booking not found.");
            if (booking.UserId != customerId) throw new ForbiddenException("You don't own this booking.");
            if (booking.AssignedDriverProfileId.HasValue)
                throw new BadRequestException("A driver is already assigned to this booking.");

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

            driverProfile.LockedUntil = booking.ReturnDate;
            driverProfile.Availability = DriverAvailability.Reserved;

            // Compute/populate driver fee if needed
            if (booking.DriverFee == null || booking.DriverFee == 0)
            {
                var totalDays = (booking.ReturnDate.Value - booking.PickupDate.Value).Days;
                if (totalDays < 1) totalDays = 1;
                var dailyRate = await _driverPricingService.GetDailyRateAsync(cancellationToken);
                booking.DriverFee = dailyRate * totalDays;
                booking.GrandTotal = (booking.VehicleFee ?? booking.TotalPrice ?? 0) + booking.DriverFee.Value;
                booking.TotalPrice = booking.GrandTotal;
            }

            await _profileRepository.UpdateAsync(driverProfile, cancellationToken);
            await _bookingRepository.UpdateAsync(booking, cancellationToken);

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
        }
    }
}
