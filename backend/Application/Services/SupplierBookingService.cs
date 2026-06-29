using Backend.Application.DTOs.Booking;
using Backend.Application.DTOs.Common;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services;

/// <summary>
/// Default implementation of <see cref="ISupplierBookingService"/>.
///
/// Design notes:
///   * Mirrors <see cref="SupplierVehicleService"/> in style — all
///     reads are <c>AsNoTracking</c>, ownership is enforced at the
///     query level (<c>v.UserId == supplierId</c>) so a forged id
///     simply yields an empty page or a 404.
///   * Pagination, search and filtering happen in the database to
///     avoid pulling whole tables into memory. Count and page rows
///     come from the same composed query, so filter changes apply
///     to both totals and rows.
///   * Payment status is resolved per page (single grouped query)
///     by picking the most recently-created <see cref="BookingPayment"/>
///     row for each booking on the page. Bookings without a
///     payment record report <c>"None"</c>.
///   * The existing admin <c>IBookingService.GetAdminBookingsAsync</c>
///     is intentionally NOT reused here: it always pulls the full
///     filtered set into memory before paging, which is wasteful
///     for suppliers who can have thousands of bookings. The
///     supplier portal is a brand-new entry point, so we use a
///     leaner, server-side-paged query instead — without touching
///     the admin flow.
/// </summary>
public class SupplierBookingService : ISupplierBookingService
{
    /// <summary>Reported when a booking has no <see cref="Backend.Domain.Entities.BookingPayment"/> row yet.</summary>
    public const string PaymentStatusNone = "None";

    private readonly IApplicationDbContext _context;
    private readonly ILogger<SupplierBookingService> _logger;

