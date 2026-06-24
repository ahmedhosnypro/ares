using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Backend.Domain.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Features.VehicleInspections.Commands.AssignInspector
{
    public class AssignInspectorCommandHandler : IRequestHandler<AssignInspectorCommand, Guid>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMediator _mediator;
        private readonly INotificationService _notificationService;
        private readonly ILogger<AssignInspectorCommandHandler> _logger;

        public AssignInspectorCommandHandler(
            IApplicationDbContext context,
            IMediator mediator,
            INotificationService notificationService,
            ILogger<AssignInspectorCommandHandler> logger)
        {
            _context = context;
            _mediator = mediator;
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task<Guid> Handle(AssignInspectorCommand request, CancellationToken cancellationToken)
        {
            var booking = await _context.Bookings
                .Include(b => b.Vehicle)
                .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken)
                ?? throw new NotFoundException("Booking", request.BookingId);

            // Verify booking status - cancelled or completed bookings cannot be assigned inspectors
            if (booking.Status == BookingStatus.Cancelled || booking.Status == BookingStatus.Completed)
            {
                throw new ConflictException($"Cannot assign an inspector to a booking in status '{booking.Status}'.");
            }

            var existingInspections = await _context.VehicleInspections
                .Where(vi => vi.BookingId == booking.Id)
                .ToListAsync(cancellationToken);

            var existingInspection = existingInspections.FirstOrDefault(vi => string.Equals(vi.InspectionType, request.InspectionType, StringComparison.OrdinalIgnoreCase));

            // Prevent Auto Assignment from overwriting existing assignments
            if (!request.IsManual && existingInspection != null && existingInspection.InspectorId != null)
            {
                _logger.LogWarning("Skipping Auto Assignment for booking {BookingId} {InspectionType} as inspector is already assigned.", booking.Id, request.InspectionType);
                return existingInspection.InspectionId;
            }

            // Fetch available inspectors in the same region
            var region = string.Equals(request.InspectionType, "Return", StringComparison.OrdinalIgnoreCase)
                ? booking.DropoffLocation
                : booking.PickupLocation;

            var availableInspectors = await _context.Inspectors
                .Where(i => i.IsActive && i.IsAvailable)
                .ToListAsync(cancellationToken);

            // Filter inspectors by region matching (e.g., matching "Cairo" in "Cairo, Cairo Governorate, Egypt")
            if (!string.IsNullOrEmpty(region))
            {
                availableInspectors = availableInspectors
                    .Where(i => string.IsNullOrEmpty(i.Region) || 
                                region.Contains(i.Region, StringComparison.OrdinalIgnoreCase) || 
                                i.Region.Contains(region, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            Guid? selectedInspectorUserId = null;

            if (availableInspectors.Any())
            {
                // Load balancing logic: find the one with minimum pending/in-progress inspections
                var inspectorUserIds = availableInspectors.Select(i => i.UserId).ToList();

                var activeCounts = await _context.VehicleInspections
                    .Include(vi => vi.Booking)
                    .Where(vi => vi.InspectorId != null && inspectorUserIds.Contains(vi.InspectorId.Value) && 
                                 vi.Status == InspectionStatus.Pending &&
                                 vi.Booking != null &&
                                 vi.Booking.Status != BookingStatus.Cancelled &&
                                 vi.Booking.Status != BookingStatus.Completed)
                    .GroupBy(vi => vi.InspectorId)
                    .Select(g => new { InspectorId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.InspectorId ?? Guid.Empty, x => x.Count, cancellationToken);

                var bestInspector = availableInspectors
                    .Select(i => new
                    {
                        Inspector = i,
                        ActiveCount = activeCounts.ContainsKey(i.UserId) ? activeCounts[i.UserId] : 0
                    })
                    .OrderBy(x => x.ActiveCount)
                    .ThenBy(x => Guid.NewGuid()) // Tie-breaker
                    .FirstOrDefault();

                if (bestInspector != null)
                {
                    selectedInspectorUserId = bestInspector.Inspector.UserId;
                    _logger.LogInformation("Inspector Selected: {UserId} for booking {BookingId} {InspectionType}", selectedInspectorUserId, request.BookingId, request.InspectionType);
                }
            }

            if (selectedInspectorUserId == null)
            {
                _logger.LogWarning("No inspector available for booking {BookingId} in region {Region}.", request.BookingId, region);
                try
                {
                    await _mediator.Publish(new NoInspectorAvailableEvent(booking.Id, region, booking.PickupDate ?? DateTime.UtcNow), cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to publish NoInspectorAvailableEvent for booking {BookingId}", booking.Id);
                }
                
                // If this is an auto-assignment, we'll want to bubble up an exception or status so it's counted as a failure for retry logic
                if (!request.IsManual)
                {
                    throw new Exception("No eligible inspector found for auto-assignment.");
                }
            }

            Guid inspectionId;
            Guid? previousInspectorId = null;

            // Manage Inspection
            if (existingInspection == null)
            {
                var newInspection = new VehicleInspection
                {
                    InspectionId = Guid.NewGuid(),
                    BookingId = booking.Id,
                    VehicleId = booking.VehicleId,
                    InspectorId = selectedInspectorUserId,
                    InspectionType = request.InspectionType,
                    Status = InspectionStatus.Pending,
                    InspectionDate = request.InspectionType.Equals("Pickup", StringComparison.OrdinalIgnoreCase) 
                        ? (booking.PickupDate ?? DateTime.UtcNow) 
                        : (booking.ReturnDate ?? booking.PickupDate?.AddDays(1) ?? DateTime.UtcNow),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.AddVehicleInspection(newInspection);
                inspectionId = newInspection.InspectionId;
            }
            else
            {
                inspectionId = existingInspection.InspectionId;
                if (!existingInspection.IsSubmitted)
                {
                    previousInspectorId = existingInspection.InspectorId;
                    existingInspection.InspectorId = selectedInspectorUserId;
                    existingInspection.Status = InspectionStatus.Pending;
                    existingInspection.UpdatedAt = DateTime.UtcNow;
                }
                else if (request.IsManual)
                {
                    throw new ConflictException("Cannot reassign an inspection that is already submitted.");
                }
            }

            // Keep the overall booking inspection status and assigned inspector updated (mostly tracking the latest assignment)
            if (selectedInspectorUserId != null)
            {
                if (string.Equals(request.InspectionType, "Pickup", StringComparison.OrdinalIgnoreCase))
                {
                    booking.AssignedInspectorId = selectedInspectorUserId;
                }
                booking.InspectionStatus = InspectionStatus.Pending;
                booking.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);

            // Handle notifications/events (failsafe)
            if (selectedInspectorUserId != null)
            {
                try
                {
                    // Notify new inspector
                    if (previousInspectorId != selectedInspectorUserId)
                    {
                        await _notificationService.CreateNotificationAsync(
                            selectedInspectorUserId.Value,
                            "New inspection assigned",
                            $"You have been assigned to inspect booking {booking.BookingNumber ?? booking.Id.ToString()} ({request.InspectionType}).",
                            "InspectionAssigned",
                            cancellationToken);
                    }

                    // Notify previous inspector of reassignment
                    if (previousInspectorId != null && previousInspectorId != selectedInspectorUserId)
                    {
                        await _notificationService.CreateNotificationAsync(
                            previousInspectorId.Value,
                            "Inspection Reassigned",
                            $"Your assignment for booking {booking.BookingNumber ?? booking.Id.ToString()} ({request.InspectionType}) has been reassigned to another inspector.",
                            "InspectionReassigned",
                            cancellationToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send assignment notification to inspector(s) for booking {BookingId}", booking.Id);
                }
            }

            return inspectionId;
        }
    }
}
