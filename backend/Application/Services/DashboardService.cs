using Backend.Application.DTOs.Dashboard;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Entities.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public DashboardService(
        IApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        var totalUsers = await _context.Users
            .CountAsync(u => u.Status != "Blocked", cancellationToken);

        var activeBookings = await _context.Bookings
            .CountAsync(b => b.Status == BookingStatus.Active, cancellationToken);

        var pendingVerifications = await _context.Verifications
            .Where(v => v.Status == "Pending")
            .Select(v => v.UserId)
            .Distinct()
            .CountAsync(cancellationToken);

        var activeBookedVehicleIds = await _context.Bookings
            .Where(b => b.Status == BookingStatus.Active)
            .Select(b => b.VehicleId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var availableVehicles = await _context.Vehicles
            .CountAsync(v => v.IsActive && 
                             v.AvailabilityStatus == "Available" && 
                             !activeBookedVehicleIds.Contains(v.Id), cancellationToken);

        var pendingInspections = await _context.Bookings
            .CountAsync(b => b.InspectionStatus == InspectionStatus.Pending, cancellationToken);

        return new DashboardSummaryDto(
            TotalUsers: totalUsers,
            ActiveBookings: activeBookings,
            PendingVerifications: pendingVerifications,
            AvailableVehicles: availableVehicles,
            PendingInspections: pendingInspections
        );
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RecentActivityItemDto>> GetRecentSummaryAsync(
        Guid? supplierId,
        CancellationToken cancellationToken = default)
    {
        var items = new List<RecentActivityItemDto>();

        // ── 1. Latest Booking ────────────────────────────────────────────────
        Booking? latestBooking;
        if (supplierId.HasValue)
        {
            latestBooking = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Vehicle)
                .Where(b => b.Vehicle != null && b.Vehicle.UserId == supplierId.Value)
                .OrderByDescending(b => b.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);
        }
        else
        {
            latestBooking = await _context.Bookings
                .Include(b => b.User)
                .OrderByDescending(b => b.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (latestBooking is not null)
        {
            var shortId = latestBooking.BookingNumber
                          ?? latestBooking.Id.ToString()[..8].ToUpperInvariant();
            var customerName = latestBooking.User is not null
                ? $"{latestBooking.User.FirstName} {latestBooking.User.LastName}".Trim()
                : "a customer";

            items.Add(new RecentActivityItemDto(
                Type: "booking",
                Message: $"Booking #{shortId} created by {customerName}",
                CreatedAt: latestBooking.CreatedAt,
                Icon: "booking"
            ));
        }

        // ── 2. Latest Payment — identified as the most recently updated
        //      Confirmed/Completed booking (the payment event) ───────────────
        Booking? latestPaymentBooking;
        if (supplierId.HasValue)
        {
            latestPaymentBooking = await _context.Bookings
                .Include(b => b.Vehicle)
                .Where(b => b.Vehicle != null
                            && b.Vehicle.UserId == supplierId.Value
                            && (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
                .OrderByDescending(b => b.UpdatedAt)
                .FirstOrDefaultAsync(cancellationToken);
        }
        else
        {
            latestPaymentBooking = await _context.Bookings
                .Where(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed)
                .OrderByDescending(b => b.UpdatedAt)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (latestPaymentBooking is not null)
        {
            var shortId = latestPaymentBooking.BookingNumber
                          ?? latestPaymentBooking.Id.ToString()[..8].ToUpperInvariant();
            items.Add(new RecentActivityItemDto(
                Type: "payment",
                Message: $"Payment completed for Booking #{shortId}",
                CreatedAt: latestPaymentBooking.UpdatedAt,
                Icon: "payment"
            ));
        }

        // ── 3. Latest User registered (admin view only) ───────────────────────
        if (!supplierId.HasValue)
        {
            var latestUser = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (latestUser is not null)
            {
                var fullName = $"{latestUser.FirstName} {latestUser.LastName}".Trim();
                if (string.IsNullOrWhiteSpace(fullName))
                    fullName = latestUser.Email ?? "Unknown user";

                items.Add(new RecentActivityItemDto(
                    Type: "user",
                    Message: $"New user registered: {fullName}",
                    CreatedAt: latestUser.CreatedAt,
                    Icon: "user"
                ));
            }
        }

        // ── 4. Latest Vehicle added ───────────────────────────────────────────
        Vehicle? latestVehicle;
        if (supplierId.HasValue)
        {
            latestVehicle = await _context.Vehicles
                .Where(v => v.UserId == supplierId.Value)
                .OrderByDescending(v => v.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);
        }
        else
        {
            latestVehicle = await _context.Vehicles
                .OrderByDescending(v => v.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (latestVehicle is not null)
        {
            var label = string.Join(" ",
                new[] { latestVehicle.Make, latestVehicle.Model, latestVehicle.Year?.ToString() }
                    .Where(s => !string.IsNullOrWhiteSpace(s)));
            if (string.IsNullOrWhiteSpace(label)) label = "Vehicle";

            items.Add(new RecentActivityItemDto(
                Type: "vehicle",
                Message: $"Vehicle added: {label}",
                CreatedAt: latestVehicle.CreatedAt,
                Icon: "vehicle"
            ));
        }

        // ── 5. Latest Verification log (admin view only) ──────────────────────
        if (!supplierId.HasValue)
        {
            var latestVerification = await _context.Verifications
                .Include(v => v.User)
                .OrderByDescending(v => v.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (latestVerification is not null)
            {
                var fullName = latestVerification.User is not null
                    ? $"{latestVerification.User.FirstName} {latestVerification.User.LastName}".Trim()
                    : "a user";
                if (string.IsNullOrWhiteSpace(fullName))
                    fullName = latestVerification.User?.Email ?? "Unknown user";

                var statusLabel = latestVerification.Status ?? "Pending";

                items.Add(new RecentActivityItemDto(
                    Type: "verification",
                    Message: $"Verification submitted by {fullName} ({statusLabel})",
                    CreatedAt: latestVerification.CreatedAt,
                    Icon: "verification"
                ));
            }
        }

        // Sort by most recent first — up to 5 categories (booking, payment, user, vehicle, verification)
        return items
            .OrderByDescending(i => i.CreatedAt)
            .Take(5)
            .ToList()
            .AsReadOnly();
    }

    public async Task<IReadOnlyList<RecentBookingDto>> GetRecentBookingsAsync(Guid? supplierId, int limit = 5, CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Vehicle)
            .AsQueryable();

        if (supplierId.HasValue)
        {
            query = query.Where(b => b.Vehicle != null && b.Vehicle.UserId == supplierId.Value);
        }

        var recentBookings = await query
            .OrderByDescending(b => b.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return recentBookings.Select(b => new RecentBookingDto(
            Id: b.BookingNumber ?? b.Id.ToString()[..8].ToUpperInvariant(),
            Customer: b.User != null ? $"{b.User.FirstName} {b.User.LastName}".Trim() : "Unknown",
            Car: b.Vehicle != null ? $"{b.Vehicle.Make} {b.Vehicle.Model}".Trim() : "Unknown",
            Date: b.CreatedAt.ToString("MMM dd, yyyy"),
            Status: b.Status.ToString(),
            Amount: b.TotalPrice ?? 0
        )).ToList().AsReadOnly();
    }

    public async Task<IReadOnlyList<UpcomingBookingDto>> GetUpcomingBookingsAsync(Guid? supplierId, int days = 7, CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Vehicle)
            .Where(b => b.PickupDate >= DateTime.UtcNow && b.PickupDate <= DateTime.UtcNow.AddDays(days) && b.Status == BookingStatus.Confirmed);

        if (supplierId.HasValue)
        {
            query = query.Where(b => b.Vehicle != null && b.Vehicle.UserId == supplierId.Value);
        }

        var upcomingBookings = await query
            .OrderBy(b => b.PickupDate)
            .ToListAsync(cancellationToken);

        return upcomingBookings.Select(b => new UpcomingBookingDto(
            Id: b.BookingNumber ?? b.Id.ToString()[..8].ToUpperInvariant(),
            Customer: b.User != null ? $"{b.User.FirstName} {b.User.LastName}".Trim() : "Unknown",
            Car: b.Vehicle != null ? $"{b.Vehicle.Make} {b.Vehicle.Model}".Trim() : "Unknown",
            PickupDate: b.PickupDate?.ToString("MMM dd") ?? "N/A",
            ReturnDate: b.ReturnDate?.ToString("MMM dd") ?? "N/A"
        )).ToList().AsReadOnly();
    }

    public async Task<IReadOnlyList<RevenueDataPointDto>> GetRevenueWeekAsync(Guid? supplierId, CancellationToken cancellationToken = default)
    {
        var startDate = DateTime.UtcNow.Date.AddDays(-6);
        
        var query = _context.Bookings
            .Where(b => b.CreatedAt >= startDate && (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed));

        if (supplierId.HasValue)
        {
            query = query.Where(b => b.Vehicle != null && b.Vehicle.UserId == supplierId.Value);
        }

        var bookings = await query.ToListAsync(cancellationToken);

        var grouped = bookings
            .GroupBy(b => b.CreatedAt.Date)
            .ToDictionary(g => g.Key, g => g.Sum(b => b.TotalPrice ?? 0));

        var result = new List<RevenueDataPointDto>();
        for (int i = 0; i < 7; i++)
        {
            var date = startDate.AddDays(i);
            var revenue = grouped.ContainsKey(date) ? grouped[date] : 0;
            result.Add(new RevenueDataPointDto(date.ToString("MMM dd"), revenue));
        }

        return result.AsReadOnly();
    }

    public async Task<LiveTrackingDto> GetLiveTrackingAsync(Guid? supplierId, CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings.AsQueryable();

        if (supplierId.HasValue)
        {
            query = query.Where(b => b.Vehicle != null && b.Vehicle.UserId == supplierId.Value);
        }

        var totalActiveRentals = await query.CountAsync(b => b.Status == BookingStatus.Active, cancellationToken);
        
        // Mock the connected phones based on active rentals for now
        var connectedPhones = (int)Math.Round(totalActiveRentals * 0.9);

        return new LiveTrackingDto(TotalActiveRentals: totalActiveRentals, ConnectedPhones: connectedPhones);
    }

    public async Task<IReadOnlyList<TopVehicleDto>> GetTopVehiclesAsync(Guid? supplierId, int limit = 5, CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings.Where(b => b.Vehicle != null);

        if (supplierId.HasValue)
            query = query.Where(b => b.Vehicle!.UserId == supplierId.Value);

        var grouped = await query
            .GroupBy(b => b.VehicleId)
            .Select(g => new
            {
                VehicleId = g.Key,
                BookingsCount = g.Count(),
                Revenue = g.Sum(b => b.TotalPrice ?? 0),
            })
            .OrderByDescending(x => x.BookingsCount)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var vehicleIds = grouped.Select(x => x.VehicleId).ToList();
        var vehicles = await _context.Vehicles
            .Include(v => v.Images)
            .Where(v => vehicleIds.Contains(v.Id))
            .ToListAsync(cancellationToken);

        return grouped.Select(x =>
        {
            var vehicle = vehicles.FirstOrDefault(v => v.Id == x.VehicleId);
            return new TopVehicleDto(
                Id: x.VehicleId.ToString(),
                Make: vehicle?.Make ?? string.Empty,
                Model: vehicle?.Model ?? string.Empty,
                Year: vehicle?.Year,
                BookingsCount: x.BookingsCount,
                Revenue: x.Revenue,
                ImageUrl: vehicle?.Images.FirstOrDefault()?.ImageUrl
            );
        }).ToList().AsReadOnly();
    }

    public Task<SystemStatusDto> GetSystemStatusAsync(CancellationToken cancellationToken = default)
    {
        // Mock system metrics for the dashboard from backend side
        var metrics = new List<SystemMetricDto>
        {
            new SystemMetricDto("Server CPU Load", "32%", 32, "primary"),
            new SystemMetricDto("Memory Usage", "68%", 68, "warning"),
            new SystemMetricDto("Storage Capacity", "45%", 45, "success")
        };

        var status = new SystemStatusDto(
            IsOperational: true,
            Message: "No incidents reported in the last 24 hours.",
            Metrics: metrics.AsReadOnly()
        );

        return Task.FromResult(status);
    }

    public async Task<RevenueOverviewDto> GetRevenueOverviewAsync(string filter, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        DateTime startDate;
        DateTime endDate;

        if (string.Equals(filter, "ThisYear", StringComparison.OrdinalIgnoreCase))
        {
            startDate = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            endDate = new DateTime(now.Year, 12, 31, 23, 59, 59, DateTimeKind.Utc);
        }
        else // default to ThisMonth
        {
            startDate = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            endDate = new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, DateTimeKind.Utc);
        }

        // We use join to include BookingPayment, although we sum TotalPrice from Bookings 
        // to match the exact requirement from the prompt while ensuring single optimized query.
        var dataPoints = await _context.Bookings
            .Where(b => b.CreatedAt >= startDate && b.CreatedAt <= endDate)
            .GroupJoin(
                _context.Payments,
                b => b.Id,
                p => p.BookingId,
                (b, p) => new { Booking = b, Payments = p }
            )
            .GroupBy(x => x.Booking.CreatedAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                Revenue = g.Sum(x => x.Booking.TotalPrice ?? 0),
                Bookings = g.Sum(x => x.Booking.Status == BookingStatus.Active || x.Booking.Status == BookingStatus.Completed || x.Booking.Status == BookingStatus.Confirmed ? (x.Booking.TotalPrice ?? 0) : 0),
                Refunds = g.Sum(x => x.Booking.Status == BookingStatus.Cancelled ? (x.Booking.TotalPrice ?? 0) : 0)
            })
            .OrderBy(x => x.Date)
            .ToListAsync(cancellationToken);

        var totalRevenue = dataPoints.Sum(x => x.Revenue);
        var totalBookings = dataPoints.Sum(x => x.Bookings);
        var totalRefunds = dataPoints.Sum(x => x.Refunds);

        var chartData = dataPoints.Select(x => new ChartDataPointDto(
            Date: x.Date.ToString("MMM d"),
            Revenue: x.Revenue,
            Bookings: x.Bookings,
            Refunds: x.Refunds
        )).ToList().AsReadOnly();

        return new RevenueOverviewDto(
            TotalRevenue: totalRevenue,
            TotalBookings: totalBookings,
            TotalRefunds: totalRefunds,
            ChartData: chartData
        );
    }
}
