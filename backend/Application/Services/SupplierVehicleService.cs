using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Vehicle;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services;

/// <summary>
/// Default implementation of <see cref="ISupplierVehicleService"/>.
///
/// All read queries are <c>AsNoTracking</c> to avoid change-tracking
/// overhead. Write operations re-load the entity through tracking so EF
/// can detect property changes. Ownership is enforced uniformly — every
/// method either filters by <c>v.UserId == supplierId</c> in the query or
/// re-checks it after a tracked load and throws
/// <see cref="NotFoundException"/> on mismatch (we deliberately don't
/// return 403 for "wrong owner" because that would let an attacker
/// enumerate vehicle ids belonging to other suppliers).
/// </summary>
public class SupplierVehicleService : ISupplierVehicleService
{
    // ── Status string conventions used across the codebase ───────────────────
    // Vehicle.Status is a free-form string column (not an enum). The values
    // below are the ones the rest of the project already uses.
    public const string StatusPending = "Pending";
    public const string StatusApproved = "Approved";
    public const string StatusActive = "Active";   // legacy alias for "approved & live"
    public const string StatusRejected = "Rejected";
    public const string StatusDeleted = "Deleted";

    public const string AvailabilityAvailable = "Available";
    public const string AvailabilityUnavailable = "Unavailable";

    private readonly IApplicationDbContext _context;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly ILogger<SupplierVehicleService> _logger;

    public SupplierVehicleService(
        IApplicationDbContext context,
        IVehicleRepository vehicleRepository,
        IBookingRepository bookingRepository,
        ILogger<SupplierVehicleService> logger)
    {
        _context = context;
        _vehicleRepository = vehicleRepository;
        _bookingRepository = bookingRepository;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<PagedResult<SupplierVehicleListItemDto>> GetVehiclesAsync(
        Guid supplierId,
        int page,
        int pageSize,
        SupplierVehicleListFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        // Defensive bounds: reject unreasonable paging values without
        // letting them propagate as 500s from EF.
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Vehicles
            .AsNoTracking()
            .Include(v => v.Images)
            .Where(v => v.UserId == supplierId && v.IsActive);

        // ── Search across make / model / license plate ───────────────────────
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(v =>
                (v.Make != null && v.Make.ToLower().Contains(search)) ||
                (v.Model != null && v.Model.ToLower().Contains(search)) ||
                (v.LicensePlate != null && v.LicensePlate.ToLower().Contains(search)));
        }

        // ── Status filter (case-insensitive) ─────────────────────────────────
        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            var status = filter.Status.Trim().ToLower();
            query = query.Where(v => v.Status != null && v.Status.ToLower() == status);
        }

        // ── Availability filter (case-insensitive) ───────────────────────────
        if (!string.IsNullOrWhiteSpace(filter.AvailabilityStatus))
        {
            var availability = filter.AvailabilityStatus.Trim().ToLower();
            query = query.Where(v =>
                v.AvailabilityStatus != null && v.AvailabilityStatus.ToLower() == availability);
        }