    public SupplierBookingService(
        IApplicationDbContext context,
        ILogger<SupplierBookingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<PagedResult<SupplierBookingListItemDto>> GetBookingsAsync(
        Guid supplierId,
        int page,
        int pageSize,
        SupplierBookingListFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        // ── Defensive paging bounds (same conventions as SupplierVehicleService) ─
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        // ── Base query — ownership enforced here, never relaxed below ────────────
        var query = _context.Bookings
            .AsNoTracking()
            .Where(b => b.Vehicle != null && b.Vehicle.UserId == supplierId);

        // ── Search across booking number, customer name, vehicle make/model ──────
        // We also match the concatenated "First Last" form so a user typing
        // "john smith" finds bookings for John Smith (FirstName + " " + LastName
        // matches), not just rows where one of those names contains the whole
        // search term.
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(b =>
                (b.BookingNumber != null && b.BookingNumber.ToLower().Contains(search)) ||
                (b.User != null && b.User.FirstName != null && b.User.FirstName.ToLower().Contains(search)) ||
                (b.User != null && b.User.LastName != null && b.User.LastName.ToLower().Contains(search)) ||
                (b.User != null && b.User.FirstName != null && b.User.LastName != null &&
                    ((b.User.FirstName + " " + b.User.LastName).ToLower().Contains(search))) ||
                (b.Vehicle != null && b.Vehicle.Make != null && b.Vehicle.Make.ToLower().Contains(search)) ||
                (b.Vehicle != null && b.Vehicle.Model != null && b.Vehicle.Model.ToLower().Contains(search)) ||
                (b.Vehicle != null && b.Vehicle.Make != null && b.Vehicle.Model != null &&
                    ((b.Vehicle.Make + " " + b.Vehicle.Model).ToLower().Contains(search))));
        }

        // ── Booking-status filter (case-insensitive, validated to enum) ──────────
        if (!string.IsNullOrWhiteSpace(filter.BookingStatus) &&
            Enum.TryParse<BookingStatus>(filter.BookingStatus, ignoreCase: true, out var parsedStatus))
        {
            query = query.Where(b => b.Status == parsedStatus);
        }

        // ── Payment-status filter (correlates against latest BookingPayment row) ─
        if (!string.IsNullOrWhiteSpace(filter.PaymentStatus))
        {
            var paymentStatus = filter.PaymentStatus.Trim();

            if (string.Equals(paymentStatus, PaymentStatusNone, StringComparison.OrdinalIgnoreCase))
            {
                // "None" ⇒ bookings without any payment row.
                query = query.Where(b => !_context.Payments.Any(p => p.BookingId == b.Id));
            }
            else
            {
                // Any other value ⇒ latest payment row's Status must match (case-insensitive).
                var paymentStatusLower = paymentStatus.ToLower();
                query = query.Where(b => _context.Payments
                    .Where(p => p.BookingId == b.Id)
                    .OrderByDescending(p => p.CreatedAt)
                    .Select(p => p.Status.ToLower())
                    .FirstOrDefault() == paymentStatusLower);
            }
        }

        // Stable ordering for pagination — newest first.
        query = query.OrderByDescending(b => b.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        var skip = (page - 1) * pageSize;

        // ── Project only the columns the list view needs ─────────────────────────
        // Using a projection here (instead of Include + materialize) keeps the
        // SQL lean: only the booking + customer + vehicle columns we surface
        // are pulled, plus a sub-select for the primary image.
        var pageRows = await query
            .Skip(skip)
            .Take(pageSize)
            .Select(b => new
            {
                BookingId = b.Id,
                BookingNumber = b.BookingNumber ?? string.Empty,
                CustomerFirstName = b.User != null ? b.User.FirstName : string.Empty,
                CustomerLastName = b.User != null ? b.User.LastName : string.Empty,
                VehicleId = b.VehicleId,
                VehicleMake = b.Vehicle != null ? (b.Vehicle.Make ?? string.Empty) : string.Empty,
                VehicleModel = b.Vehicle != null ? (b.Vehicle.Model ?? string.Empty) : string.Empty,
                PrimaryImage = b.Vehicle != null
                    ? (b.Vehicle.Images.Where(i => i.IsPrimary).Select(i => i.ImageUrl).FirstOrDefault()
                        ?? b.Vehicle.Images.Select(i => i.ImageUrl).FirstOrDefault()
                        ?? string.Empty)
                    : string.Empty,
                PickupDate = b.PickupDate ?? DateTime.MinValue,
                ReturnDate = b.ReturnDate ?? DateTime.MinValue,
                TotalPrice = b.TotalPrice ?? 0m,
                BookingStatus = b.Status,
                CreatedAt = b.CreatedAt,
                ApprovedBy = b.ApprovedBy,
                ApprovedAt = b.ApprovedAt,
                RejectionReason = b.RejectionReason,
            })
            .ToListAsync(cancellationToken);

        if (pageRows.Count == 0)
        {
            return new PagedResult<SupplierBookingListItemDto>(
                new List<SupplierBookingListItemDto>(),
                page,
                pageSize,
                totalCount,
                totalPages);
        }

        // ── Resolve latest payment status per booking in one round-trip ─────────
        var pageIds = pageRows.Select(r => r.BookingId).ToList();
        var latestPayments = await _context.Payments
            .AsNoTracking()
            .Where(p => pageIds.Contains(p.BookingId))
            .GroupBy(p => p.BookingId)
            .Select(g => new
            {
                BookingId = g.Key,
                Status = g.OrderByDescending(p => p.CreatedAt)
                    .Select(p => p.Status)
                    .FirstOrDefault(),
            })
            .ToDictionaryAsync(x => x.BookingId, x => x.Status ?? PaymentStatusNone, cancellationToken);

        var items = pageRows.Select(r =>
        {
            var customerName = $"{r.CustomerFirstName} {r.CustomerLastName}".Trim();
            latestPayments.TryGetValue(r.BookingId, out var paymentStatus);

            return new SupplierBookingListItemDto(
                BookingId: r.BookingId,
                BookingNumber: r.BookingNumber,
                CustomerName: customerName,
                VehicleId: r.VehicleId,
                VehicleMake: r.VehicleMake,
                VehicleModel: r.VehicleModel,
                VehicleImageUrl: r.PrimaryImage,
                PickupDate: r.PickupDate,
                ReturnDate: r.ReturnDate,
                TotalPrice: r.TotalPrice,
                BookingStatus: r.BookingStatus.ToString(),
                PaymentStatus: string.IsNullOrEmpty(paymentStatus) ? PaymentStatusNone : paymentStatus,
                CreatedAt: r.CreatedAt,
                ApprovedBy: r.ApprovedBy,
                ApprovedAt: r.ApprovedAt,
                RejectionReason: r.RejectionReason);
        }).ToList();

        _logger.LogInformation(
            "Supplier {SupplierId} fetched bookings page {Page}/{TotalPages} ({Count} rows of {TotalCount})",
            supplierId, page, totalPages, items.Count, totalCount);

        return new PagedResult<SupplierBookingListItemDto>(
            items, page, pageSize, totalCount, totalPages);
    }

    /// <inheritdoc />
    public async Task<SupplierBookingDetailsDto> GetBookingByIdAsync(
        Guid supplierId,
        Guid bookingId,
        CancellationToken cancellationToken = default)
    {
        // Ownership baked into the WHERE clause — wrong-owner ids never match.
        var row = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.Id == bookingId
                        && b.Vehicle != null
                        && b.Vehicle.UserId == supplierId)
            .Select(b => new
            {
                BookingId = b.Id,
                BookingNumber = b.BookingNumber ?? string.Empty,
                CreatedAt = b.CreatedAt,
                PickupDate = b.PickupDate ?? DateTime.MinValue,
                ReturnDate = b.ReturnDate ?? DateTime.MinValue,
                TotalDays = b.TotalDays,
                TotalPrice = b.TotalPrice ?? 0m,
                BookingStatus = b.Status,
                PickupLocation = b.PickupLocation,
                DropoffLocation = b.DropoffLocation,

                CustomerId = b.UserId,
                CustomerFirstName = b.User != null ? b.User.FirstName : string.Empty,
                CustomerLastName = b.User != null ? b.User.LastName : string.Empty,
                CustomerEmail = b.User != null ? b.User.Email : null,
                CustomerPhone = b.User != null ? b.User.PhoneNumber : null,

                VehicleId = b.VehicleId,
                VehicleMake = b.Vehicle != null ? (b.Vehicle.Make ?? string.Empty) : string.Empty,
                VehicleModel = b.Vehicle != null ? (b.Vehicle.Model ?? string.Empty) : string.Empty,
                VehicleYear = b.Vehicle != null ? b.Vehicle.Year : null,
                VehicleLicensePlate = b.Vehicle != null ? b.Vehicle.LicensePlate : null,
                VehicleImageUrl = b.Vehicle != null
                    ? (b.Vehicle.Images.Where(i => i.IsPrimary).Select(i => i.ImageUrl).FirstOrDefault()
                        ?? b.Vehicle.Images.Select(i => i.ImageUrl).FirstOrDefault()
                        ?? string.Empty)
                    : string.Empty,

                ApprovedBy = b.ApprovedBy,
                ApprovedAt = b.ApprovedAt,
                RejectionReason = b.RejectionReason,
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (row is null)
        {
            // 404 — never 403 — so we don't reveal which booking ids exist.
            throw new NotFoundException($"Booking with ID {bookingId} not found");
        }

        // Pull the latest payment record for this booking (if any).
        var latestPayment = await _context.Payments
            .AsNoTracking()
            .Where(p => p.BookingId == bookingId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Status,
                p.PaymentMethod,
                p.Amount,
                p.Currency,
                p.ProcessedAt,
            })
            .FirstOrDefaultAsync(cancellationToken);

        var customerName = $"{row.CustomerFirstName} {row.CustomerLastName}".Trim();

        // Resolve locations on the fly.
        var pickupName = await ResolveDisplayLocationAsync(row.PickupLocation, cancellationToken);
        var dropoffName = await ResolveDisplayLocationAsync(row.DropoffLocation, cancellationToken);

        return new SupplierBookingDetailsDto(
            BookingId: row.BookingId,
            BookingNumber: row.BookingNumber,
            CreatedAt: row.CreatedAt,
            PickupDate: row.PickupDate,
            ReturnDate: row.ReturnDate,
            TotalDays: row.TotalDays,
            TotalPrice: row.TotalPrice,
            BookingStatus: row.BookingStatus.ToString(),
            PickupLocation: pickupName,
            DropoffLocation: dropoffName,

            CustomerId: row.CustomerId,
            CustomerName: customerName,
            CustomerEmail: row.CustomerEmail,
            CustomerPhone: row.CustomerPhone,

            VehicleId: row.VehicleId,
            VehicleMake: row.VehicleMake,
            VehicleModel: row.VehicleModel,
            VehicleYear: row.VehicleYear,
            VehicleLicensePlate: row.VehicleLicensePlate,
            VehicleImageUrl: row.VehicleImageUrl,

            PaymentStatus: latestPayment?.Status ?? PaymentStatusNone,
            PaymentMethod: latestPayment?.PaymentMethod,
            PaymentAmount: latestPayment?.Amount,
            PaymentCurrency: latestPayment?.Currency,
            PaymentProcessedAt: latestPayment?.ProcessedAt,
            ApprovedBy: row.ApprovedBy,
            ApprovedAt: row.ApprovedAt,
            RejectionReason: row.RejectionReason);
    }

    private async Task<string> ResolveDisplayLocationAsync(string? locationStr, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(locationStr))
            return string.Empty;

        if (Guid.TryParse(locationStr, out var guid))
        {
            var loc = await _context.UserAddresses.FirstOrDefaultAsync(l => l.Id == guid, cancellationToken);
            if (loc != null)
            {
                var parts = new List<string>();
                if (!string.IsNullOrWhiteSpace(loc.City)) parts.Add(loc.City);
                if (!string.IsNullOrWhiteSpace(loc.Governorate)) parts.Add(loc.Governorate);
                if (!string.IsNullOrWhiteSpace(loc.Country)) parts.Add(loc.Country);
                if (parts.Count > 0) return string.Join(", ", parts);
            }
            return "Unknown Location";
        }

        return locationStr;
    }
}
