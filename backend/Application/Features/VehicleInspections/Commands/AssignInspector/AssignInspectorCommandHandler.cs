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

            // Fetch available inspectors in the same region
            var region = booking.PickupLocation; // Using PickupLocation as Region

            var availableInspectors = await _context.Inspectors
                .Where(i => i.IsActive && i.IsAvailable)
                .Where(i => string.IsNullOrEmpty(region) || i.Region == region) // Fallback to any if region is not set on booking, or match
                .ToListAsync(cancellationToken);

            Guid? selectedInspectorUserId = null;

            if (availableInspectors.Any())
            {
                // Load balancing logic: find the one with minimum pending inspections
                var inspectorUserIds = availableInspectors.Select(i => i.UserId).ToList();

                var pendingCounts = await _context.VehicleInspections
                    .Where(vi => vi.InspectorId != null && inspectorUserIds.Contains(vi.InspectorId.Value) && vi.Status == InspectionStatus.Pending)
                    .GroupBy(vi => vi.InspectorId)
                    .Select(g => new { InspectorId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.InspectorId ?? Guid.Empty, x => x.Count, cancellationToken);

                var bestInspector = availableInspectors
                    .Select(i => new
                    {
                        Inspector = i,
                        PendingCount = pendingCounts.ContainsKey(i.UserId) ? pendingCounts[i.UserId] : 0
                    })
                    .OrderBy(x => x.PendingCount)
                    .ThenBy(x => Guid.NewGuid()) // Tie-breaker
                    .FirstOrDefault();

                if (bestInspector != null)
                {
                    selectedInspectorUserId = bestInspector.Inspector.UserId;
                    _logger.LogInformation("Inspector Selected: {UserId} for booking {BookingId}", selectedInspectorUserId, request.BookingId);
                }
            }

            // Fetch existing inspections to prevent duplicates or support reassignment
            var existingInspections = await _context.VehicleInspections
                .Where(vi => vi.BookingId == booking.Id)
                .ToListAsync(cancellationToken);

            var existingPickup = existingInspections.FirstOrDefault(vi => string.Equals(vi.InspectionType, "Pickup", StringComparison.OrdinalIgnoreCase));
            var existingReturn = existingInspections.FirstOrDefault(vi => string.Equals(vi.InspectionType, "Return", StringComparison.OrdinalIgnoreCase));

            Guid pickupInspectionId;

            // Manage Pickup Inspection
            if (existingPickup == null)
            {
                var pickupInspection = new VehicleInspection
                {
                    InspectionId = Guid.NewGuid(),
                    BookingId = booking.Id,
                    VehicleId = booking.VehicleId,
                    InspectorId = selectedInspectorUserId,
                    InspectionType = "Pickup",
                    Status = InspectionStatus.Pending,
                    InspectionDate = booking.PickupDate ?? DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.AddVehicleInspection(pickupInspection);
                pickupInspectionId = pickupInspection.InspectionId;
            }
            else
            {
                pickupInspectionId = existingPickup.InspectionId;
                if (!existingPickup.IsSubmitted)
                {
                    existingPickup.InspectorId = selectedInspectorUserId;
                    existingPickup.Status = InspectionStatus.Pending;
                    existingPickup.UpdatedAt = DateTime.UtcNow;
                }
            }

            // Manage Return Inspection
            if (existingReturn == null)
            {
                var returnInspection = new VehicleInspection
                {
                    InspectionId = Guid.NewGuid(),
                    BookingId = booking.Id,
                    VehicleId = booking.VehicleId,
                    InspectorId = selectedInspectorUserId,
                    InspectionType = "Return",
                    Status = InspectionStatus.Pending,
                    InspectionDate = booking.ReturnDate ?? (booking.PickupDate?.AddDays(1) ?? DateTime.UtcNow),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.AddVehicleInspection(returnInspection);
            }
            else
            {
                if (!existingReturn.IsSubmitted)
                {
                    existingReturn.InspectorId = selectedInspectorUserId;
                    existingReturn.Status = InspectionStatus.Pending;
                    existingReturn.UpdatedAt = DateTime.UtcNow;
                }
            }

            // Update booking's assigned inspector & mirror status
            booking.AssignedInspectorId = selectedInspectorUserId;
            booking.InspectionStatus = InspectionStatus.Pending;
            booking.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            // Handle notifications/events (failsafe)
            if (selectedInspectorUserId != null)
            {
                try
                {
                    await _notificationService.CreateNotificationAsync(
                        selectedInspectorUserId.Value,
                        "New inspection assigned",
                        $"You have been assigned to inspect booking {booking.BookingNumber ?? booking.Id.ToString()}.",
                        "InspectionAssigned",
                        cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send assignment notification to inspector {InspectorId}", selectedInspectorUserId);
                }
            }
            else
            {
                _logger.LogWarning("No inspector available for booking {BookingId} in region {Region}. Assigning null.", request.BookingId, region);
                try
                {
                    await _mediator.Publish(new NoInspectorAvailableEvent(booking.Id, region, booking.PickupDate ?? DateTime.UtcNow), cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to publish NoInspectorAvailableEvent for booking {BookingId}", booking.Id);
                }
            }

            return pickupInspectionId;
        }
    }
}