        // Stable sort: most-recently-created first.
        query = query.OrderByDescending(v => v.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        var skip = (page - 1) * pageSize;

        var pageRows = await query
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        if (pageRows.Count == 0)
        {
            return new PagedResult<SupplierVehicleListItemDto>(
                new List<SupplierVehicleListItemDto>(),
                page,
                pageSize,
                totalCount,
                totalPages);
        }

        // ── Bookings count per vehicle on the page (single round-trip) ───────
        var pageIds = pageRows.Select(v => v.Id).ToList();
        var bookingCounts = await _context.Bookings
            .AsNoTracking()
            .Where(b => pageIds.Contains(b.VehicleId))
            .GroupBy(b => b.VehicleId)
            .Select(g => new { VehicleId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.VehicleId, x => x.Count, cancellationToken);

        var items = pageRows.Select(v =>
        {
            var primaryImage = v.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                              ?? v.Images.FirstOrDefault()?.ImageUrl
                              ?? string.Empty;

            bookingCounts.TryGetValue(v.Id, out var bookings);

            return new SupplierVehicleListItemDto(
                VehicleId: v.Id,
                Make: v.Make ?? string.Empty,
                Model: v.Model ?? string.Empty,
                Year: v.Year,
                ImageUrl: primaryImage,
                LicensePlate: v.LicensePlate ?? string.Empty,
                PricePerDay: v.PricePerDay ?? 0m,
                Status: v.Status ?? string.Empty,
                AvailabilityStatus: v.AvailabilityStatus ?? string.Empty,
                BookingsCount: bookings,
                CreatedAt: v.CreatedAt
            );
        }).ToList();

        return new PagedResult<SupplierVehicleListItemDto>(
            items, page, pageSize, totalCount, totalPages);
    }

    /// <inheritdoc />
    public async Task<SupplierVehicleDetailsDto> GetVehicleByIdAsync(
        Guid supplierId,
        Guid vehicleId,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles
            .AsNoTracking()
            .Include(v => v.Images)
            .FirstOrDefaultAsync(
                v => v.Id == vehicleId && v.UserId == supplierId && v.IsActive,
                cancellationToken);

        if (vehicle is null)
        {
            // Return 404 (not 403) so we don't leak ownership information.
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        var bookingsCount = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.VehicleId == vehicleId)
            .CountAsync(cancellationToken);

        var primaryImage = vehicle.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                          ?? vehicle.Images.FirstOrDefault()?.ImageUrl
                          ?? string.Empty;

        return new SupplierVehicleDetailsDto(
            VehicleId: vehicle.Id,
            Make: vehicle.Make ?? string.Empty,
            Model: vehicle.Model ?? string.Empty,
            Year: vehicle.Year,
            Color: vehicle.Color ?? string.Empty,
            LicensePlate: vehicle.LicensePlate ?? string.Empty,
            Transmission: vehicle.Transmission ?? string.Empty,
            FuelType: vehicle.FuelType ?? string.Empty,
            Seats: vehicle.Seats,
            PricePerDay: vehicle.PricePerDay ?? 0m,
            LocationCity: vehicle.LocationCity ?? string.Empty,
            Description: vehicle.Description ?? string.Empty,
            ImageUrl: primaryImage,
            Status: vehicle.Status ?? string.Empty,
            AvailabilityStatus: vehicle.AvailabilityStatus ?? string.Empty,
            BookingsCount: bookingsCount,
            IsReadOnly: IsReadOnly(vehicle.Status),
            CreatedAt: vehicle.CreatedAt
        );
    }

    /// <inheritdoc />
    public async Task<VehicleResponse> CreateVehicleAsync(
        Guid supplierId,
        CreateSupplierVehicleRequest request,
        CancellationToken cancellationToken = default)
    {
        // ── Uniqueness check on license plate, mirroring VehicleService ──────
        var existingPlate = await _context.Vehicles
            .AsNoTracking()
            .FirstOrDefaultAsync(
                v => v.LicensePlate == request.LicensePlate && v.IsActive,
                cancellationToken);
        if (existingPlate is not null)
        {
            throw new ConflictException(
                $"Vehicle with license plate {request.LicensePlate} already exists");
        }

        var vehicle = new Vehicle
        {
            UserId = supplierId,                    // ← owner forced from claim
            Make = request.Make,
            Model = request.Model,
            Year = request.Year,
            Color = request.Color,
            LicensePlate = request.LicensePlate,
            Transmission = request.Transmission,
            FuelType = request.FuelType,
            Seats = request.Seats,
            PricePerDay = request.PricePerDay,
            LocationCity = request.LocationCity,
            Description = request.Description,
            Status = StatusPending,                 // ← per spec
            AvailabilityStatus = AvailabilityUnavailable,
            IsActive = true,
            ApprovedAt = null,
        };

        // Single primary image, if provided.
        if (!string.IsNullOrWhiteSpace(request.ImageUrl))
        {
            vehicle.Images.Add(new VehicleImage
            {
                ImageUrl = request.ImageUrl,
                IsPrimary = true,
                DisplayOrder = 0,
            });
        }

        var created = await _vehicleRepository.AddAsync(vehicle, cancellationToken);
        await _vehicleRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Supplier {SupplierId} created vehicle {VehicleId} (Pending)",
            supplierId, created.Id);

        return new VehicleResponse(created.Id, "Vehicle created successfully");
    }

    /// <inheritdoc />
    public async Task<VehicleResponse> UpdateVehicleAsync(
        Guid supplierId,
        Guid vehicleId,
        UpdateSupplierVehicleRequest request,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle is null || !vehicle.IsActive || vehicle.UserId != supplierId)
        {
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        // Rejected ⇒ read-only per spec.
        if (IsRejected(vehicle.Status))
        {
            throw new ConflictException("Rejected vehicles cannot be edited.");
        }

        // License-plate collision check when caller is changing the plate.
        if (!string.IsNullOrWhiteSpace(request.LicensePlate) &&
            !string.Equals(request.LicensePlate, vehicle.LicensePlate, StringComparison.Ordinal))
        {
            var collision = await _context.Vehicles
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    v => v.LicensePlate == request.LicensePlate
                         && v.Id != vehicleId
                         && v.IsActive,
                    cancellationToken);
            if (collision is not null)
            {
                throw new ConflictException(
                    $"Vehicle with license plate {request.LicensePlate} already exists");
            }
        }

