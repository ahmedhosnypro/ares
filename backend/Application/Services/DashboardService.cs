using Backend.Application.DTOs.Dashboard;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
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
            pendingBookings = supplierBookings.Count(b => b.Status == "Pending");
            totalRevenue = supplierBookings
                .Where(b => b.Status == "Paid" || b.Status == "Completed")
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
            pendingBookings = allBookings.Count(b => b.Status == "Pending");
            totalRevenue = allBookings
                .Where(b => b.Status == "Paid" || b.Status == "Completed")
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
}
