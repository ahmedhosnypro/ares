using Backend.Application.DTOs.Inspection;
using Backend.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Features.VehicleInspections.Queries.GetInspectorTasks;

/// <summary>
/// Fetches today's non-submitted inspections for the given inspector using a
/// single EF Core projection — no N+1 loops, only the required columns are
/// selected from the database.
///
/// InspectionType mapping:
///   "Pickup"  → "CheckOut"
///   "Return"  → "CheckIn"
///   anything else → original value
///
/// The Google Maps link is built on the client using the Address field, which
/// is the booking's PickupLocation (CheckOut) or DropoffLocation (CheckIn).
/// </summary>
public sealed class GetInspectorTasksQueryHandler
    : IRequestHandler<GetInspectorTasksQuery, IReadOnlyList<InspectorTaskDto>>
{
    private readonly IApplicationDbContext _context;

    public GetInspectorTasksQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<InspectorTaskDto>> Handle(
        GetInspectorTasksQuery request,
        CancellationToken cancellationToken)
    {
        var todayStart = DateTime.UtcNow.Date;
        var tomorrowStart = todayStart.AddDays(1);

        var results = await _context.VehicleInspections
            .Where(i =>
                i.InspectorId == request.InspectorId &&
                !i.IsSubmitted &&
                i.InspectionDate >= todayStart &&
                i.InspectionDate < tomorrowStart)
            .Select(i => new
            {
                i.InspectionId,
                i.InspectionType,
                i.InspectionDate,

                // Vehicle fields
                VehicleMake = i.Vehicle != null ? i.Vehicle.Make : null,
                VehicleModel = i.Vehicle != null ? i.Vehicle.Model : null,
                VehicleYear = i.Vehicle != null ? i.Vehicle.Year : null,
                PlateNumber = i.Vehicle != null ? i.Vehicle.LicensePlate : null,

                // Customer fields (via Booking → User)
                CustomerFirst = i.Booking != null && i.Booking.User != null ? i.Booking.User.FirstName : null,
                CustomerLast = i.Booking != null && i.Booking.User != null ? i.Booking.User.LastName : null,
                CustomerPhone = i.Booking != null && i.Booking.User != null ? i.Booking.User.PhoneNumber : null,

                // Address: use pickup location for CheckOut, dropoff for CheckIn
                PickupAddress = i.Booking != null ? i.Booking.PickupLocation : null,
                DropoffAddress = i.Booking != null ? i.Booking.DropoffLocation : null,
            })
            .OrderBy(i => i.InspectionDate)
            .ToListAsync(cancellationToken);

        return results
            .Select(i => new InspectorTaskDto(
                InspectionId: i.InspectionId,
                InspectionType: MapInspectionType(i.InspectionType),
                VehicleName: BuildVehicleName(i.VehicleMake, i.VehicleModel, i.VehicleYear),
                PlateNumber: i.PlateNumber ?? string.Empty,
                CustomerName: BuildCustomerName(i.CustomerFirst, i.CustomerLast),
                CustomerPhone: i.CustomerPhone ?? string.Empty,
                ScheduledTime: i.InspectionDate,
                Address: ResolveAddress(i.InspectionType, i.PickupAddress, i.DropoffAddress)))
            .ToList()
            .AsReadOnly();
    }

    // ─── private helpers ──────────────────────────────────────────────────

    private static string MapInspectionType(string rawType) => rawType switch
    {
        "Pickup" => "CheckOut",
        "Return" => "CheckIn",
        _ => rawType,
    };

    private static string BuildVehicleName(string? make, string? model, int? year)
    {
        var parts = new[] { year?.ToString(), make, model }
            .Where(p => !string.IsNullOrWhiteSpace(p));
        var name = string.Join(" ", parts);
        return string.IsNullOrWhiteSpace(name) ? "Unknown Vehicle" : name;
    }

    private static string BuildCustomerName(string? first, string? last)
    {
        var name = $"{first} {last}".Trim();
        return string.IsNullOrWhiteSpace(name) ? "Unknown Customer" : name;
    }

    private static string ResolveAddress(string rawType, string? pickup, string? dropoff)
    {
        var address = rawType == "Pickup" ? pickup : dropoff;
        return address ?? string.Empty;
    }
}