        // Partial-update semantics — only sent fields apply.
        if (!string.IsNullOrWhiteSpace(request.Make)) vehicle.Make = request.Make;
        if (!string.IsNullOrWhiteSpace(request.Model)) vehicle.Model = request.Model;
        if (request.Year.HasValue) vehicle.Year = request.Year.Value;
        if (!string.IsNullOrWhiteSpace(request.Color)) vehicle.Color = request.Color;
        if (!string.IsNullOrWhiteSpace(request.LicensePlate)) vehicle.LicensePlate = request.LicensePlate;
        if (!string.IsNullOrWhiteSpace(request.Transmission)) vehicle.Transmission = request.Transmission;
        if (!string.IsNullOrWhiteSpace(request.FuelType)) vehicle.FuelType = request.FuelType;
        if (request.Seats.HasValue) vehicle.Seats = request.Seats.Value;
        if (request.PricePerDay.HasValue) vehicle.PricePerDay = request.PricePerDay.Value;
        if (!string.IsNullOrWhiteSpace(request.LocationCity)) vehicle.LocationCity = request.LocationCity;
        if (request.Description != null) vehicle.Description = request.Description;

        // Single image: replace primary if provided. We do not delete other
        // images here — that's a follow-up feature when multi-image support
        // arrives.
        if (!string.IsNullOrWhiteSpace(request.ImageUrl))
        {
            var primary = vehicle.Images.FirstOrDefault(i => i.IsPrimary);
            if (primary is null)
            {
                vehicle.Images.Add(new VehicleImage
                {
                    VehicleId = vehicle.Id,
                    ImageUrl = request.ImageUrl,
                    IsPrimary = true,
                    DisplayOrder = 0,
                });
            }
            else
            {
                primary.ImageUrl = request.ImageUrl;
            }
        }

        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
        await _vehicleRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Supplier {SupplierId} updated vehicle {VehicleId}",
            supplierId, vehicleId);

        return new VehicleResponse(vehicleId, "Vehicle updated successfully");
    }

    /// <inheritdoc />
    public async Task<VehicleResponse> DeleteVehicleAsync(
        Guid supplierId,
        Guid vehicleId,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle is null || !vehicle.IsActive || vehicle.UserId != supplierId)
        {
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        // Mirrors the existing admin delete: refuse if active bookings exist
        // so historical data stays consistent.
        var hasActiveBookings = await _bookingRepository.HasActiveBookingsAsync(vehicleId, cancellationToken);
        if (hasActiveBookings)
        {
            throw new ConflictException("Cannot delete vehicle with active bookings");
        }

        // Soft delete only — preserves bookings, payments, history.
        vehicle.IsActive = false;
        vehicle.Status = StatusDeleted;
        vehicle.AvailabilityStatus = AvailabilityUnavailable;

        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
        await _vehicleRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Supplier {SupplierId} soft-deleted vehicle {VehicleId}",
            supplierId, vehicleId);

        return new VehicleResponse(vehicleId, "Vehicle deleted successfully");
    }

    /// <inheritdoc />
    public async Task<VehicleResponse> SetAvailabilityAsync(
        Guid supplierId,
        Guid vehicleId,
        bool available,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle is null || !vehicle.IsActive || vehicle.UserId != supplierId)
        {
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        // Only approved vehicles can be made available.
        if (available && !IsApproved(vehicle.Status))
        {
            throw new ConflictException(
                "Only approved vehicles can be marked as available.");
        }

        vehicle.AvailabilityStatus = available ? AvailabilityAvailable : AvailabilityUnavailable;
        // ⚠ Do NOT touch vehicle.Status here — availability and status are
        // independent dimensions per spec.

        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
        await _vehicleRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Supplier {SupplierId} set availability of vehicle {VehicleId} to {Availability}",
            supplierId, vehicleId, vehicle.AvailabilityStatus);

        return new VehicleResponse(
            vehicleId,
            available ? "Vehicle is now available" : "Vehicle is now unavailable");
    }

    // ── Helpers (status string interpretation) ───────────────────────────────

    private static bool IsRejected(string? status) =>
        !string.IsNullOrWhiteSpace(status) &&
        string.Equals(status, StatusRejected, StringComparison.OrdinalIgnoreCase);

    private static bool IsApproved(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return false;
        // Treat "Approved" and the legacy "Active" string as approved.
        return string.Equals(status, StatusApproved, StringComparison.OrdinalIgnoreCase) ||
               string.Equals(status, StatusActive, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsReadOnly(string? status) => IsRejected(status);
}
