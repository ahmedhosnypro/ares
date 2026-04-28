using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Booking entity with specialized booking operations
/// </summary>
public class BookingRepository : PaginatedRepository<Booking>, IBookingRepository
{
    public BookingRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Booking>> GetUserBookingsAsync(
        Guid userId,
        List<Guid>? suppliers = null,
        List<string>? statuses = null,
        Guid? carId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? keyword = null,
        Guid? pickupLocationId = null,
        Guid? dropOffLocationId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(b => b.Vehicle)
                .ThenInclude(v => v!.Images)
            .Include(b => b.Vehicle)
                .ThenInclude(v => v!.User)
            .Include(b => b.Driver)
            .Include(b => b.User)
            .Where(b => b.UserId == userId);

        // Filter by suppliers (vehicle owners)
        if (suppliers != null && suppliers.Any())
        {
            query = query.Where(b => b.Vehicle != null && suppliers.Contains(b.Vehicle.UserId));
        }

        // Filter by statuses
        if (statuses != null && statuses.Any())
        {
            query = query.Where(b => b.Status != null && statuses.Contains(b.Status));
        }

        // Filter by vehicle ID
        if (carId.HasValue)
        {
            query = query.Where(b => b.VehicleId == carId.Value);
        }

        // Filter by date range
        if (fromDate.HasValue)
        {
            query = query.Where(b => b.PickupDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(b => b.ReturnDate <= toDate.Value);
        }

        // Filter by keyword (search in booking number and vehicle name)
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var lowerKeyword = keyword.ToLower();
            query = query.Where(b =>
                (b.BookingNumber != null && b.BookingNumber.ToLower().Contains(lowerKeyword)) ||
                (b.Vehicle != null && b.Vehicle.Make != null && b.Vehicle.Make.ToLower().Contains(lowerKeyword)) ||
                (b.Vehicle != null && b.Vehicle.Model != null && b.Vehicle.Model.ToLower().Contains(lowerKeyword)));
        }

        // Note: pickupLocationId and dropOffLocationId filters are included in the interface
        // but cannot be implemented until location fields are added to the Booking entity

        return await query
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasActiveBookingsAsync(
        Guid vehicleId,
        CancellationToken cancellationToken = default)
    {
        var activeStatuses = new[] { "Pending", "Deposit", "Paid", "Reserved", "Active", "PickedUp" };
        return await _dbSet
            .AnyAsync(b =>
                b.VehicleId == vehicleId &&
                b.Status != null &&
                activeStatuses.Contains(b.Status),
                cancellationToken);
    }

    public async Task<bool> HasUserBookingsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(b => b.UserId == userId, cancellationToken);
    }

    public async Task<Booking?> GetBookingWithDetailsAsync(
        Guid bookingId,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(b => b.Vehicle)
                .ThenInclude(v => v!.Images)
            .Include(b => b.Vehicle)
                .ThenInclude(v => v!.User)
            .Include(b => b.Driver)
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken);
    }

    public async Task<IEnumerable<Booking>> GetAdminBookingsAsync(
        Guid? supplierId = null,
        List<string>? statuses = null,
        Guid? carId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? keyword = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(b => b.Vehicle)
                .ThenInclude(v => v!.Images)
            .Include(b => b.Vehicle)
                .ThenInclude(v => v!.User)
            .Include(b => b.Driver)
            .Include(b => b.User)
            .AsQueryable();

        // Filter by supplier (vehicle owner)
        if (supplierId.HasValue)
        {
            query = query.Where(b => b.Vehicle != null && b.Vehicle.UserId == supplierId.Value);
        }

        // Filter by statuses
        if (statuses != null && statuses.Any())
        {
            query = query.Where(b => b.Status != null && statuses.Contains(b.Status));
        }

        // Filter by vehicle ID
        if (carId.HasValue)
        {
            query = query.Where(b => b.VehicleId == carId.Value);
        }

        // Filter by date range
        if (fromDate.HasValue)
        {
            query = query.Where(b => b.PickupDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(b => b.ReturnDate <= toDate.Value);
        }

        // Filter by keyword (search in booking number, vehicle name, customer name)
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var lowerKeyword = keyword.ToLower();
            query = query.Where(b =>
                (b.BookingNumber != null && b.BookingNumber.ToLower().Contains(lowerKeyword)) ||
                (b.Vehicle != null && b.Vehicle.Make != null && b.Vehicle.Make.ToLower().Contains(lowerKeyword)) ||
                (b.Vehicle != null && b.Vehicle.Model != null && b.Vehicle.Model.ToLower().Contains(lowerKeyword)) ||
                (b.User != null && b.User.FirstName != null && b.User.FirstName.ToLower().Contains(lowerKeyword)) ||
                (b.User != null && b.User.LastName != null && b.User.LastName.ToLower().Contains(lowerKeyword)));
        }

        return await query
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
