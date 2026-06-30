using Backend.Application.DTOs.Inspection;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Application.Features.VehicleInspections.Queries.GetPendingAssignments;

public class GetPendingAssignmentsQueryHandler : IRequestHandler<GetPendingAssignmentsQuery, IReadOnlyList<PendingAssignmentDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPendingAssignmentsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<PendingAssignmentDto>> Handle(GetPendingAssignmentsQuery request, CancellationToken cancellationToken)
    {
        var pendingPickups = await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Vehicle)
            .Where(b => b.Status == BookingStatus.Confirmed &&
                        !_context.VehicleInspections.Any(vi => vi.BookingId == b.Id && vi.InspectionType == "Pickup" && vi.InspectorId != null))
            .ToListAsync(cancellationToken);

        var pendingReturns = await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Vehicle)
            .Where(b => b.Status == BookingStatus.Active &&
                        !_context.VehicleInspections.Any(vi => vi.BookingId == b.Id && vi.InspectionType == "Return" && vi.InspectorId != null))
            .ToListAsync(cancellationToken);

        var results = new List<PendingAssignmentDto>();

        foreach (var b in pendingPickups)
        {
            results.Add(new PendingAssignmentDto(
                b.Id,
                b.BookingNumber,
                BuildPersonName(b.User),
                BuildVehicleLabel(b.Vehicle),
                "Pickup",
                b.PickupDate ?? DateTime.UtcNow,
                b.Status.ToString()
            ));
        }

        foreach (var b in pendingReturns)
        {
            results.Add(new PendingAssignmentDto(
                b.Id,
                b.BookingNumber,
                BuildPersonName(b.User),
                BuildVehicleLabel(b.Vehicle),
                "Return",
                b.ReturnDate ?? b.PickupDate?.AddDays(1) ?? DateTime.UtcNow,
                b.Status.ToString()
            ));
        }

        return results.OrderBy(r => r.InspectionDate).ToList();
    }

    private static string BuildVehicleLabel(Vehicle? vehicle)
    {
        if (vehicle == null) return string.Empty;
        return string.Join(" ", new[] { vehicle.Make, vehicle.Model, vehicle.LicensePlate }
            .Where(s => !string.IsNullOrWhiteSpace(s)));
    }

    private static string BuildPersonName(ApplicationUser? user)
    {
        if (user == null) return string.Empty;
        var name = $"{user.FirstName} {user.LastName}".Trim();
        return string.IsNullOrWhiteSpace(name) ? user.Email ?? string.Empty : name;
    }
}
