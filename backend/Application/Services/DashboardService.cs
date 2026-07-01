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

        var vehiclesPerCategoryQuery = await _context.Vehicles
            .Where(v => v.IsActive && v.Category != null)
            .GroupBy(v => v.Category!.Name)
            .Select(g => new { CategoryName = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var vehiclesPerCategory = vehiclesPerCategoryQuery
            .ToDictionary(x => x.CategoryName ?? "Unknown", x => x.Count);

        return new DashboardSummaryDto(
            TotalUsers: totalUsers,
            ActiveBookings: activeBookings,
            PendingVerifications: pendingVerifications,
            AvailableVehicles: availableVehicles,
            PendingInspections: pendingInspections,
            VehiclesPerCategory: vehiclesPerCategory
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
            .AsNoTracking()
            .Include(b => b.User)
            .Include(b => b.Vehicle)
            .ThenInclude(v => v.Images)
            .AsQueryable();

        if (supplierId.HasValue)
        {
            query = query.Where(b => b.Vehicle != null && b.Vehicle.UserId == supplierId.Value);
        }

        return (await query
            .OrderByDescending(b => b.CreatedAt)
            .Take(limit)
            .Select(b => new RecentBookingDto(
                b.Id,
                b.BookingNumber ?? "",
                b.User != null ? (b.User.FirstName + " " + b.User.LastName).Trim() : "Unknown",
                b.Vehicle != null ? (b.Vehicle.Make + " " + b.Vehicle.Model).Trim() : "Unknown",
                b.Vehicle != null && b.Vehicle.Images.Any()
                    ? (b.Vehicle.Images.Any(i => i.IsPrimary)
                        ? b.Vehicle.Images.Where(i => i.IsPrimary).Select(i => i.ImageUrl).FirstOrDefault()
                        : b.Vehicle.Images.Select(i => i.ImageUrl).FirstOrDefault())
                    : null,
                b.CreatedAt,
                b.Status.ToString()
            ))
            .ToListAsync(cancellationToken)).AsReadOnly();
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
        var rawData = await _context.Bookings
            .Where(b => b.CreatedAt >= startDate && b.CreatedAt <= endDate)
            .GroupJoin(
                _context.BookingCancellations,
                b => b.Id,
                c => c.BookingId,
                (b, c) => new { Booking = b, Cancellations = c }
            )
            .SelectMany(
                x => x.Cancellations.DefaultIfEmpty(),
                (x, c) => new { x.Booking, Cancellation = c }
            )
            .ToListAsync(cancellationToken);

        var dataPoints = rawData
            .GroupBy(x => x.Booking.CreatedAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                Revenue = g.Sum(x => (x.Booking.Status == BookingStatus.Confirmed || x.Booking.Status == BookingStatus.Active || x.Booking.Status == BookingStatus.Completed) ? (x.Booking.TotalPrice ?? 0) : 0),
                PlatformRevenue = g.Sum(x => (x.Booking.Status == BookingStatus.Confirmed || x.Booking.Status == BookingStatus.Active || x.Booking.Status == BookingStatus.Completed) ? (x.Booking.CommissionAmount ?? 0) : 0),
                SupplierRevenue = g.Sum(x => (x.Booking.Status == BookingStatus.Confirmed || x.Booking.Status == BookingStatus.Active || x.Booking.Status == BookingStatus.Completed) ? (x.Booking.SupplierAmount ?? x.Booking.TotalPrice ?? 0) : 0),
                Bookings = g.Sum(x => (x.Booking.Status == BookingStatus.Confirmed || x.Booking.Status == BookingStatus.Active || x.Booking.Status == BookingStatus.Completed) ? (x.Booking.TotalPrice ?? 0) : 0),
                Refunds = g.Sum(x => x.Booking.Status == BookingStatus.Cancelled && x.Cancellation != null 
                    ? x.Cancellation.RefundAmount 
                    : 0)
            })
            .OrderBy(x => x.Date)
            .ToList();

        var totalRevenue = dataPoints.Sum(x => x.Revenue);
        var totalPlatformRevenue = dataPoints.Sum(x => x.PlatformRevenue);
        var totalSupplierRevenue = dataPoints.Sum(x => x.SupplierRevenue);
        var totalBookings = dataPoints.Sum(x => x.Bookings);
        var totalRefunds = dataPoints.Sum(x => x.Refunds);
        var totalNetRevenue = totalRevenue - totalRefunds;

        var chartData = dataPoints.Select(x => new ChartDataPointDto(
            Date: x.Date.ToString("MMM d"),
            Revenue: x.Revenue,
            PlatformRevenue: x.PlatformRevenue,
            SupplierRevenue: x.SupplierRevenue,
            Bookings: x.Bookings,
            Refunds: x.Refunds,
            NetRevenue: x.Revenue - x.Refunds
        )).ToList().AsReadOnly();

        return new RevenueOverviewDto(
            TotalRevenue: totalRevenue,
            PlatformRevenue: totalPlatformRevenue,
            SupplierRevenue: totalSupplierRevenue,
            TotalBookings: totalBookings,
            TotalRefunds: totalRefunds,
            NetRevenue: totalNetRevenue,
            ChartData: chartData
        );
    }

    public async Task<FinancialReportDto> GetFinancialReportAsync(
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var currentEndDate = endDate ?? now;
        var currentStartDate = startDate ?? currentEndDate.AddDays(-30);
        var duration = currentEndDate - currentStartDate;

        var prevEndDate = currentStartDate.AddSeconds(-1);
        var prevStartDate = currentStartDate.Subtract(duration);

        // 1. Calculate Metrics
        var totalRevenue = await _context.Bookings
            .Where(b => b.CreatedAt >= currentStartDate && b.CreatedAt <= currentEndDate &&
                        (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Active || b.Status == BookingStatus.Completed))
            .SumAsync(b => b.TotalPrice ?? 0, cancellationToken);

        var prevTotalRevenue = await _context.Bookings
            .Where(b => b.CreatedAt >= prevStartDate && b.CreatedAt <= prevEndDate &&
                        (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Active || b.Status == BookingStatus.Completed))
            .SumAsync(b => b.TotalPrice ?? 0, cancellationToken);

        var totalRevenueChange = GetPercentageChange(totalRevenue, prevTotalRevenue);

        var paidAmount = await _context.Payments
            .Where(p => p.CreatedAt >= currentStartDate && p.CreatedAt <= currentEndDate &&
                        (p.Status == "Captured" || p.Status == "Authorized"))
            .SumAsync(p => p.Amount, cancellationToken);

        var prevPaidAmount = await _context.Payments
            .Where(p => p.CreatedAt >= prevStartDate && p.CreatedAt <= prevEndDate &&
                        (p.Status == "Captured" || p.Status == "Authorized"))
            .SumAsync(p => p.Amount, cancellationToken);

        var paidAmountChange = GetPercentageChange(paidAmount, prevPaidAmount);

        var pendingAmount = await _context.Bookings
            .Where(b => b.CreatedAt >= currentStartDate && b.CreatedAt <= currentEndDate &&
                        (b.Status == BookingStatus.PaymentPending || b.Status == BookingStatus.PendingApproval))
            .SumAsync(b => b.TotalPrice ?? 0, cancellationToken);

        var prevPendingAmount = await _context.Bookings
            .Where(b => b.CreatedAt >= prevStartDate && b.CreatedAt <= prevEndDate &&
                        (b.Status == BookingStatus.PaymentPending || b.Status == BookingStatus.PendingApproval))
            .SumAsync(b => b.TotalPrice ?? 0, cancellationToken);

        var pendingAmountChange = GetPercentageChange(pendingAmount, prevPendingAmount);

        var refundedAmount = await _context.BookingCancellations
            .Where(c => c.CreatedAt >= currentStartDate && c.CreatedAt <= currentEndDate)
            .SumAsync(c => c.OriginalAmount - c.CancellationFee, cancellationToken);

        var prevRefundedAmount = await _context.BookingCancellations
            .Where(c => c.CreatedAt >= prevStartDate && c.CreatedAt <= prevEndDate)
            .SumAsync(c => c.OriginalAmount - c.CancellationFee, cancellationToken);

        var refundedAmountChange = GetPercentageChange(refundedAmount, prevRefundedAmount);

        // 2. Booking Financial Summary
        var currentBookings = await _context.Bookings
            .Where(b => b.CreatedAt >= currentStartDate && b.CreatedAt <= currentEndDate)
            .Select(b => new { b.Status, TotalPrice = b.TotalPrice ?? 0 })
            .ToListAsync(cancellationToken);

        var totalBookingsAmount = currentBookings.Sum(b => b.TotalPrice);

        var completedGroup = currentBookings.Where(b => b.Status == BookingStatus.Completed).ToList();
        var activeGroup = currentBookings.Where(b => b.Status == BookingStatus.Active).ToList();
        var pendingGroup = currentBookings.Where(b => b.Status == BookingStatus.PaymentPending || b.Status == BookingStatus.PendingApproval).ToList();
        var cancelledGroup = currentBookings.Where(b => b.Status == BookingStatus.Cancelled || b.Status == BookingStatus.CancelledByAdmin).ToList();

        var bookingSummary = new List<BookingSummaryItemDto>
        {
            new BookingSummaryItemDto(
                Status: "Completed",
                Bookings: completedGroup.Count,
                Amount: completedGroup.Sum(g => g.TotalPrice),
                Percentage: totalBookingsAmount > 0 ? Math.Round((completedGroup.Sum(g => g.TotalPrice) / totalBookingsAmount) * 100m, 2) : 0m
            ),
            new BookingSummaryItemDto(
                Status: "Active",
                Bookings: activeGroup.Count,
                Amount: activeGroup.Sum(g => g.TotalPrice),
                Percentage: totalBookingsAmount > 0 ? Math.Round((activeGroup.Sum(g => g.TotalPrice) / totalBookingsAmount) * 100m, 2) : 0m
            ),
            new BookingSummaryItemDto(
                Status: "Pending Payment",
                Bookings: pendingGroup.Count,
                Amount: pendingGroup.Sum(g => g.TotalPrice),
                Percentage: totalBookingsAmount > 0 ? Math.Round((pendingGroup.Sum(g => g.TotalPrice) / totalBookingsAmount) * 100m, 2) : 0m
            ),
            new BookingSummaryItemDto(
                Status: "Cancelled",
                Bookings: cancelledGroup.Count,
                Amount: cancelledGroup.Sum(g => g.TotalPrice),
                Percentage: totalBookingsAmount > 0 ? Math.Round((cancelledGroup.Sum(g => g.TotalPrice) / totalBookingsAmount) * 100m, 2) : 0m
            )
        };

        // 3. Monthly Revenue (Current Calendar Year)
        var startOfYear = new DateTime(currentEndDate.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfYear = new DateTime(currentEndDate.Year, 12, 31, 23, 59, 59, DateTimeKind.Utc);
        var bookingsForYear = await _context.Bookings
            .Where(b => b.CreatedAt >= startOfYear && b.CreatedAt <= endOfYear &&
                        (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Active || b.Status == BookingStatus.Completed))
            .Select(b => new { b.CreatedAt, TotalPrice = b.TotalPrice ?? 0 })
            .ToListAsync(cancellationToken);

        var monthlyRevenue = new List<MonthlyRevenuePointDto>();
        var months = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
        for (int i = 1; i <= 12; i++)
        {
            var monthName = months[i - 1];
            var rev = bookingsForYear.Where(b => b.CreatedAt.Month == i).Sum(b => b.TotalPrice);
            monthlyRevenue.Add(new MonthlyRevenuePointDto(monthName, rev));
        }

        // 4. Payment Methods
        var paymentsInPeriod = await _context.Payments
            .Where(p => p.CreatedAt >= currentStartDate && p.CreatedAt <= currentEndDate &&
                        (p.Status == "Captured" || p.Status == "Authorized"))
            .Select(p => new { p.PaymentMethod, p.Amount })
            .ToListAsync(cancellationToken);

        var totalPaymentsAmount = paymentsInPeriod.Sum(p => p.Amount);
        var paymentMethods = paymentsInPeriod
            .GroupBy(p => p.PaymentMethod?.ToLower() ?? "other")
            .Select(g => {
                var rawMethod = g.Key;
                var displayName = rawMethod switch
                {
                    "card" => "Visa / Card",
                    "cash" => "Cash",
                    "wallet" => "Wallet",
                    "bank" => "Bank Transfer",
                    _ => char.ToUpper(rawMethod[0]) + rawMethod[1..]
                };
                var amount = g.Sum(x => x.Amount);
                return new PaymentMethodSummaryDto(
                    Method: displayName,
                    Count: g.Count(),
                    PaidAmount: amount,
                    Amount: amount,
                    Percentage: totalPaymentsAmount > 0 ? Math.Round((amount / totalPaymentsAmount) * 100m, 2) : 0m
                );
            })
            .ToList();

        // 5. Recent Payments
        var recentPaymentsDb = await _context.Payments
            .Include(p => p.Booking)
                .ThenInclude(b => b!.User)
            .Include(p => p.Booking)
                .ThenInclude(b => b!.Vehicle)
            .Where(p => p.CreatedAt >= currentStartDate && p.CreatedAt <= currentEndDate)
            .OrderByDescending(p => p.CreatedAt)
            .Take(5)
            .ToListAsync(cancellationToken);

        var recentPayments = recentPaymentsDb.Select(p => {
            var customerName = p.Booking?.User != null 
                ? $"{p.Booking.User.FirstName} {p.Booking.User.LastName}".Trim() 
                : "Unknown Customer";
            var vehicleName = p.Booking?.Vehicle != null 
                ? $"{p.Booking.Vehicle.Make} {p.Booking.Vehicle.Model}" 
                : "Unknown Vehicle";
            var bookingNum = p.Booking?.BookingNumber 
                ?? "#" + p.BookingId.ToString()[..8].ToUpperInvariant();
            return new RecentPaymentDto(
                BookingNumber: bookingNum,
                CustomerName: customerName,
                VehicleName: vehicleName,
                Amount: p.Amount,
                Method: p.PaymentMethod ?? "card",
                Status: p.Status ?? "Pending",
                Date: p.CreatedAt
            );
        }).ToList();

        // 6. Top Vehicles
        var topVehiclesDb = await _context.Bookings
            .Include(b => b.Vehicle)
                .ThenInclude(v => v!.Images)
            .Where(b => b.CreatedAt >= currentStartDate && b.CreatedAt <= currentEndDate && b.Status == BookingStatus.Completed && b.Vehicle != null)
            .GroupBy(b => b.VehicleId)
            .Select(g => new
            {
                VehicleId = g.Key,
                Vehicle = g.First().Vehicle!,
                BookingsCount = g.Count(),
                Revenue = g.Sum(b => b.TotalPrice ?? 0)
            })
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToListAsync(cancellationToken);

        int rank = 1;
        var topVehicles = topVehiclesDb.Select(v => new FinancialTopVehicleDto(
            Rank: rank++,
            VehicleName: $"{v.Vehicle.Make} {v.Vehicle.Model} ({v.Vehicle.Year})",
            CompletedBookings: v.BookingsCount,
            Revenue: v.Revenue,
            ImageUrl: v.Vehicle.Images.FirstOrDefault()?.ImageUrl
        )).ToList();

        // 7. Supplier Earnings
        var completedBookings = await _context.Bookings
            .Include(b => b.Vehicle)
            .Where(b => b.CreatedAt >= currentStartDate && b.CreatedAt <= currentEndDate && b.Status == BookingStatus.Completed && b.Vehicle != null)
            .ToListAsync(cancellationToken);

        var activeVehicles = await _context.Vehicles
            .Where(v => v.IsActive)
            .ToListAsync(cancellationToken);

        var companyProfiles = await _context.CompanyProfiles
            .Include(cp => cp.User)
            .ToListAsync(cancellationToken);

        var supplierIdsInPeriod = completedBookings.Select(b => b.Vehicle!.UserId)
            .Union(activeVehicles.Select(v => v.UserId))
            .Distinct()
            .ToList();

        var companyProfilesDict = companyProfiles.ToDictionary(cp => cp.UserId, cp => cp.CompanyName);

        var users = await _context.Users
            .Where(u => supplierIdsInPeriod.Contains(u.Id))
            .ToListAsync(cancellationToken);

        var supplierEarnings = supplierIdsInPeriod.Select(supplierId => {
            var supplierUser = users.FirstOrDefault(u => u.Id == supplierId);
            var supplierName = companyProfilesDict.TryGetValue(supplierId, out var cName)
                ? cName
                : (supplierUser != null ? $"{supplierUser.FirstName} {supplierUser.LastName}".Trim() : "Unknown Supplier");
            
            if (string.IsNullOrEmpty(supplierName))
            {
                supplierName = supplierUser?.Email ?? "Unknown Supplier";
            }

            var supplierVehicles = activeVehicles.Count(v => v.UserId == supplierId);
            var supplierBookings = completedBookings.Where(b => b.Vehicle!.UserId == supplierId).ToList();
            
            var revenue = supplierBookings.Sum(b => b.TotalPrice ?? 0m);
            var commission = supplierBookings.Sum(b => b.CommissionAmount ?? (b.TotalPrice ?? 0m) * 0.15m);
            var netAmount = revenue - commission;

            return new SupplierEarningItemDto(
                SupplierName: supplierName,
                TotalVehicles: supplierVehicles,
                CompletedBookings: supplierBookings.Count,
                Revenue: revenue,
                Commission: commission,
                NetAmount: netAmount
            );
        })
        .Where(s => s.CompletedBookings > 0 || s.TotalVehicles > 0)
        .OrderByDescending(s => s.Revenue)
        .ToList();

        return new FinancialReportDto(
            TotalRevenue: totalRevenue,
            TotalRevenueChange: totalRevenueChange,
            PaidAmount: paidAmount,
            PaidAmountChange: paidAmountChange,
            PendingAmount: pendingAmount,
            PendingAmountChange: pendingAmountChange,
            RefundedAmount: refundedAmount,
            RefundedAmountChange: refundedAmountChange,
            BookingSummary: bookingSummary.AsReadOnly(),
            MonthlyRevenue: monthlyRevenue.AsReadOnly(),
            PaymentMethods: paymentMethods.AsReadOnly(),
            RecentPayments: recentPayments.AsReadOnly(),
            TopVehicles: topVehicles.AsReadOnly(),
            SupplierEarnings: supplierEarnings.AsReadOnly()
        );
    }

    private static decimal GetPercentageChange(decimal current, decimal previous)
    {
        if (previous == 0)
            return current > 0 ? 100m : 0m;
        return Math.Round(((current - previous) / previous) * 100m, 2);
    }
}
