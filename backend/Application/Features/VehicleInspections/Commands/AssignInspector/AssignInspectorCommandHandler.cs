using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
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
        private readonly ILogger<AssignInspectorCommandHandler> _logger;

        public AssignInspectorCommandHandler(IApplicationDbContext context, IMediator mediator, ILogger<AssignInspectorCommandHandler> logger)
        {
            _context = context;
            _mediator = mediator;
            _logger = logger;
        }

        public async Task<Guid> Handle(AssignInspectorCommand request, CancellationToken cancellationToken)
        {
            var booking = await _context.Bookings
                .Include(b => b.Vehicle)
                .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken)
                ?? throw new NotFoundException("Booking", request.BookingId);

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
                    .Where(vi => inspectorUserIds.Contains(vi.InspectorId ?? Guid.Empty) && vi.Status == InspectionStatus.Pending)
                    .GroupBy(vi => vi.InspectorId)
                    .Select(g => new { InspectorId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.InspectorId ?? Guid.Empty, x => x.Count, cancellationToken);

                var bestInspector = availableInspectors
                    .Select(i => new {
                        Inspector = i,
                        PendingCount = pendingCounts.ContainsKey(i.UserId) ? pendingCounts[i.UserId] : 0
                    })
                    .OrderBy(x => x.PendingCount)
                    .ThenBy(x => Guid.NewGuid()) // Tie-breaker
                    .FirstOrDefault();

                if (bestInspector != null)
                {
                    selectedInspectorUserId = bestInspector.Inspector.UserId;
                    _logger.LogInformation("Assigned inspector {UserId} to booking {BookingId}", selectedInspectorUserId, request.BookingId);
                }
            }

            var vehicleInspection = new VehicleInspection
            {
                InspectionId = Guid.NewGuid(),
                BookingId = booking.Id,
                VehicleId = booking.VehicleId,
                InspectorId = selectedInspectorUserId,
                InspectionType = "Pickup", // Assuming pickup inspection before the booking starts
                Status = InspectionStatus.Pending,
                InspectionDate = booking.PickupDate ?? DateTime.UtcNow
            };

            _context.AddVehicleInspection(vehicleInspection);

            if (selectedInspectorUserId == null)
            {
                _logger.LogWarning("No inspector available for booking {BookingId} in region {Region}. Assigning null.", request.BookingId, region);
                await _mediator.Publish(new NoInspectorAvailableEvent(booking.Id, region, booking.PickupDate ?? DateTime.UtcNow), cancellationToken);
            }

            // Update booking's assigned inspector
            booking.AssignedInspectorId = selectedInspectorUserId;

            await _context.SaveChangesAsync(cancellationToken);

            return vehicleInspection.InspectionId;
        }
    }
}
