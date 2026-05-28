using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Vehicle;

namespace Backend.Application.Interfaces;

/// <summary>
/// Supplier-scoped vehicle management service.
///
/// Every method takes the authenticated supplier id explicitly and uses it
/// as the ownership filter — callers (the controller) cannot escape that
/// boundary by mistake. Kept separate from <see cref="Backend.Application.Services.IVehicleService"/>
/// so existing admin/customer/public flows remain untouched.
/// </summary>
public interface ISupplierVehicleService
{
    /// <summary>
    /// Returns a paginated, filtered list of vehicles owned by the supplier.
    /// Soft-deleted (<c>IsActive == false</c>) rows are always excluded.
    /// </summary>
    Task<PagedResult<SupplierVehicleListItemDto>> GetVehiclesAsync(
        Guid supplierId,
        int page,
        int pageSize,
        SupplierVehicleListFilterRequest filter,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns a single vehicle owned by the supplier.
    /// Throws <see cref="Backend.Application.Exceptions.NotFoundException"/> if
    /// the vehicle does not exist or is owned by a different supplier — never
    /// leaks the existence of vehicles owned by other suppliers.
    /// </summary>
    Task<SupplierVehicleDetailsDto> GetVehicleByIdAsync(
        Guid supplierId,
        Guid vehicleId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new vehicle owned by the authenticated supplier.
    /// Owner is taken from <paramref name="supplierId"/>; the request body
    /// has no <c>UserId</c> field, so the frontend can't impersonate
    /// another supplier. New vehicles default to
    /// <c>Status = "Pending"</c> and <c>AvailabilityStatus = "Unavailable"</c>.
    /// </summary>
    Task<VehicleResponse> CreateVehicleAsync(
        Guid supplierId,
        CreateSupplierVehicleRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Uploads an image for a vehicle owned by the supplier.
    /// </summary>
    Task<VehicleImageDto> UploadImageAsync(
        Guid supplierId,
        Guid vehicleId,
        Microsoft.AspNetCore.Http.IFormFile file,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing supplier-owned vehicle.
    /// Throws <see cref="Backend.Application.Exceptions.ConflictException"/>
    /// if the vehicle is currently in a Rejected (read-only) state.
    /// </summary>
    Task<VehicleResponse> UpdateVehicleAsync(
        Guid supplierId,
        Guid vehicleId,
        UpdateSupplierVehicleRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft-deletes a supplier-owned vehicle (sets <c>IsActive = false</c>).
    /// Bookings, payments, and history rows are preserved.
    /// </summary>
    Task<VehicleResponse> DeleteVehicleAsync(
        Guid supplierId,
        Guid vehicleId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Quick toggle for <c>AvailabilityStatus</c>. Does not modify
    /// <c>Status</c>. Pending or Rejected vehicles cannot be made
    /// available — the call throws <see cref="Backend.Application.Exceptions.ConflictException"/>.
    /// </summary>
    Task<VehicleResponse> SetAvailabilityAsync(
        Guid supplierId,
        Guid vehicleId,
        bool available,
        CancellationToken cancellationToken = default);
}
