using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Vehicle;
using Backend.Application.Services;
using Backend.Application.Validators;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Api.Controllers;

/// <summary>
/// Vehicle management controller providing vehicle search, details, and administrative operations
/// </summary>
/// <remarks>
/// This controller handles all vehicle-related operations including:
/// - **Public Operations**: Vehicle search, details, availability, pricing, reviews, images
/// - **Authenticated Operations**: Add to favorites
/// - **Admin/Supplier Operations**: Create, update, delete vehicles
/// 
/// **Search and Filtering**: Advanced search with location, date, category, transmission, and price filters
/// **Availability**: Real-time availability checking with booking conflict prevention
/// **Pricing**: Dynamic pricing calculation with insurance and additional services
/// </remarks>
[ApiController]
[Route("api/vehicles")]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleService _vehicleService;
    private readonly ILogger<VehiclesController> _logger;

    public VehiclesController(IVehicleService vehicleService, ILogger<VehiclesController> logger)
    {
        _vehicleService = vehicleService;
        _logger = logger;
    }

    /// <summary>
    /// Search for available vehicles with filters and pagination
    /// </summary>
    /// <param name="pickupLocationId">Pickup location ID</param>
    /// <param name="returnLocationId">Optional return location ID</param>
    /// <param name="pickupDate">Pickup date</param>
    /// <param name="returnDate">Return date</param>
    /// <param name="category">Optional vehicle category filter</param>
    /// <param name="transmission">Optional transmission type filter</param>
    /// <param name="minPrice">Optional minimum price filter</param>
    /// <param name="maxPrice">Optional maximum price filter</param>
    /// <param name="sortBy">Optional sort field (price, distance, rating)</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="limit">Items per page (default: 20)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of available vehicles</returns>
    [HttpGet("search")]
    [ProducesResponseType(typeof(PagedResult<VehicleListDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<VehicleListDto>>> SearchVehicles(
        [FromQuery] Guid pickupLocationId,
        [FromQuery] Guid? returnLocationId,
        [FromQuery] DateTime pickupDate,
        [FromQuery] DateTime returnDate,
        [FromQuery] string? category,
        [FromQuery] string? transmission,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? sortBy,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        Guid? excludeUserId = null;
        if (User?.Identity?.IsAuthenticated == true && User.IsInRole("Supplier"))
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
            {
                excludeUserId = userId;
            }
        }

        var request = new VehicleSearchRequest(
            pickupLocationId,
            returnLocationId,
            pickupDate,
            returnDate,
            category,
            transmission,
            minPrice,
            maxPrice,
            sortBy,
            page,
            limit,
            ExcludeUserId: excludeUserId);

        var validator = new VehicleSearchRequestValidator();
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

        var result = await _vehicleService.SearchVehiclesAsync(request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get detailed information about a specific vehicle
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="pickupDate">Optional pickup date for pricing</param>
    /// <param name="returnDate">Optional return date for pricing</param>
    /// <param name="currency">Optional currency code</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Detailed vehicle information</returns>
    [HttpGet("{vehicleId}")]
    [ProducesResponseType(typeof(VehicleDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehicleDetailsDto>> GetVehicleDetails(
        Guid vehicleId,
        [FromQuery] DateTime? pickupDate,
        [FromQuery] DateTime? returnDate,
        [FromQuery] string? currency,
        CancellationToken cancellationToken = default)
    {
        var result = await _vehicleService.GetVehicleDetailsAsync(
            vehicleId,
            pickupDate,
            returnDate,
            currency,
            cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Get availability calendar for a vehicle
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="startDate">Start date of the period</param>
    /// <param name="endDate">End date of the period</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Availability information with booked and blocked dates</returns>
    [HttpGet("{vehicleId}/availability")]
    [ProducesResponseType(typeof(VehicleAvailabilityDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehicleAvailabilityDto>> GetAvailability(
        Guid vehicleId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        CancellationToken cancellationToken = default)
    {
        var result = await _vehicleService.GetAvailabilityAsync(
            vehicleId,
            startDate,
            endDate,
            cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Calculate pricing for a vehicle rental
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="pickupDate">Pickup date</param>
    /// <param name="returnDate">Return date</param>
    /// <param name="insuranceOptions">Optional insurance type</param>
    /// <param name="additionalServices">Optional additional services (comma-separated)</param>
    /// <param name="currency">Optional currency code</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Detailed pricing breakdown</returns>
    [HttpGet("{vehicleId}/pricing")]
    [ProducesResponseType(typeof(VehiclePricingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehiclePricingDto>> CalculatePricing(
        Guid vehicleId,
        [FromQuery] DateTime pickupDate,
        [FromQuery] DateTime returnDate,
        [FromQuery] string? insuranceOptions,
        [FromQuery] string? additionalServices,
        [FromQuery] string? currency,
        CancellationToken cancellationToken = default)
    {
        var request = new PricingRequest(
            pickupDate,
            returnDate,
            insuranceOptions,
            additionalServices,
            currency);

        var validator = new PricingRequestValidator();
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

        var result = await _vehicleService.CalculatePricingAsync(
            vehicleId,
            request,
            cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Get all images for a vehicle
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="size">Optional image size (thumbnail, medium, large)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Collection of vehicle images</returns>
    [HttpGet("{vehicleId}/images")]
    [ProducesResponseType(typeof(IEnumerable<VehicleImageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<VehicleImageDto>>> GetImages(
        Guid vehicleId,
        [FromQuery] string? size,
        CancellationToken cancellationToken = default)
    {
        var result = await _vehicleService.GetImagesAsync(vehicleId, size, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get reviews for a specific vehicle
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 10)</param>
    /// <param name="sortBy">Sort field (date, rating, helpfulness)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of reviews</returns>
    [HttpGet("{vehicleId}/reviews")]
    [ProducesResponseType(typeof(PagedResult<Backend.Application.DTOs.Review.ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PagedResult<Backend.Application.DTOs.Review.ReviewDto>>> GetReviews(
        Guid vehicleId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string sortBy = "date",
        CancellationToken cancellationToken = default)
    {
        var result = await _vehicleService.GetVehicleReviewsAsync(
            vehicleId,
            page,
            pageSize,
            sortBy,
            cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Add a vehicle to user's favorites
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Success confirmation</returns>
    [HttpPost("{vehicleId}/favorites")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> AddToFavorites(
        Guid vehicleId,
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var userId = Guid.Parse(userIdClaim.Value);
        var result = await _vehicleService.AddToFavoritesAsync(vehicleId, userId, cancellationToken);

        return Created($"/api/vehicles/{vehicleId}/favorites", new { Success = result, Message = "Vehicle added to favorites" });
    }

    // Admin Vehicle Management Endpoints

    /// <summary>
    /// Search vehicles for Admin/Supplier dashboard
    /// </summary>
    [HttpPost("search/{page}/{size}")]
    [Authorize(Roles = "Admin,Supplier")]
    [ProducesResponseType(typeof(PagedResult<VehicleListDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResult<VehicleListDto>>> GetAdminVehicles(
        int page,
        int size,
        [FromBody] AdminVehicleFilterRequest filter,
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var currentUserId = Guid.Parse(userIdClaim.Value);
        var isAdmin = User.IsInRole("Admin");

        var result = await _vehicleService.GetAdminVehiclesAsync(
            page,
            size,
            filter,
            currentUserId,
            isAdmin,
            cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Create a new vehicle (Admin/Supplier only)
    /// </summary>
    /// <param name="request">Vehicle creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Vehicle creation response</returns>
    [HttpPost("/api/admin/cars/create")]
    [Authorize(Roles = "Admin,Supplier")]
    [ProducesResponseType(typeof(VehicleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<VehicleResponse>> CreateVehicle(
        [FromBody] CreateVehicleRequest request,
        CancellationToken cancellationToken = default)
    {
        var validator = new CreateVehicleRequestValidator();
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

        var result = await _vehicleService.CreateVehicleAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetVehicleDetails), new { vehicleId = result.VehicleId }, result);
    }

    /// <summary>
    /// Update an existing vehicle (Admin/Supplier only)
    /// </summary>
    /// <param name="id">Vehicle ID</param>
    /// <param name="request">Vehicle update request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Vehicle update response</returns>
    [HttpPut("/api/admin/cars/{id}/edit")]
    [Authorize(Roles = "Admin,Supplier")]
    [ProducesResponseType(typeof(VehicleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<VehicleResponse>> UpdateVehicle(
        Guid id,
        [FromBody] UpdateVehicleRequest request,
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var currentUserId = Guid.Parse(userIdClaim.Value);
        var isAdmin = User.IsInRole("Admin");

        var validator = new UpdateVehicleRequestValidator();
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

        var result = await _vehicleService.UpdateVehicleAsync(id, request, currentUserId, isAdmin, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Delete a vehicle (Admin/Supplier only)
    /// </summary>
    /// <param name="id">Vehicle ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Vehicle deletion response</returns>
    [HttpDelete("/api/admin/cars/{id}/delete")]
    [Authorize(Roles = "Admin,Supplier")]
    [ProducesResponseType(typeof(VehicleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<VehicleResponse>> DeleteVehicle(
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

        var result = await _vehicleService.DeleteVehicleAsync(id, currentUserId, isAdmin, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Check if a vehicle has active bookings (Admin/Supplier only)
    /// </summary>
    /// <param name="id">Vehicle ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Boolean indicating if vehicle has active bookings</returns>
    [HttpGet("/api/admin/cars/{id}/check-bookings")]
    [Authorize(Roles = "Admin,Supplier")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<bool>> CheckVehicleBookings(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var hasActiveBookings = await _vehicleService.CheckActiveBookingsAsync(id, cancellationToken);
        return Ok(hasActiveBookings);
    }

    /// <summary>
    /// Aggregate statistics for the Admin / Supplier "Vehicles" dashboard
    /// (Total, Available, On-Rental). Counts are computed straight from the
    /// database, so they are independent of the table's pagination / search /
    /// filter state. Admin sees system-wide totals; suppliers see only their
    /// own vehicles (scoped by JWT claim).
    /// </summary>
    [HttpGet("admin/stats")]
    [Authorize(Roles = "Admin,Supplier")]
    [ProducesResponseType(typeof(AdminVehicleStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminVehicleStatsDto>> GetAdminVehicleStats(
        CancellationToken cancellationToken = default)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
        {
            return Unauthorized(new { Message = "User not authenticated" });
        }

        var currentUserId = Guid.Parse(userIdClaim.Value);
        var isAdmin = User.IsInRole("Admin");

        var stats = await _vehicleService.GetAdminVehicleStatsAsync(currentUserId, isAdmin, cancellationToken);
        return Ok(stats);
    }
}
