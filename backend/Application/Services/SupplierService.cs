using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Supplier;
using Backend.Application.DTOs.Public;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services;

/// <summary>
/// Service implementation for supplier management operations (admin functionality)
/// </summary>
public class SupplierService : ISupplierService
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly IUserRepository _userRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly ILogger<SupplierService> _logger;
    // Optional + nullable so existing unit tests keep compiling without
    // a notification-service mock. Admin fan-out is best-effort.
    private readonly INotificationService? _notificationService;

    public SupplierService(
        ISupplierRepository supplierRepository,
        IUserRepository userRepository,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        ILogger<SupplierService> logger,
        INotificationService? notificationService = null)
    {
        _supplierRepository = supplierRepository;
        _userRepository = userRepository;
        _userManager = userManager;
        _roleManager = roleManager;
        _logger = logger;
        _notificationService = notificationService;
    }

    /// <summary>
    /// Gets paginated list of suppliers
    /// Validates: Requirements 13.1
    /// </summary>
    public async Task<PagedResult<SupplierManagementDto>> GetSuppliersAsync(
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting paginated suppliers list - Page: {Page}, PageSize: {PageSize}", page, pageSize);

        // Validate pagination parameters
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100; // Limit max page size

        // Get paginated suppliers
        var pagedSuppliers = await _supplierRepository.GetSuppliersAsync(page, pageSize, cancellationToken);

        // Convert to DTOs
        var supplierDtos = new List<SupplierManagementDto>();
        foreach (var supplier in pagedSuppliers.Data)
        {
            var roles = await _userManager.GetRolesAsync(supplier);
            var companyProfile = await _supplierRepository.GetCompanyProfileAsync(supplier.Id, cancellationToken);

            var companyProfileDto = companyProfile != null
                ? new CompanyProfileDto(
                    companyProfile.CompanyName,
                    companyProfile.CommercialRegistrationNumber,
                    companyProfile.TaxId)
                : null;

            var supplierDto = new SupplierManagementDto(
                Id: supplier.Id,
                Email: supplier.Email ?? string.Empty,
                FirstName: supplier.FirstName,
                LastName: supplier.LastName,
                PhoneNumber: supplier.PhoneNumber,
                EmailConfirmed: supplier.EmailConfirmed,
                PhoneNumberConfirmed: supplier.PhoneNumberConfirmed,
                Status: supplier.Status,
                Roles: roles.ToList(),
                CreatedAt: supplier.CreatedAt,
                UpdatedAt: supplier.UpdatedAt,
                CompanyProfile: companyProfileDto
            );
            supplierDtos.Add(supplierDto);
        }

        var result = new PagedResult<SupplierManagementDto>(
            Data: supplierDtos,
            Page: pagedSuppliers.Page,
            PageSize: pagedSuppliers.PageSize,
            TotalCount: pagedSuppliers.TotalCount,
            TotalPages: pagedSuppliers.TotalPages
        );

        _logger.LogInformation(
            "Successfully retrieved {Count} suppliers from page {Page} of {TotalPages}",
            supplierDtos.Count,
            page,
            result.TotalPages);

        return result;
    }

    /// <summary>
    /// Gets a specific supplier by ID
    /// Validates: Requirements 13.2
    /// </summary>
    public async Task<SupplierManagementDto?> GetSupplierByIdAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting supplier by ID: {SupplierId}", supplierId);

        var supplier = await _supplierRepository.GetSupplierWithCompanyProfileAsync(supplierId, cancellationToken);
        if (supplier == null)
        {
            _logger.LogWarning("Supplier {SupplierId} not found", supplierId);
            return null;
        }

        var roles = await _userManager.GetRolesAsync(supplier);
        var companyProfile = await _supplierRepository.GetCompanyProfileAsync(supplierId, cancellationToken);

        var companyProfileDto = companyProfile != null
            ? new CompanyProfileDto(
                companyProfile.CompanyName,
                companyProfile.CommercialRegistrationNumber,
                companyProfile.TaxId)
            : null;

        var supplierDto = new SupplierManagementDto(
            Id: supplier.Id,
            Email: supplier.Email ?? string.Empty,
            FirstName: supplier.FirstName,
            LastName: supplier.LastName,
            PhoneNumber: supplier.PhoneNumber,
            EmailConfirmed: supplier.EmailConfirmed,
            PhoneNumberConfirmed: supplier.PhoneNumberConfirmed,
            Status: supplier.Status,
            Roles: roles.ToList(),
            CreatedAt: supplier.CreatedAt,
            UpdatedAt: supplier.UpdatedAt,
            CompanyProfile: companyProfileDto
        );

        _logger.LogInformation("Successfully retrieved supplier {SupplierId}", supplierId);
        return supplierDto;
    }

    public async Task<PagedResult<PublicSupplierDto>> GetPublicSuppliersAsync(
        int page = 1,
        int pageSize = 6,
        CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 6;
        if (pageSize > 20) pageSize = 20;

        var pagedSuppliers = await _supplierRepository.GetSuppliersAsync(page, pageSize, cancellationToken);
        var supplierDtos = new List<PublicSupplierDto>();

        foreach (var supplier in pagedSuppliers.Data)
        {
            var companyProfile = await _supplierRepository.GetCompanyProfileAsync(supplier.Id, cancellationToken);
            supplierDtos.Add(new PublicSupplierDto(
                Id: supplier.Id,
                CompanyName: companyProfile?.CompanyName ?? $"{supplier.FirstName} {supplier.LastName}".Trim(),
                Email: supplier.Email ?? string.Empty,
                PhoneNumber: supplier.PhoneNumber,
                ProfileImage: supplier.ProfileImage,
                Status: supplier.Status,
                CommercialRegistrationNumber: companyProfile?.CommercialRegistrationNumber,
                CreatedAt: supplier.CreatedAt));
        }

        return new PagedResult<PublicSupplierDto>(
            Data: supplierDtos,
            Page: pagedSuppliers.Page,
            PageSize: pagedSuppliers.PageSize,
            TotalCount: pagedSuppliers.TotalCount,
            TotalPages: pagedSuppliers.TotalPages);
    }

    public async Task<PublicSupplierDto?> GetPublicSupplierByIdAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default)
    {
        var supplier = await _supplierRepository.GetSupplierWithCompanyProfileAsync(supplierId, cancellationToken);
        if (supplier == null)
        {
            return null;
        }

        var companyProfile = await _supplierRepository.GetCompanyProfileAsync(supplierId, cancellationToken);

        return new PublicSupplierDto(
            Id: supplier.Id,
            CompanyName: companyProfile?.CompanyName ?? $"{supplier.FirstName} {supplier.LastName}".Trim(),
            Email: supplier.Email ?? string.Empty,
            PhoneNumber: supplier.PhoneNumber,
            ProfileImage: supplier.ProfileImage,
            Status: supplier.Status,
            CommercialRegistrationNumber: companyProfile?.CommercialRegistrationNumber,
            CreatedAt: supplier.CreatedAt);
    }

    /// <summary>
    /// Creates a new supplier account
    /// Validates: Requirements 13.3
    /// </summary>
    public async Task<SupplierManagementResponse> CreateSupplierAsync(
        CreateSupplierRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating new supplier with email: {Email}", request.Email);

        // Check if email already exists
        var existingUser = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (existingUser != null)
        {
            _logger.LogWarning("Attempt to create supplier with existing email: {Email}", request.Email);
            throw new ConflictException("A user with this email address already exists");
        }

        // Create new supplier user
        var supplier = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            Status = request.Status ?? "Active",
            EmailConfirmed = true, // Admin-created suppliers are pre-confirmed
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create supplier with password
        var result = await _userManager.CreateAsync(supplier, request.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.ToDictionary(
                e => e.Code,
                e => new[] { e.Description });
            _logger.LogError("Failed to create supplier {Email}: {Errors}", request.Email, string.Join(", ", result.Errors.Select(e => e.Description)));
            throw new ValidationException(errors);
        }

        // Assign Supplier role
        var roleExists = await _roleManager.RoleExistsAsync("Supplier");
        if (!roleExists)
        {
            _logger.LogError("Supplier role does not exist in the system");
            throw new InvalidOperationException("Supplier role is not configured in the system");
        }

        var roleResult = await _userManager.AddToRoleAsync(supplier, "Supplier");
        if (!roleResult.Succeeded)
        {
            _logger.LogError("Failed to assign Supplier role to user {UserId}", supplier.Id);
            throw new InvalidOperationException("Failed to assign Supplier role to the user");
        }

        // Create company profile
        var companyProfile = new CompanyProfile
        {
            Id = Guid.NewGuid(),
            UserId = supplier.Id,
            CompanyName = request.CompanyName,
            CommercialRegistrationNumber = request.CommercialRegistrationNumber,
            TaxId = request.TaxId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _supplierRepository.UpsertCompanyProfileAsync(companyProfile, cancellationToken);

        _logger.LogInformation("Successfully created supplier {SupplierId} with email {Email}", supplier.Id, request.Email);

        // Fan-out to other admins so the admin notification feed reflects
        // real platform activity. Best-effort — never roll back the create.
        if (_notificationService is not null)
        {
            try
            {
                var companyLabel = string.IsNullOrWhiteSpace(request.CompanyName)
                    ? $"{request.FirstName} {request.LastName}".Trim()
                    : request.CompanyName!;
                await _notificationService.NotifyAdminsAsync(
                    "New supplier registered",
                    $"{companyLabel} ({request.Email}) was registered as a supplier.",
                    "SupplierRegistered",
                    cancellationToken);
            }
            catch
            {
                // Best-effort only.
            }
        }

        return new SupplierManagementResponse(
            Success: true,
            Message: "Supplier created successfully",
            SupplierId: supplier.Id
        );
    }

    /// <summary>
    /// Updates an existing supplier account
    /// Validates: Requirements 13.4
    /// </summary>
    public async Task<SupplierManagementResponse> UpdateSupplierAsync(
        Guid supplierId,
        UpdateSupplierRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating supplier {SupplierId}", supplierId);

        var supplier = await _supplierRepository.GetSupplierWithCompanyProfileAsync(supplierId, cancellationToken);
        if (supplier == null)
        {
            _logger.LogWarning("Supplier {SupplierId} not found for update", supplierId);
            throw new NotFoundException($"Supplier with ID {supplierId} not found");
        }

        // Update basic properties
        supplier.FirstName = request.FirstName;
        supplier.LastName = request.LastName;
        supplier.Status = request.Status;
        supplier.UpdatedAt = DateTime.UtcNow;

        // Update phone number if changed
        if (supplier.PhoneNumber != request.PhoneNumber)
        {
            // Check if phone number is already in use by another user
            if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
            {
                var phoneExists = await _userRepository.GetAllAsync(cancellationToken);
                var phoneInUse = phoneExists.Any(u => u.PhoneNumber == request.PhoneNumber && u.Id != supplierId);

                if (phoneInUse)
                {
                    throw new ConflictException("Phone number is already in use by another user");
                }
            }

            supplier.PhoneNumber = request.PhoneNumber;
            supplier.PhoneNumberConfirmed = false; // Reset confirmation when phone changes
        }

        // Update supplier
        var updateResult = await _userManager.UpdateAsync(supplier);
        if (!updateResult.Succeeded)
        {
            var errors = updateResult.Errors.ToDictionary(
                e => e.Code,
                e => new[] { e.Description });
            _logger.LogError("Failed to update supplier {SupplierId}: {Errors}", supplierId, string.Join(", ", updateResult.Errors.Select(e => e.Description)));
            throw new ValidationException(errors);
        }

        // Update company profile
        var companyProfile = new CompanyProfile
        {
            Id = Guid.NewGuid(), // Will be ignored if updating existing
            UserId = supplierId,
            CompanyName = request.CompanyName,
            CommercialRegistrationNumber = request.CommercialRegistrationNumber,
            TaxId = request.TaxId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _supplierRepository.UpsertCompanyProfileAsync(companyProfile, cancellationToken);

        _logger.LogInformation("Successfully updated supplier {SupplierId}", supplierId);

        return new SupplierManagementResponse(
            Success: true,
            Message: "Supplier updated successfully",
            SupplierId: supplierId
        );
    }

    /// <summary>
    /// Deletes a supplier account
    /// </summary>
    public async Task<SupplierManagementResponse> DeleteSupplierAsync(
        Guid supplierId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting supplier {SupplierId}", supplierId);

        var supplier = await _supplierRepository.GetSupplierWithCompanyProfileAsync(supplierId, cancellationToken);
        if (supplier == null)
        {
            _logger.LogWarning("Supplier {SupplierId} not found for deletion", supplierId);
            throw new NotFoundException($"Supplier with ID {supplierId} not found");
        }

        // Soft delete by setting status to Deleted
        supplier.Status = "Deleted";
        supplier.UpdatedAt = DateTime.UtcNow;

        var updateResult = await _userManager.UpdateAsync(supplier);
        if (!updateResult.Succeeded)
        {
            var errors = updateResult.Errors.ToDictionary(
                e => e.Code,
                e => new[] { e.Description });
            _logger.LogError("Failed to delete supplier {SupplierId}: {Errors}", supplierId, string.Join(", ", updateResult.Errors.Select(e => e.Description)));
            throw new ValidationException(errors);
        }

        _logger.LogInformation("Successfully deleted supplier {SupplierId}", supplierId);

        return new SupplierManagementResponse(
            Success: true,
            Message: "Supplier deleted successfully",
            SupplierId: supplierId
        );
    }
}