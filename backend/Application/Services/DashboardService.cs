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

    public async Task<DashboardSummaryDto> GetSummaryAsync(Guid? supplierId, CancellationToken cancellationToken = default)
    {
        int totalUsers = 0;
        int totalSuppliers = 0;
        int totalVehicles = 0;
        int totalBookings = 0;
        int pendingBookings = 0;
        decimal totalRevenue = 0;

        if (supplierId.HasValue)
        {
            // Supplier specific stats
            totalVehicles = await _context.Vehicles
                .CountAsync(v => v.UserId == supplierId.Value, cancellationToken);

            var supplierBookings = await _context.Bookings
                .Include(b => b.Vehicle)
                .Where(b => b.Vehicle != null && b.Vehicle.UserId == supplierId.Value)
                .ToListAsync(cancellationToken);

            totalBookings = supplierBookings.Count;
            pendingBookings = supplierBookings.Count(b => b.Status == BookingStatus.Confirmed);
            totalRevenue = supplierBookings
                .Where(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed)
                .Sum(b => b.TotalPrice ?? 0);
        }
        else
        {
            // Admin stats
            totalUsers = await _context.Users.CountAsync(cancellationToken);

            var suppliers = await _userManager.GetUsersInRoleAsync("Supplier");
            totalSuppliers = suppliers.Count;

            totalVehicles = await _context.Vehicles.CountAsync(cancellationToken);

            var allBookings = await _context.Bookings.ToListAsync(cancellationToken);
            totalBookings = allBookings.Count;
            pendingBookings = allBookings.Count(b => b.Status == BookingStatus.Confirmed);
            totalRevenue = allBookings
                .Where(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed)
                .Sum(b => b.TotalPrice ?? 0);
        }

        return new DashboardSummaryDto(
            TotalUsers: totalUsers,
            TotalSuppliers: totalSuppliers,
            TotalVehicles: totalVehicles,
            TotalBookings: totalBookings,
            PendingBookings: pendingBookings,
            TotalRevenue: totalRevenue
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
}
