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
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };

    private readonly IVehicleRepository _vehicleRepository;
    // ... rest of fields

    private readonly IReviewRepository _reviewRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IApplicationDbContext _context;
    private readonly IPricingService _pricingService;
    // Nullable + optional so existing unit-test wiring that doesn't pass a
    // notification service keeps compiling; supplier-notification firing is
    // therefore best-effort, not required.
    private readonly INotificationService? _notificationService;

    public VehicleService(
        IVehicleRepository vehicleRepository,
        IReviewRepository reviewRepository,
        IBookingRepository bookingRepository,
        IApplicationDbContext context,
        IPricingService pricingService,
        INotificationService? notificationService = null)
    {
        _vehicleRepository = vehicleRepository;
        _reviewRepository = reviewRepository;
        _bookingRepository = bookingRepository;
        _context = context;
        _pricingService = pricingService;
        _notificationService = notificationService;
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
        if (request.ExcludeUserId.HasValue)
        {
            vehicleList = vehicleList
                .Where(vehicle => vehicle.UserId != request.ExcludeUserId.Value)
                .ToList();
        }

        var activeOffers = await _context.CategoryOffers
            .Where(o => o.IsActive && o.StartDate <= DateTime.UtcNow && o.EndDate >= DateTime.UtcNow)
            .ToDictionaryAsync(o => o.CategoryId, o => o.DiscountPercentage, cancellationToken);

        var vehicleDtos = new List<VehicleListDto>();
        foreach (var vehicle in vehicleList)
        {
            var averageRating = await GetAverageRatingAsync(vehicle.Id, cancellationToken);
            var reviewCount = await GetReviewCountAsync(vehicle.Id, cancellationToken);
            var primaryImage = vehicle.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                             ?? vehicle.Images.FirstOrDefault()?.ImageUrl
                             ?? string.Empty;

            var baseRate = vehicle.PricePerDay ?? 0;
            var dailyRate = baseRate;
            decimal? originalDailyRate = null;
            decimal? discountPercentage = null;

            if (vehicle.CategoryId.HasValue && activeOffers.TryGetValue(vehicle.CategoryId.Value, out var discount))
            {
                originalDailyRate = baseRate;
                discountPercentage = discount;
                dailyRate = baseRate * (1 - (discount / 100m));
            }

            vehicleDtos.Add(new VehicleListDto(
                VehicleId: vehicle.Id,
                Make: vehicle.Make ?? string.Empty,
                Model: vehicle.Model ?? string.Empty,
                Category: vehicle.Category?.Name ?? vehicle.Status ?? "General",
                DailyRate: dailyRate,
                OriginalDailyRate: originalDailyRate,
                DiscountPercentage: discountPercentage,
                Currency: "USD",
                ImageUrl: primaryImage,
                Rating: averageRating,
                ReviewCount: reviewCount,
                Distance: null,
                Available: vehicle.AvailabilityStatus == "Available",
                LocationCity: vehicle.LocationCity,
                CreatedAt: vehicle.CreatedAt,
                Year: vehicle.Year,
                Transmission: vehicle.Transmission,
                SupplierName: null,
                IsOnRental: false,
                AvailabilityStatus: vehicle.AvailabilityStatus,
                LicensePlate: vehicle.LicensePlate,
                CategoryId: vehicle.CategoryId,
                CategoryName: vehicle.Category?.Name
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
            .Include(v => v.Category)
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
            $"{vehicle.User?.FirstName} {vehicle.User?.LastName}".Trim(),
            $"{vehicle.User?.FirstName} {vehicle.User?.LastName}".Trim(),
            vehicle.User?.Email
        );

        decimal baseRate = vehicle.PricePerDay ?? 0;
        decimal dailyRate = baseRate;
        decimal? originalPricePerDay = null;
        decimal? discountPercentage = null;

        if (vehicle.CategoryId.HasValue)
        {
            var activeOffer = await _context.CategoryOffers
                .Where(o => o.CategoryId == vehicle.CategoryId.Value && o.IsActive && o.StartDate <= DateTime.UtcNow && o.EndDate >= DateTime.UtcNow)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (activeOffer != null)
            {
                originalPricePerDay = baseRate;
                discountPercentage = activeOffer.DiscountPercentage;
                dailyRate = baseRate * (1 - (activeOffer.DiscountPercentage / 100m));
            }
        }

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
            dailyRate,
            originalPricePerDay,
            discountPercentage,
            vehicle.LocationCity ?? string.Empty,
            vehicle.Description ?? string.Empty,
            vehicle.Status ?? string.Empty,
            vehicle.AvailabilityStatus ?? string.Empty,
            imageDtos,
            featureDtos,
            supplierDto,
            averageRating,
            reviewCount,
            vehicle.CategoryId,
            vehicle.Category?.Name
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
                       b.Status != Backend.Domain.Entities.Enums.BookingStatus.Cancelled &&
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

        var pricingResult = await _pricingService.CalculateBookingPricingAsync(vehicleId, request.PickupDate, request.ReturnDate, cancellationToken);

        var totalDays = (request.ReturnDate - request.PickupDate).Days;
        if (totalDays == 0) totalDays = 1; // Minimum 1 day

        var basePrice = pricingResult.OriginalPrice;

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

        var totalPrice = pricingResult.FinalPrice + insuranceCost + additionalServicesCost;

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
            "newest" or "date" => vehicles.OrderByDescending(v => v.CreatedAt).ToList(),
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
            r.SupplierReply,
            r.RepliedAt,
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
            .Include(v => v.Category)
            .AsQueryable();

        // Security/Isolation: Suppliers only see their own vehicles
        if (!isAdmin)
        {
            query = query.Where(v => v.UserId == currentUserId);
        }

        // Admin Filtering: Filter by specific suppliers if provided
        if (filter.Suppliers != null && filter.Suppliers.Any())
        {
            query = query.Where(v => filter.Suppliers.Contains(v.UserId));
        }

        // Filter out soft-deleted vehicles
        query = query.Where(v => v.IsActive);

        // Search Keyword - matches Make, Model, LicensePlate, or supplier name
        // (case-insensitive). Translates to a single SQL WHERE with OR'd LIKEs.
        if (!string.IsNullOrWhiteSpace(filter.Keyword))
        {
            var keyword = filter.Keyword.Trim();
            query = query.Where(v =>
                (v.Make != null && EF.Functions.Like(v.Make, $"%{keyword}%")) ||
                (v.Model != null && EF.Functions.Like(v.Model, $"%{keyword}%")) ||
                (v.LicensePlate != null && EF.Functions.Like(v.LicensePlate, $"%{keyword}%")) ||
                (v.User != null && v.User.FirstName != null && EF.Functions.Like(v.User.FirstName, $"%{keyword}%")) ||
                (v.User != null && v.User.LastName != null && EF.Functions.Like(v.User.LastName, $"%{keyword}%")));
        }

        // Transmission filter - case-insensitive equality.
        if (!string.IsNullOrWhiteSpace(filter.Transmission))
        {
            var transmission = filter.Transmission.Trim();
            query = query.Where(v => v.Transmission != null && v.Transmission.ToLower() == transmission.ToLower());
        }

        // Status filter - "Available" / "OnRental" / "Inactive". The on-rental
        // and available buckets are made mutually exclusive via a sub-query
        // against the Bookings table so the same vehicle never appears in two
        // buckets, even if the Vehicle row's AvailabilityStatus column wasn't
        // flipped when its booking became Active.
        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            var status = filter.Status.Trim();
            var activeBookedVehicleIds = _context.Bookings
                .AsNoTracking()
                .Where(b => b.Status == Backend.Domain.Entities.Enums.BookingStatus.Active)
                .Select(b => b.VehicleId)
                .Distinct();

            if (status.Equals("OnRental", StringComparison.OrdinalIgnoreCase) ||
                status.Equals("On Rental", StringComparison.OrdinalIgnoreCase) ||
                status.Equals("Rented", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(v => activeBookedVehicleIds.Contains(v.Id));
            }
            else if (status.Equals("Available", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(v => v.AvailabilityStatus == "Available" && !activeBookedVehicleIds.Contains(v.Id));
            }
            else if (status.Equals("Inactive", StringComparison.OrdinalIgnoreCase) ||
                     status.Equals("Unavailable", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(v => v.AvailabilityStatus != "Available" && !activeBookedVehicleIds.Contains(v.Id));
            }
            // Any other value is silently ignored (no filter applied).
        }

        // Sorting - safe whitelist; unknown / null falls back to "newest".
        var sortKey = (filter.SortBy ?? "newest").Trim().ToLowerInvariant();
        IOrderedQueryable<Vehicle> ordered;
        if (sortKey == "oldest")
        {
            ordered = query.OrderBy(v => v.CreatedAt);
        }
        else if (sortKey == "pricehigh")
        {
            ordered = query.OrderByDescending(v => v.PricePerDay).ThenByDescending(v => v.CreatedAt);
        }
        else if (sortKey == "pricelow")
        {
            ordered = query.OrderBy(v => v.PricePerDay).ThenByDescending(v => v.CreatedAt);
        }
        else
        {
            ordered = query.OrderByDescending(v => v.CreatedAt);
        }

        // Pagination
        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling(totalCount / (double)size);
        var skip = (page - 1) * size;

        var vehicles = await ordered
            .Skip(skip)
            .Take(size)
            .ToListAsync(cancellationToken);

        // Pre-compute the set of currently-on-rental vehicle ids for the page so
        // we can mark each DTO without an N+1 round-trip per row. Scoped to the
        // ids on this page only.
        var pageIds = vehicles.Select(v => v.Id).ToList();
        var onRentalIdSet = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.Status == Backend.Domain.Entities.Enums.BookingStatus.Active)
            .Where(b => pageIds.Contains(b.VehicleId))
            .Select(b => b.VehicleId)
            .Distinct()
            .ToListAsync(cancellationToken);
        var onRentalIds = new HashSet<Guid>(onRentalIdSet);

        var activeOffers = await _context.CategoryOffers
            .Where(o => o.IsActive && o.StartDate <= DateTime.UtcNow && o.EndDate >= DateTime.UtcNow)
            .ToDictionaryAsync(o => o.CategoryId, o => o.DiscountPercentage, cancellationToken);

        var vehicleDtos = new List<VehicleListDto>();
        foreach (var vehicle in vehicles)
        {
            var averageRating = await GetAverageRatingAsync(vehicle.Id, cancellationToken);
            var reviewCount = await GetReviewCountAsync(vehicle.Id, cancellationToken);
            var primaryImage = vehicle.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                             ?? vehicle.Images.FirstOrDefault()?.ImageUrl
                             ?? string.Empty;

            var supplierName = vehicle.User == null
                ? null
                : $"{vehicle.User.FirstName} {vehicle.User.LastName}".Trim();

            var baseRate = vehicle.PricePerDay ?? 0;
            var dailyRate = baseRate;
            decimal? originalDailyRate = null;
            decimal? discountPercentage = null;

            if (vehicle.CategoryId.HasValue && activeOffers.TryGetValue(vehicle.CategoryId.Value, out var discount))
            {
                originalDailyRate = baseRate;
                discountPercentage = discount;
                dailyRate = baseRate * (1 - (discount / 100m));
            }

            vehicleDtos.Add(new VehicleListDto(
                VehicleId: vehicle.Id,
                Make: vehicle.Make ?? string.Empty,
                Model: vehicle.Model ?? string.Empty,
                Category: vehicle.Category?.Name ?? "General",
                DailyRate: dailyRate,
                OriginalDailyRate: originalDailyRate,
                DiscountPercentage: discountPercentage,
                Currency: "USD",
                ImageUrl: primaryImage,
                Rating: averageRating,
                ReviewCount: reviewCount,
                Distance: null,
                Available: vehicle.AvailabilityStatus == "Available",
                LocationCity: vehicle.LocationCity,
                CreatedAt: vehicle.CreatedAt,
                Year: vehicle.Year,
                Transmission: vehicle.Transmission,
                SupplierName: string.IsNullOrWhiteSpace(supplierName) ? null : supplierName,
                IsOnRental: onRentalIds.Contains(vehicle.Id),
                AvailabilityStatus: vehicle.AvailabilityStatus,
                LicensePlate: vehicle.LicensePlate,
                CategoryId: vehicle.CategoryId,
                CategoryName: vehicle.Category?.Name
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
            CategoryId = request.CategoryId,
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
        var vehicle = await _context.Vehicles
            .Include(v => v.Images)
            .FirstOrDefaultAsync(v => v.Id == vehicleId, cancellationToken);

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

        if (request.CategoryId.HasValue)
            vehicle.CategoryId = request.CategoryId.Value;

        if (request.Description != null)
            vehicle.Description = request.Description;

        // Update images if provided
        if (request.Images != null)
        {
            // Instead of wholesale RemoveRange + Add (which breaks EF tracking and causes Concurrency Exceptions),
            // we synchronize the list based on the URL (which is our unique identifier here).
            var incomingUrls = request.Images.Select(i => i.Url).ToHashSet();

            // 1. Remove images not in the new list
            var imagesToRemove = vehicle.Images.Where(i => !incomingUrls.Contains(i.ImageUrl)).ToList();
            foreach (var img in imagesToRemove)
            {
                vehicle.Images.Remove(img);
            }

            // 2. Update existing and Add new
            foreach (var incomingImg in request.Images)
            {
                var existingImg = vehicle.Images.FirstOrDefault(i => i.ImageUrl == incomingImg.Url);
                if (existingImg != null)
                {
                    existingImg.IsPrimary = incomingImg.IsPrimary;
                    existingImg.DisplayOrder = 0; // Or whatever logic you use
                }
                else
                {
                    var newImg = new Domain.Entities.VehicleImage
                    {
                        VehicleId = vehicleId,
                        ImageUrl = incomingImg.Url,
                        IsPrimary = incomingImg.IsPrimary,
                        DisplayOrder = 0
                    };
                    _context.AddVehicleImage(newImg);
                }
            }
        }

        // Update features if provided
        if (request.Features != null)
        {
            var existingFeatures = await _context.VehicleFeatures
                .Where(vf => vf.VehicleId == vehicleId)
                .ToListAsync(cancellationToken);

            var incomingFeatureNames = request.Features.Select(f => f.FeatureName).ToHashSet();

            // 1. Remove features not in the new list
            var featuresToRemove = existingFeatures.Where(f => !incomingFeatureNames.Contains(f.FeatureName)).ToList();
            _context.RemoveVehicleFeatures(featuresToRemove);

            // 2. Update existing and Add new
            foreach (var incomingFeature in request.Features)
            {
                var existingFeature = existingFeatures.FirstOrDefault(f => f.FeatureName == incomingFeature.FeatureName);
                if (existingFeature != null)
                {
                    existingFeature.FeatureDescription = incomingFeature.FeatureDescription;
                    existingFeature.FeatureCategory = incomingFeature.FeatureCategory ?? "General";
                }
                else
                {
                    _context.AddVehicleFeatures(new List<Domain.Entities.VehicleFeature>
                    {
                        new Domain.Entities.VehicleFeature
                        {
                            VehicleId = vehicleId,
                            FeatureName = incomingFeature.FeatureName,
                            FeatureDescription = incomingFeature.FeatureDescription,
                            FeatureCategory = incomingFeature.FeatureCategory ?? "General"
                        }
                    });
                }
            }
        }

        // Capture the previous status BEFORE we mutate `vehicle.Status` so we
        // can detect a Pending → Approved / Rejected transition and fire the
        // matching supplier notification once the save succeeds.
        var previousStatus = vehicle.Status;
        if (!string.IsNullOrWhiteSpace(request.Status))
            vehicle.Status = request.Status;

        if (!string.IsNullOrWhiteSpace(request.AvailabilityStatus))
            vehicle.AvailabilityStatus = request.AvailabilityStatus;

        await _vehicleRepository.SaveChangesAsync(cancellationToken);

        // Best-effort supplier notification — never block the update path.
        await NotifyVehicleStatusTransitionAsync(vehicle, previousStatus, cancellationToken);

        return new VehicleResponse(
            vehicleId,
            "Vehicle updated successfully"
        );
    }

    /// <summary>
    /// Fires the supplier-facing notification when a vehicle's admin status
    /// transitions to Approved or Rejected. Best-effort — wrapped in try/catch
    /// so notification-service failures never break the underlying vehicle
    /// update. Compares case-insensitively because Vehicle.Status is a
    /// free-form string in the schema ("Approved" / "approved" / "Active"
    /// all coexist in legacy data).
    /// </summary>
    private async Task NotifyVehicleStatusTransitionAsync(
        Vehicle vehicle,
        string? previousStatus,
        CancellationToken cancellationToken)
    {
        if (_notificationService is null) return;

        var newStatus = vehicle.Status;
        if (string.IsNullOrWhiteSpace(newStatus)) return;

        // Only notify on a real transition (don't re-send if the status
        // didn't actually change — UpdateVehicleAsync is called on every
        // edit).
        var sameAsBefore = string.Equals(previousStatus, newStatus, StringComparison.OrdinalIgnoreCase);
        if (sameAsBefore) return;

        var label = string.IsNullOrWhiteSpace(vehicle.Make) && string.IsNullOrWhiteSpace(vehicle.Model)
            ? "your vehicle"
            : $"{vehicle.Make} {vehicle.Model}".Trim();

        try
        {
            if (string.Equals(newStatus, "Approved", StringComparison.OrdinalIgnoreCase))
            {
                await _notificationService.CreateNotificationAsync(
                    vehicle.UserId,
                    "Vehicle approved",
                    $"{label} has been approved and is now visible to customers.",
                    SupplierNotificationTypes.Format(SupplierNotificationTypes.VehicleApproved, vehicle.Id),
                    cancellationToken);
            }
            else if (string.Equals(newStatus, "Rejected", StringComparison.OrdinalIgnoreCase))
            {
                await _notificationService.CreateNotificationAsync(
                    vehicle.UserId,
                    "Vehicle rejected",
                    $"{label} was rejected by an admin. Open the vehicle for details.",
                    SupplierNotificationTypes.Format(SupplierNotificationTypes.VehicleRejected, vehicle.Id),
                    cancellationToken);
            }
        }
        catch
        {
            // Best-effort: never break the vehicle update because a
            // notification couldn't be saved.
        }
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

    public async Task<AdminVehicleStatsDto> GetAdminVehicleStatsAsync(
        Guid currentUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        // Base query mirrors GetAdminVehiclesAsync: only non-soft-deleted vehicles,
        // and suppliers can only see their own rows. Counts come from the DB so
        // they're independent of any pagination, search, or filter on the table.
        var vehiclesQuery = _context.Vehicles
            .AsNoTracking()
            .Where(v => v.IsActive);

        if (!isAdmin)
        {
            vehiclesQuery = vehiclesQuery.Where(v => v.UserId == currentUserId);
        }

        var totalVehicles = await vehiclesQuery.CountAsync(cancellationToken);

        // Vehicles with an in-progress booking (BookingStatus.Active).
        // Computed first because Available is defined as "in-scope AND has no
        // active booking", so the two buckets must be mutually exclusive.
        // We materialise the set of on-rental ids in-memory only via a sub-query;
        // the EF translator turns this into a single SQL statement with a
        // WHERE ... IN (SELECT ...) clause.
        var onRentalIdsQuery = _context.Bookings
            .AsNoTracking()
            .Where(b => b.Status == Backend.Domain.Entities.Enums.BookingStatus.Active)
            .Where(b => vehiclesQuery.Any(v => v.Id == b.VehicleId))
            .Select(b => b.VehicleId)
            .Distinct();

        var onRentalVehicles = await onRentalIdsQuery.CountAsync(cancellationToken);

        // "Available" = AvailabilityStatus is "Available" AND the vehicle is not
        // currently on rental. The extra `!onRentalIdsQuery.Contains(...)` guard
        // ensures the Available bucket never overlaps the On-Rental bucket even
        // if a vehicle row's `AvailabilityStatus` column wasn't flipped to
        // "Unavailable" when its booking became Active (historical data drift).
        var availableVehicles = await vehiclesQuery
            .Where(v => v.AvailabilityStatus == "Available")
            .Where(v => !onRentalIdsQuery.Contains(v.Id))
            .CountAsync(cancellationToken);

        return new AdminVehicleStatsDto(totalVehicles, availableVehicles, onRentalVehicles);
    }

    public async Task<VehicleImageDto> UploadImageAsync(
        Guid vehicleId,
        Microsoft.AspNetCore.Http.IFormFile file,
        CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == vehicleId && v.IsActive, cancellationToken);

        if (vehicle == null)
        {
            throw new NotFoundException($"Vehicle with ID {vehicleId} not found");
        }

        // 1. Validate file size
        if (file.Length > MaxFileSize)
        {
            throw new ValidationException("File", "File size exceeds the maximum limit of 10MB.");
        }

        // 2. Validate file extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            throw new ValidationException("File", $"Invalid file type. Allowed types: {string.Join(", ", AllowedExtensions)}");
        }

        // 3. Save file
        var fileName = $"{vehicleId}_{Guid.NewGuid()}{extension}";
        var uploadsFolder = Path.Combine("wwwroot", "uploads", "vehicles");
        Directory.CreateDirectory(uploadsFolder);

        var filePath = Path.Combine(uploadsFolder, fileName);
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var imageUrl = $"/uploads/vehicles/{fileName}";

        // 4. Create database record
        var isFirstImage = !await _context.VehicleImages.AnyAsync(i => i.VehicleId == vehicleId, cancellationToken);
        var vehicleImage = new VehicleImage
        {
            VehicleId = vehicleId,
            ImageUrl = imageUrl,
            IsPrimary = isFirstImage,
            DisplayOrder = 0
        };

        _context.AddVehicleImage(vehicleImage);
        await _context.SaveChangesAsync(cancellationToken);

        return new VehicleImageDto(
            vehicleImage.Id,
            vehicleImage.ImageUrl,
            "original",
            vehicleImage.IsPrimary);
    }
}
