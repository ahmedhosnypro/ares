using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Supplier;

namespace Backend.Application.Services;

/// <summary>
/// Service interface for supplier management operations (admin functionality)
/// </summary>
public interface ISupplierService
{
    /// <summary>
    /// Gets paginated list of suppliers
    /// </summary>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of suppliers</returns>
    Task<PagedResult<SupplierManagementDto>> GetSuppliersAsync(
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a specific supplier by ID
    /// </summary>
    /// <param name="supplierId">Supplier ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Supplier details if found</returns>
    Task<SupplierManagementDto?> GetSupplierByIdAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a public list of suppliers for the landing page
    /// </summary>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of public supplier cards</returns>
    Task<PagedResult<Backend.Application.DTOs.Public.PublicSupplierDto>> GetPublicSuppliersAsync(
        int page = 1,
        int pageSize = 6,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single public supplier for detail or landing use
    /// </summary>
    /// <param name="supplierId">Supplier ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Public supplier card if found</returns>
    Task<Backend.Application.DTOs.Public.PublicSupplierDto?> GetPublicSupplierByIdAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new supplier account
    /// </summary>
    /// <param name="request">Supplier creation request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Supplier creation response</returns>
    Task<SupplierManagementResponse> CreateSupplierAsync(
        CreateSupplierRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing supplier account
    /// </summary>
    /// <param name="supplierId">Supplier ID to update</param>
    /// <param name="request">Supplier update request</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Supplier update response</returns>
    Task<SupplierManagementResponse> UpdateSupplierAsync(
        Guid supplierId,
        UpdateSupplierRequest request,
        CancellationToken cancellationToken = default);
}