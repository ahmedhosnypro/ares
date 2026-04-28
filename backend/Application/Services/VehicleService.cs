using Backend.Application.DTOs.Common;
using Backend.Application.DTOs.Vehicle;
using Backend.Application.Exceptions;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services;

/// <summary>
/// Service implementation for vehicle-related operations
/// </summary>
public class VehicleService : IVehicleService
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IReviewRepository _reviewRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IApplicationDbContext _context;

    public VehicleService(
        IVehicleRepository vehicleRepository,
        IReviewRepository reviewRepository,
        IBookingRepository bookingRepository,
        IApplicationDbContext context)
    {
        _vehicleRepository = vehicleRepository;
        _reviewRepository = reviewRepository;
        _bookingRepository = bookingRepository;
        _context = context;
    }

    public async Task<PagedResult<VehicleListDto>> SearchVehiclesAsync(
        VehicleSearchRequest request,
        CancellationToken cancellationToken = default)
    {
        var vehicles = await _vehicleRepository.SearchAvailableVehiclesAsync(
            request.PickupLocationId,
            request.ReturnLocationId,
            request.PickupDate,
            request.ReturnDate,
            request.Category,
            request.Transmission,
            request.MinPrice,
            request.MaxPrice,
            cancellationToken);

        var vehicleList = vehicles.ToList();

        var vehicleDtos = new List<VehicleListDto>();
        foreach (var vehicle in vehicleList)
        {
            var averageRating = await GetAverageRatingAsync(vehicle.Id, cancellationToken);
            var reviewCount = await GetReviewCountAsync(vehicle.Id, cancellationToken);
            var primaryImage = vehicle.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl 
                             ?? vehicle.Images.FirstOrDefault()?.ImageUrl 
                             ?? string.Empty;

            vehicleDtos.Add(new VehicleListDto(
                vehicle.Id,
                vehicle.Make ?? string.Empty,
                vehicle.Model ?? string.Empty,
                vehicle.Status ?? string.Empty,
                vehicle.PricePerDay ?? 0,
                "USD",
                primaryImage,
                averageRating,
                reviewCount,
                null,
                vehicle.AvailabilityStatus == "Available"
            ));
        }

        if (!string.IsNullOrWhiteSpace(request.SortBy))
        {
            vehicleDtos = ApplySorting(vehicleDtos, request.SortBy);
        }

        var totalCount = vehicleDtos.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)request.Limit);
        var skip = (request.Page - 1) * request.Limit;
        var pagedData = vehicleDtos.Skip(skip).Take(request.Limit).ToList();

        return new PagedResult<VehicleListDto>(
            pagedData,
            request.Page,
            request.Limit,
            totalCount,
            totalPages);
    }

    public async Task<VehicleDetailsDto> GetVehicleDetailsAsync(
        Guid vehicleId,
        DateTime? pickupDate = null,
        DateTime? returnDate = null,
        string? currency = null,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles
            .Include(v => v.Images)
            .Include(v => v.User)
            .FirstOrDefaultAsync(v => v.Id == vehicleId, cancellationToken);

        if (vehicle == null)
        {
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        var features = await _context.VehicleFeatures
            .Where(vf => vf.VehicleId == vehicleId)
            .ToListAsync(cancellationToken);

        var averageRating = await GetAverageRatingAsync(vehicleId, cancellationToken);
        var reviewCount = await GetReviewCountAsync(vehicleId, cancellationToken);

        var imageDtos = vehicle.Images.Select(img => new VehicleImageDto(
            img.Id,
            img.ImageUrl,
            "medium",
            img.IsPrimary
        )).ToList();

        var featureDtos = features.Select(f => new VehicleFeatureDto(
            f.Id,
            f.FeatureName,
            f.FeatureDescription
        )).ToList();

        var supplierDto = new SupplierDto(
            vehicle.User?.Id ?? Guid.Empty,
            $"{vehicle.User?.FirstName} {vehicle.User?.LastName}".Trim()
        );

        return new VehicleDetailsDto(
            vehicle.Id,
            vehicle.Make ?? string.Empty,
            vehicle.Model ?? string.Empty,
            vehicle.Year ?? 0,
            vehicle.Color ?? string.Empty,
            vehicle.LicensePlate ?? string.Empty,
            vehicle.Transmission ?? string.Empty,
            vehicle.FuelType ?? string.Empty,
            vehicle.Seats ?? 0,
            vehicle.PricePerDay ?? 0,
            vehicle.LocationCity ?? string.Empty,
            vehicle.Description ?? string.Empty,
            vehicle.Status ?? string.Empty,
            vehicle.AvailabilityStatus ?? string.Empty,
            imageDtos,
            featureDtos,
            supplierDto,
            averageRating,
            reviewCount
        );
    }

    public async Task<VehicleAvailabilityDto> GetAvailabilityAsync(
        Guid vehicleId,
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle == null)
        {
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        var bookings = await _context.Bookings
            .Where(b => b.VehicleId == vehicleId &&
                       b.Status != "Cancelled" &&
                       b.PickupDate < endDate &&
                       b.ReturnDate > startDate)
            .ToListAsync(cancellationToken);

        var bookedDates = bookings
            .Select(b => new DateRange(b.PickupDate ?? DateTime.MinValue, b.ReturnDate ?? DateTime.MinValue))
            .ToList();

        return new VehicleAvailabilityDto(
            vehicleId,
            bookedDates,
            new List<DateRange>()
        );
    }

    public async Task<VehiclePricingDto> CalculatePricingAsync(
        Guid vehicleId,
        PricingRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.PickupDate >= request.ReturnDate)
        {
            throw new ValidationException("DateRange", "Return date must be after pickup date");
        }

        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle == null)
        {
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        var totalDays = (request.ReturnDate - request.PickupDate).Days;
        var basePrice = (vehicle.PricePerDay ?? 0) * totalDays;

        decimal insuranceCost = 0;
        if (!string.IsNullOrWhiteSpace(request.InsuranceOptions))
        {
            insuranceCost = CalculateInsuranceCost(request.InsuranceOptions, totalDays);
        }

        decimal additionalServicesCost = 0;
        if (!string.IsNullOrWhiteSpace(request.AdditionalServices))
        {
            additionalServicesCost = CalculateAdditionalServicesCost(request.AdditionalServices, totalDays);
        }

        var totalPrice = basePrice + insuranceCost + additionalServicesCost;

        return new VehiclePricingDto(
            basePrice,
            insuranceCost,
            additionalServicesCost,
            totalPrice,
            request.Currency ?? "USD",
            totalDays
        );
    }

    public async Task<IEnumerable<VehicleImageDto>> GetImagesAsync(
        Guid vehicleId,
        string? size = null,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle == null)
        {
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        var images = await _vehicleRepository.GetVehicleImagesAsync(vehicleId, cancellationToken);

        return images.Select(img => new VehicleImageDto(
            img.Id,
            GetImageUrlBySize(img, size),
            size ?? "medium",
            img.IsPrimary
        ));
    }

    private async Task<double> GetAverageRatingAsync(Guid vehicleId, CancellationToken cancellationToken)
    {
        var reviews = await _context.Reviews
            .Where(r => r.VehicleId == vehicleId && r.Rating.HasValue)
            .ToListAsync(cancellationToken);

        if (!reviews.Any())
        {
            return 0;
        }

        return reviews.Average(r => r.Rating ?? 0);
    }

    private async Task<int> GetReviewCountAsync(Guid vehicleId, CancellationToken cancellationToken)
    {
        return await _context.Reviews
            .CountAsync(r => r.VehicleId == vehicleId, cancellationToken);
    }

    private List<VehicleListDto> ApplySorting(List<VehicleListDto> vehicles, string sortBy)
    {
        return sortBy.ToLower() switch
        {
            "price" => vehicles.OrderBy(v => v.DailyRate).ToList(),
            "distance" => vehicles.OrderBy(v => v.Distance ?? double.MaxValue).ToList(),
            "rating" => vehicles.OrderByDescending(v => v.Rating).ToList(),
            _ => vehicles
        };
    }

    private decimal CalculateInsuranceCost(string insuranceOptions, int days)
    {
        return insuranceOptions.ToLower() switch
        {
            "basic" => 10 * days,
            "standard" => 20 * days,
            "premium" => 35 * days,
            _ => 0
        };
    }

    private decimal CalculateAdditionalServicesCost(string additionalServices, int days)
    {
        var services = additionalServices.Split(',', StringSplitOptions.RemoveEmptyEntries);
        decimal totalCost = 0;

        foreach (var service in services)
        {
            totalCost += service.Trim().ToLower() switch
            {
                "gps" => 5 * days,
                "childseat" => 8 * days,
                "additionaldriver" => 15 * days,
                _ => 0
            };
        }

        return totalCost;
    }

    private string GetImageUrlBySize(Domain.Entities.VehicleImage image, string? size)
    {
        return size?.ToLower() switch
        {
            "thumbnail" => image.ThumbnailUrl,
            "large" => image.ImageUrl,
            _ => image.ImageUrl
        };
    }

    public async Task<PagedResult<DTOs.Review.ReviewDto>> GetVehicleReviewsAsync(
        Guid vehicleId,
        int page,
        int pageSize,
        string sortBy,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle == null)
        {
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        var reviews = await _reviewRepository.GetVehicleReviewsAsync(
            vehicleId,
            page,
            pageSize,
            sortBy,
            cancellationToken);

        var totalCount = await _context.Reviews
            .CountAsync(r => r.VehicleId == vehicleId, cancellationToken);

        var reviewDtos = reviews.Select(r => new DTOs.Review.ReviewDto(
            r.Id,
            r.VehicleId,
            r.UserId,
            $"{r.User?.FirstName} {r.User?.LastName}".Trim(),
            r.Rating ?? 0,
            r.Comment,
            r.AdminResponse,
            r.CreatedAt
        )).ToList();

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResult<DTOs.Review.ReviewDto>(
            reviewDtos,
            page,
            pageSize,
            totalCount,
            totalPages);
    }

    public async Task<bool> AddToFavoritesAsync(
        Guid vehicleId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle == null)
        {
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        var existingFavorite = await _context.Favorites
            .FirstOrDefaultAsync(f => f.VehicleId == vehicleId && f.UserId == userId, cancellationToken);

        if (existingFavorite != null)
        {
            return true;
        }

        var favorite = new Domain.Entities.Favorite
        {
            VehicleId = vehicleId,
            UserId = userId
        };

        _context.AddFavorite(favorite);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    // Admin Vehicle Management Methods

    public async Task<PagedResult<VehicleListDto>> GetAdminVehiclesAsync(
        int page,
        int size,
        AdminVehicleFilterRequest filter,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Vehicles
            .AsNoTracking()
            .Include(v => v.Images)
            .Include(v => v.User)
            .AsQueryable();

        // Security/Isolation: Suppliers only see their own vehicles
        if (!isAdmin)
        {
            query = query.Where(v => v.UserId == currentUserId);
        }
        
        // Filter out soft-deleted vehicles
        query = query.Where(v => v.IsActive);
        // Admin Filtering: Filter by specific suppliers if provided
        else if (filter.Suppliers != null && filter.Suppliers.Any())
        {
            query = query.Where(v => filter.Suppliers.Contains(v.UserId));
        }

        // Search Keyword
        if (!string.IsNullOrWhiteSpace(filter.Keyword))
        {
            var keyword = filter.Keyword;
            query = query.Where(v => 
                (v.Make != null && v.Make.Contains(keyword)) || 
                (v.Model != null && v.Model.Contains(keyword)));
        }

        // Pagination
        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalCount / (double)size);
        var skip = (page - 1) * size;

        var vehicles = await query
            .OrderByDescending(v => v.CreatedAt) // Assuming CreatedAt exists, if not it will fail, wait. Let's just order by Id or Price
            .Skip(skip)
            .Take(size)
            .ToListAsync(cancellationToken);

        var vehicleDtos = new List<VehicleListDto>();
        foreach (var vehicle in vehicles)
        {
            var averageRating = await GetAverageRatingAsync(vehicle.Id, cancellationToken);
            var reviewCount = await GetReviewCountAsync(vehicle.Id, cancellationToken);
            var primaryImage = vehicle.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl 
                             ?? vehicle.Images.FirstOrDefault()?.ImageUrl 
                             ?? string.Empty;

            vehicleDtos.Add(new VehicleListDto(
                vehicle.Id,
                vehicle.Make ?? string.Empty,
                vehicle.Model ?? string.Empty,
                vehicle.Status ?? string.Empty,
                vehicle.PricePerDay ?? 0,
                "USD",
                primaryImage,
                averageRating,
                reviewCount,
                null,
                vehicle.AvailabilityStatus == "Available"
            ));
        }

        return new PagedResult<VehicleListDto>(
            vehicleDtos,
            page,
            size,
            totalCount,
            totalPages);
    }

    public async Task<VehicleResponse> CreateVehicleAsync(
        CreateVehicleRequest request,
        CancellationToken cancellationToken = default)
    {
        // Verify the user exists
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException($"User with ID {request.UserId} not found");
        }

        // Check if license plate already exists
        var existingVehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.LicensePlate == request.LicensePlate, cancellationToken);

        if (existingVehicle != null)
        {
            throw new ConflictException($"Vehicle with license plate {request.LicensePlate} already exists");
        }

        var vehicle = new Vehicle
        {
            UserId = request.UserId,
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
            Status = request.Status,
            AvailabilityStatus = request.AvailabilityStatus,
            IsActive = true,
            ApprovedAt = DateTime.UtcNow
        };

        var createdVehicle = await _vehicleRepository.AddAsync(vehicle, cancellationToken);
        await _vehicleRepository.SaveChangesAsync(cancellationToken);

        return new VehicleResponse(
            createdVehicle.Id,
            "Vehicle created successfully"
        );
    }

    public async Task<VehicleResponse> UpdateVehicleAsync(
        Guid vehicleId,
        UpdateVehicleRequest request,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle == null)
        {
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        // Security check: Only owner or admin can update
        if (!isAdmin && vehicle.UserId != currentUserId)
        {
            throw new ForbiddenException("You do not have permission to update this vehicle");
        }

        // Check if license plate already exists for another vehicle
        if (!string.IsNullOrWhiteSpace(request.LicensePlate) && 
            request.LicensePlate != vehicle.LicensePlate)
        {
            var existingVehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.LicensePlate == request.LicensePlate && v.Id != vehicleId, 
                    cancellationToken);

            if (existingVehicle != null)
            {
                throw new ConflictException($"Vehicle with license plate {request.LicensePlate} already exists");
            }
        }

        // Update only provided fields
        if (!string.IsNullOrWhiteSpace(request.Make))
            vehicle.Make = request.Make;
        
        if (!string.IsNullOrWhiteSpace(request.Model))
            vehicle.Model = request.Model;
        
        if (request.Year.HasValue)
            vehicle.Year = request.Year.Value;
        
        if (!string.IsNullOrWhiteSpace(request.Color))
            vehicle.Color = request.Color;
        
        if (!string.IsNullOrWhiteSpace(request.LicensePlate))
            vehicle.LicensePlate = request.LicensePlate;
        
        if (!string.IsNullOrWhiteSpace(request.Transmission))
            vehicle.Transmission = request.Transmission;
        
        if (!string.IsNullOrWhiteSpace(request.FuelType))
            vehicle.FuelType = request.FuelType;
        
        if (request.Seats.HasValue)
            vehicle.Seats = request.Seats.Value;
        
        if (request.PricePerDay.HasValue)
            vehicle.PricePerDay = request.PricePerDay.Value;
        
        if (!string.IsNullOrWhiteSpace(request.LocationCity))
            vehicle.LocationCity = request.LocationCity;
        
        if (request.Description != null)
            vehicle.Description = request.Description;
        
        if (!string.IsNullOrWhiteSpace(request.Status))
            vehicle.Status = request.Status;
        
        if (!string.IsNullOrWhiteSpace(request.AvailabilityStatus))
            vehicle.AvailabilityStatus = request.AvailabilityStatus;

        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
        await _vehicleRepository.SaveChangesAsync(cancellationToken);

        return new VehicleResponse(
            vehicleId,
            "Vehicle updated successfully"
        );
    }

    public async Task<VehicleResponse> DeleteVehicleAsync(
        Guid vehicleId,
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle == null)
        {
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        // Security check: Only owner or admin can delete
        if (!isAdmin && vehicle.UserId != currentUserId)
        {
            throw new ForbiddenException("You do not have permission to delete this vehicle");
        }

        // Check if vehicle has active bookings
        var hasActiveBookings = await CheckActiveBookingsAsync(vehicleId, cancellationToken);
        if (hasActiveBookings)
        {
            throw new ConflictException("Cannot delete vehicle with active bookings");
        }

        // Soft delete by setting IsActive to false
        vehicle.IsActive = false;
        vehicle.Status = "Deleted";
        vehicle.AvailabilityStatus = "Unavailable";

        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);
        await _vehicleRepository.SaveChangesAsync(cancellationToken);

        return new VehicleResponse(
            vehicleId,
            "Vehicle deleted successfully"
        );
    }

    public async Task<bool> CheckActiveBookingsAsync(
        Guid vehicleId,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId, cancellationToken);
        if (vehicle == null)
        {
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        return await _bookingRepository.HasActiveBookingsAsync(vehicleId, cancellationToken);
    }
}
