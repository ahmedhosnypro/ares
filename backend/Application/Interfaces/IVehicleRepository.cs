using Backend.Domain.Entities;

namespace Backend.Application.Interfaces;

/// <summary>
/// Repository interface for Vehicle entity with specialized vehicle operations
/// </summary>
public interface IVehicleRepository : IPaginatedRepository<Vehicle>
{
    /// <summary>
    /// Searches for available vehicles based on location and date criteria with optional filters
    /// </summary>
    /// <param name="pickupLocationId">Pickup location ID</param>
    /// <param name="returnLocationId">Optional return location ID</param>
    /// <param name="pickupDate">Pickup date</param>
    /// <param name="returnDate">Return date</param>
    /// <param name="category">Optional vehicle category filter</param>
    /// <param name="transmission">Optional transmission type filter</param>
    /// <param name="minPrice">Optional minimum price filter</param>
    /// <param name="maxPrice">Optional maximum price filter</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Collection of available vehicles matching the criteria</returns>
    Task<IEnumerable<Vehicle>> SearchAvailableVehiclesAsync(
        Guid pickupLocationId,
        Guid? returnLocationId,
        DateTime pickupDate,
        DateTime returnDate,
        string? category = null,
        string? transmission = null,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a vehicle is available for the specified date range
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="startDate">Start date of the rental period</param>
    /// <param name="endDate">End date of the rental period</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>True if vehicle is available, false otherwise</returns>
    Task<bool> IsAvailableAsync(
        Guid vehicleId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default,
        Guid? excludeUserId = null,
        Guid? excludeBookingId = null);

    /// <summary>
    /// Gets all images for a specific vehicle
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Collection of vehicle images</returns>
    Task<IEnumerable<VehicleImage>> GetVehicleImagesAsync(
        Guid vehicleId,
        CancellationToken cancellationToken = default);
}
