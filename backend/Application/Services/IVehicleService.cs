using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Vehicle;

namespace Backend.Application.Services;

/// <summary>
/// Service interface for vehicle-related operations
/// </summary>
public interface IVehicleService
{
    /// <summary>
    /// Searches for available vehicles based on criteria with pagination
    /// </summary>
    /// <param name="request">Search request with filters and pagination</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of vehicles matching the search criteria</returns>
    Task<PagedResult<VehicleListDto>> SearchVehiclesAsync(
        VehicleSearchRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets detailed information about a specific vehicle
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="pickupDate">Optional pickup date for pricing calculation</param>
    /// <param name="returnDate">Optional return date for pricing calculation</param>
    /// <param name="currency">Optional currency code</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Detailed vehicle information</returns>
    Task<VehicleDetailsDto> GetVehicleDetailsAsync(
        Guid vehicleId,
        DateTime? pickupDate = null,
        DateTime? returnDate = null,
        string? currency = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets availability calendar for a vehicle
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="startDate">Start date of the period</param>
    /// <param name="endDate">End date of the period</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Availability information with booked and blocked dates</returns>
    Task<VehicleAvailabilityDto> GetAvailabilityAsync(
        Guid vehicleId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculates pricing for a vehicle rental
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="request">Pricing request with dates and options</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Detailed pricing breakdown</returns>
    Task<VehiclePricingDto> CalculatePricingAsync(
        Guid vehicleId,
        PricingRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all images for a vehicle
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="size">Optional image size (thumbnail, medium, large)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Collection of vehicle images</returns>
    Task<IEnumerable<VehicleImageDto>> GetImagesAsync(
        Guid vehicleId,
        string? size = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets reviews for a specific vehicle with pagination
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="page">Page number</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <param name="sortBy">Sort field (date, rating, helpfulness)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of reviews</returns>
    Task<PagedResult<DTOs.Review.ReviewDto>> GetVehicleReviewsAsync(
        Guid vehicleId,
        int page,
        int pageSize,
        string sortBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a vehicle to user's favorites
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="userId">User ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if added successfully</returns>
    Task<bool> AddToFavoritesAsync(
        Guid vehicleId,
        Guid userId,
        CancellationToken cancellationToken = default);

    // Admin Vehicle Management Methods

    /// <summary>
    /// Gets a paginated list of vehicles for the admin/supplier dashboard
    /// </summary>
    Task<PagedResult<VehicleListDto>> GetAdminVehiclesAsync(
        int page,
        int size,
        AdminVehicleFilterRequest filter,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new vehicle (Admin/Supplier only)
    /// </summary>
    /// <param name="request">Vehicle creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Vehicle creation response</returns>
    Task<VehicleResponse> CreateVehicleAsync(
        CreateVehicleRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Uploads an image for a vehicle
    /// </summary>
    Task<VehicleImageDto> UploadImageAsync(
        Guid vehicleId,
        Microsoft.AspNetCore.Http.IFormFile file,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing vehicle (Admin/Supplier only)
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="request">Vehicle update request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Vehicle update response</returns>
    Task<VehicleResponse> UpdateVehicleAsync(
        Guid vehicleId,
        UpdateVehicleRequest request,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft deletes a vehicle (Admin/Supplier only)
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="currentUserId">Current User ID</param>
    /// <param name="isAdmin">Whether current user is Admin</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Vehicle deletion response</returns>
    Task<VehicleResponse> DeleteVehicleAsync(
        Guid vehicleId,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a vehicle has active bookings
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if vehicle has active bookings, false otherwise</returns>
    Task<bool> CheckActiveBookingsAsync(
        Guid vehicleId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Computes aggregate statistics for the Admin / Supplier vehicles dashboard
    /// (total, available, on-rental). Counts come straight from the database so
    /// they are independent of the table's pagination / search / filter state.
    ///
    /// Scoping mirrors <see cref="GetAdminVehiclesAsync"/>: Admin sees everything,
    /// suppliers see only their own vehicles.
    /// </summary>
    Task<AdminVehicleStatsDto> GetAdminVehicleStatsAsync(
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);
}
