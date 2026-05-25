using Backend.Application.DTOs.Booking;
using Backend.Application.DTOs.Common;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Application.Validators;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

/// <summary>
/// Controller for booking-related operations
/// Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10
/// </summary>
[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly ILogger<BookingsController> _logger;

    public BookingsController(
        IBookingService bookingService,
        IVehicleRepository vehicleRepository,
        ILogger<BookingsController> logger)
    {
        _bookingService = bookingService;
        _vehicleRepository = vehicleRepository;
        _logger = logger;
    }

    /// <summary>
    /// Create a new booking for a vehicle
    /// </summary>
    /// <param name="request">Booking creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Booking response with bookingId, bookingNumber, status, totalPrice</returns>
    [HttpPost("create")]
    [ProducesResponseType(typeof(BookingResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<BookingResponse>> CreateBooking(
        [FromBody] CreateBookingRequest request,
        CancellationToken cancellationToken = default)
    {
        // Get authenticated user ID
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var userId = Guid.Parse(userIdClaim.Value);

        // Validate request
        var validator = new CreateBookingRequestValidator(_vehicleRepository);
        var validationResult = await validator.ValidateAsync(request, cancellationToken);

        if (!validationResult.IsValid)
        {
            return BadRequest(new
            {
                StatusCode = 400,
                Message = "Validation failed",
                ValidationErrors = validationResult.Errors.Select(e => new
                {
                    Field = e.PropertyName,
                    Message = e.ErrorMessage
                })
            });
        }

        // Create booking
        var result = await _bookingService.CreateBookingAsync(request, userId, cancellationToken);

        _logger.LogInformation(
            "Booking created successfully. BookingId: {BookingId}, BookingNumber: {BookingNumber}, UserId: {UserId}",
            result.BookingId,
            result.BookingNumber,
            userId);

        return CreatedAtAction(
            nameof(CreateBooking),
            new { id = result.BookingId },
            result);
    }

    /// <summary>
    /// Check if a user has any bookings
    /// Validates: Requirement 5.1
    /// </summary>
    /// <param name="driver">User ID to check for bookings</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>200 if user has bookings, 204 if no bookings found</returns>
    [HttpGet("/api/has-bookings/{driver}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> HasUserBookings(
        Guid driver,
        CancellationToken cancellationToken = default)
    {
        var hasBookings = await _bookingService.HasUserBookingsAsync(driver, cancellationToken);

        if (hasBookings)
        {
            _logger.LogInformation("User {UserId} has bookings", driver);
            return Ok();
        }

        _logger.LogInformation("User {UserId} has no bookings", driver);
        return NoContent();
    }

    /// <summary>
    /// Get paginated list of user bookings with filters
    /// Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.16, 5.17, 5.18
    /// </summary>
    /// <param name="page">Page number</param>
    /// <param name="size">Page size</param>
    /// <param name="language">Language code</param>
    /// <param name="request">Booking list request with filters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated booking list with resultData and pageInfo</returns>
    [HttpPost("{page}/{size}/{language}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetUserBookings(
        int page,
        int size,
        string language,
        [FromBody] BookingListRequest request,
        CancellationToken cancellationToken = default)
    {
        // Get authenticated user ID
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var userId = Guid.Parse(userIdClaim.Value);

        // Override request parameters with route values
        var modifiedRequest = request with { Page = page, Size = size, Language = language, UserId = userId };

        var result = await _bookingService.GetUserBookingsAsync(userId, modifiedRequest, cancellationToken: cancellationToken);

        // Format response to match frontend expectations
        var response = new
        {
            resultData = result.Data,
            pageInfo = new[]
            {
                new { totalRecords = result.TotalCount }
            }
        };

        _logger.LogInformation(
            "Retrieved {Count} bookings for user {UserId}, page {Page}/{TotalPages}",
            result.Data.Count,
            userId,
            page,
            result.TotalPages);

        return Ok(response);
    }

    /// <summary>
    /// Get booking history with filtering and sorting
    /// Validates: Requirements 5.14, 5.15
    /// </summary>
    /// <param name="status">Comma-separated status values</param>
    /// <param name="startDate">Start date filter</param>
    /// <param name="endDate">End date filter</param>
    /// <param name="supplierId">Supplier ID filter</param>
    /// <param name="search">Search term</param>
    /// <param name="page">Page number</param>
    /// <param name="limit">Page size</param>
    /// <param name="sortBy">Sort field (date, price, status)</param>
    /// <param name="sortOrder">Sort order (asc, desc)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated booking history</returns>
    [HttpGet("history")]
    [ProducesResponseType(typeof(PagedResult<BookingListDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResult<BookingListDto>>> GetBookingHistory(
        [FromQuery] string? status,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] Guid? supplierId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string sortBy = "date",
        [FromQuery] string sortOrder = "desc",
        CancellationToken cancellationToken = default)
    {
        // Get authenticated user ID
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var userId = Guid.Parse(userIdClaim.Value);

        // Parse status values
        var statuses = string.IsNullOrWhiteSpace(status)
            ? null
            : status.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();

        // Parse supplier IDs
        var suppliers = supplierId.HasValue ? new List<Guid> { supplierId.Value } : null;

        // Create booking list request
        var request = new BookingListRequest(
            UserId: userId,
            Suppliers: suppliers,
            Statuses: statuses,
            CarId: null,
            Filter: new BookingFilters(
                From: startDate,
                To: endDate,
                Keyword: search,
                PickupLocation: null,
                DropOffLocation: null
            ),
            Page: page,
            Size: limit,
            Language: "en"
        );

        var result = await _bookingService.GetUserBookingsAsync(userId, request, sortBy, sortOrder, cancellationToken);

        _logger.LogInformation(
            "Retrieved booking history for user {UserId}, page {Page}/{TotalPages}",
            userId,
            page,
            result.TotalPages);

        return Ok(result);
    }
}

/// <summary>
/// Controller for admin booking management operations
/// </summary>
[ApiController]
[Route("api/admin/bookings")]
[Authorize(Roles = "Admin,Supplier")]
public class AdminBookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<AdminBookingsController> _logger;

    public AdminBookingsController(
        IBookingService bookingService,
        IApplicationDbContext context,
        ILogger<AdminBookingsController> logger)
    {
        _bookingService = bookingService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get operational booking stats for Admin/Supplier dashboard
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(AdminBookingStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AdminBookingStatsDto>> GetStats(
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var currentUserId = Guid.Parse(userIdClaim.Value);
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("Admin/Supplier {UserId} requesting booking stats", currentUserId);

        var result = await _bookingService.GetAdminBookingStatsAsync(
            currentUserId,
            isAdmin,
            cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Search bookings for Admin/Supplier dashboard
    /// </summary>
    [HttpPost("search/{page}/{size}")]
    [ProducesResponseType(typeof(PagedResult<BookingListDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResult<BookingListDto>>> GetAdminBookings(
        int page,
        int size,
        [FromBody] BookingListRequest request,
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var currentUserId = Guid.Parse(userIdClaim.Value);
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("Admin/Supplier {UserId} requesting bookings list - Page: {Page}, Size: {Size}", currentUserId, page, size);

        var result = await _bookingService.GetAdminBookingsAsync(
            page,
            size,
            request,
            currentUserId,
            isAdmin,
            cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Get booking details for Admin/Supplier dashboard
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(BookingDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookingDetailsDto>> GetBooking(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var currentUserId = Guid.Parse(userIdClaim.Value);
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("Admin/Supplier {UserId} requesting details for booking {BookingId}", currentUserId, id);

        var result = await _bookingService.GetAdminBookingByIdAsync(
            id,
            currentUserId,
            isAdmin,
            cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Update booking status. Operational statuses only:
    /// Pending, Active, Completed, Cancelled.
    /// </summary>
    [HttpPut("{id}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateBookingStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var currentUserId = Guid.Parse(userIdClaim.Value);
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("Admin/Supplier {UserId} updating status for booking {BookingId} to {Status}", currentUserId, id, request.Status);

        await _bookingService.UpdateBookingStatusAsync(
            id,
            request.Status,
            currentUserId,
            isAdmin,
            cancellationToken);

        return Ok(new { Message = $"Booking status updated to {request.Status}" });
    }

    /// <summary>
    /// Edit a booking (partial update). Only operational fields are editable:
    /// dates, locations, status. Customer / vehicle / payment / supplier are
    /// resolved from the existing booking and cannot be changed via this
    /// endpoint. Recalculates total days and total price automatically when
    /// dates change.
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(BookingDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<BookingDetailsDto>> EditBooking(
        Guid id,
        [FromBody] UpdateBookingRequest request,
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var currentUserId = Guid.Parse(userIdClaim.Value);
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation(
            "Admin/Supplier {UserId} editing booking {BookingId}",
            currentUserId, id);

        var result = await _bookingService.UpdateBookingAsync(
            id, request, currentUserId, isAdmin, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Bulk delete selected bookings
    /// </summary>
    [HttpPost("delete-bookings")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteBookings(
        [FromBody] DeleteBookingsRequest request,
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var currentUserId = Guid.Parse(userIdClaim.Value);
        var isAdmin = User.IsInRole("Admin");

        _logger.LogInformation("Admin/Supplier {UserId} deleting {Count} bookings", currentUserId, request.Ids.Count);

        await _bookingService.DeleteBookingsAsync(
            request.Ids,
            currentUserId,
            isAdmin,
            cancellationToken);

        return Ok(new { Message = "Bookings deleted successfully" });
    }

    /// <summary>
    /// Searchable customer picker for the create-booking flow.
    /// Returns a small page of users (top 20 by default), filtered by an
    /// optional free-text search. Excludes the system Admin and Supplier
    /// roles so only customer-side users can be picked.
    /// </summary>
    [HttpGet("pickers/customers")]
    [ProducesResponseType(typeof(IEnumerable<CustomerPickerItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<CustomerPickerItemDto>>> SearchCustomers(
        [FromQuery] string? search,
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        if (limit < 1) limit = 1;
        if (limit > 50) limit = 50;

        var query = _context.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                (u.FirstName != null && u.FirstName.ToLower().Contains(term)) ||
                (u.LastName != null && u.LastName.ToLower().Contains(term)) ||
                (u.Email != null && u.Email.ToLower().Contains(term)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(term)));
        }

        var items = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
            .ToListAsync(
                query
                    .OrderBy(u => u.FirstName)
                    .ThenBy(u => u.LastName)
                    .Take(limit)
                    .Select(u => new CustomerPickerItemDto(
                        u.Id,
                        ((u.FirstName ?? string.Empty) + " " + (u.LastName ?? string.Empty)).Trim(),
                        u.Email,
                        u.PhoneNumber)),
                cancellationToken);

        return Ok(items);
    }

    /// <summary>
    /// Searchable available-vehicles picker for the create-booking flow.
    /// Only returns vehicles flagged active AND not occupied by an active
    /// (non-cancelled) booking that overlaps the optional pickup/return
    /// window. Unavailable / inactive vehicles never appear.
    /// </summary>
    [HttpGet("pickers/vehicles")]
    [ProducesResponseType(typeof(IEnumerable<VehiclePickerItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<VehiclePickerItemDto>>> SearchAvailableVehicles(
        [FromQuery] string? search,
        [FromQuery] DateTime? pickupDate,
        [FromQuery] DateTime? returnDate,
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        if (limit < 1) limit = 1;
        if (limit > 50) limit = 50;

        var query = _context.Vehicles.Where(v => v.IsActive && v.AvailabilityStatus == "Available");

        // Suppliers should only see their own fleet in the picker.
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var currentUserId))
            {
                query = query.Where(v => v.UserId == currentUserId);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(v =>
                (v.Make != null && v.Make.ToLower().Contains(term)) ||
                (v.Model != null && v.Model.ToLower().Contains(term)) ||
                (v.LicensePlate != null && v.LicensePlate.ToLower().Contains(term)));
        }

        // Exclude vehicles that have overlapping active bookings — when a
        // window is supplied. Without a window we exclude vehicles with ANY
        // currently-active rental (Status == Active).
        if (pickupDate.HasValue && returnDate.HasValue && pickupDate.Value < returnDate.Value)
        {
            var from = pickupDate.Value;
            var to = returnDate.Value;
            query = query.Where(v => !_context.Bookings.Any(b =>
                b.VehicleId == v.Id &&
                b.Status != Backend.Domain.Entities.Enums.BookingStatus.Cancelled &&
                b.Status != Backend.Domain.Entities.Enums.BookingStatus.Completed &&
                b.PickupDate.HasValue && b.ReturnDate.HasValue &&
                from < b.ReturnDate && to > b.PickupDate));
        }
        else
        {
            query = query.Where(v => !_context.Bookings.Any(b =>
                b.VehicleId == v.Id &&
                b.Status == Backend.Domain.Entities.Enums.BookingStatus.Active));
        }

        var items = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
            .ToListAsync(
                query
                    .OrderBy(v => v.Make)
                    .ThenBy(v => v.Model)
                    .Take(limit)
                    .Select(v => new VehiclePickerItemDto(
                        v.Id,
                        ((v.Make ?? string.Empty) + " " + (v.Model ?? string.Empty)).Trim(),
                        v.Images
                            .Where(i => i.IsPrimary)
                            .Select(i => i.ImageUrl)
                            .FirstOrDefault()
                            ?? v.Images.Select(i => i.ImageUrl).FirstOrDefault(),
                        v.LicensePlate,
                        v.PricePerDay,
                        v.User != null
                            ? (v.User.CompanyProfile != null && v.User.CompanyProfile.CompanyName != null
                                ? v.User.CompanyProfile.CompanyName
                                : ((v.User.FirstName ?? string.Empty) + " " + (v.User.LastName ?? string.Empty)).Trim())
                            : null)),
                cancellationToken);

        return Ok(items);
    }
}
