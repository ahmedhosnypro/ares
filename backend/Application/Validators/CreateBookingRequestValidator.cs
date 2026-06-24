using Backend.Application.DTOs.Booking;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Application.Validators;

/// <summary>
/// Validator for booking creation requests
/// Validates: Requirements 4.4, 14.1
/// </summary>
public class CreateBookingRequestValidator : AbstractValidator<CreateBookingRequest>
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly UserManager<ApplicationUser>? _userManager;
    private readonly ILocationRepository? _locationRepository;
    private readonly Guid _userId;

    public CreateBookingRequestValidator(
        IVehicleRepository vehicleRepository,
        UserManager<ApplicationUser>? userManager,
        Guid userId)
        : this(vehicleRepository, userManager, userId, null)
    {
    }

    public CreateBookingRequestValidator(
        IVehicleRepository vehicleRepository,
        UserManager<ApplicationUser>? userManager,
        IHttpContextAccessor httpContextAccessor,
        ILocationRepository? locationRepository = null)
        : this(vehicleRepository, userManager, GetUserIdFromHttpContext(httpContextAccessor), locationRepository)
    {
    }

    private static Guid GetUserIdFromHttpContext(IHttpContextAccessor httpContextAccessor)
    {
        var userIdClaim = httpContextAccessor?.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var parsedId))
        {
            return parsedId;
        }
        return Guid.Empty;
    }

    public CreateBookingRequestValidator(
        IVehicleRepository vehicleRepository,
        UserManager<ApplicationUser>? userManager,
        Guid userId,
        ILocationRepository? locationRepository)
    {
        _vehicleRepository = vehicleRepository;
        _userManager = userManager;
        _locationRepository = locationRepository;
        _userId = userId;

        if (_userManager != null && _userId != Guid.Empty)
        {
            RuleFor(x => x)
                .MustAsync(EffectiveCustomerIsNotAdminAsync)
                .WithMessage("Administrators are not allowed to have bookings.")
                .WithName("CustomerUserId");
        }

        RuleFor(x => x.VehicleId)
            .NotEmpty().WithMessage("Vehicle ID is required")
            .MustAsync(VehicleExistsAsync).WithMessage("Vehicle does not exist");

        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.PickupLocation) || x.PickupLocationId != Guid.Empty)
            .WithMessage("Pickup location is required")
            .WithName("PickupLocation");

        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.DropOffLocation) || x.DropOffLocationId != Guid.Empty)
            .WithMessage("Drop-off location is required")
            .WithName("DropOffLocation");

        RuleFor(x => x.PickupDate)
            .NotEmpty().WithMessage("Pickup date is required")
            .Must(d => d.Date >= DateTime.UtcNow.Date.AddDays(-1))
            .WithMessage("Pickup date must be today or in the future");

        RuleFor(x => x.ReturnDate)
            .NotEmpty().WithMessage("Return date is required")
            .GreaterThan(x => x.PickupDate).WithMessage("Return date must be after pickup date");

        RuleFor(x => x)
            .MustAsync(VehicleMatchesPickupLocationAsync)
            .WithMessage("Selected vehicle is not available in the chosen location.")
            .WithName("VehicleId")
            .When(x => x.VehicleId != Guid.Empty);

        RuleFor(x => x)
            .MustAsync(VehicleIsStillAvailableAsync)
            .WithMessage("Selected vehicle is not available.")
            .WithName("VehicleId")
            .When(x => x.VehicleId != Guid.Empty);

        RuleFor(x => x)
            .MustAsync(VehicleIsAvailableAsync)
            .WithMessage("Vehicle is not available for the selected dates")
            .WithName("VehicleId")
            .When(x => x.VehicleId != Guid.Empty && x.PickupDate < x.ReturnDate);

        RuleFor(x => x)
            .Must(x => !(x.NeedDriver == true && x.DriverId != null))
            .WithMessage("Cannot specify both a specific DriverId and NeedDriver=true")
            .WithName("NeedDriver");
    }

    private async Task<bool> EffectiveCustomerIsNotAdminAsync(CreateBookingRequest request, CancellationToken cancellationToken)
    {
        var targetId = request.CustomerUserId ?? _userId;
        var user = await _userManager!.FindByIdAsync(targetId.ToString());
        if (user == null) return true;
        return !await _userManager.IsInRoleAsync(user, "Admin");
    }

    private async Task<bool> VehicleExistsAsync(Guid vehicleId, CancellationToken cancellationToken)
        => await _vehicleRepository.ExistsAsync(vehicleId, cancellationToken);

    private async Task<bool> VehicleMatchesPickupLocationAsync(CreateBookingRequest request, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);
        if (vehicle == null) return false;

        if (request.PickupLocationId != Guid.Empty && _locationRepository != null)
        {
            var address = await _locationRepository.GetByIdAsync(request.PickupLocationId, cancellationToken);
            if (address == null) return false;

            var locationTerms = new[] { address.City, address.Governorate, address.Country }
                .Where(term => !string.IsNullOrWhiteSpace(term))
                .Select(term => term!.Trim().ToLowerInvariant())
                .Distinct()
                .ToList();

            if (locationTerms.Count == 0) return false;

            return vehicle.LocationCity != null && 
                   locationTerms.Contains(vehicle.LocationCity.Trim().ToLowerInvariant());
        }

        if (!string.IsNullOrWhiteSpace(request.PickupLocation))
        {
            var term = request.PickupLocation.Trim().ToLowerInvariant();
            return vehicle.LocationCity != null && term.Contains(vehicle.LocationCity.Trim().ToLowerInvariant());
        }

        return true;
    }

    private async Task<bool> VehicleIsStillAvailableAsync(CreateBookingRequest request, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);
        if (vehicle == null) return false;

        if (!vehicle.IsActive) return false;
        if (vehicle.AvailabilityStatus != "Available") return false;

        if (string.Equals(vehicle.Status, "Retired", StringComparison.OrdinalIgnoreCase)) return false;
        if (string.Equals(vehicle.Status, "Maintenance", StringComparison.OrdinalIgnoreCase)) return false;
        if (string.Equals(vehicle.Status, "Blocked", StringComparison.OrdinalIgnoreCase)) return false;
        if (string.Equals(vehicle.Status, "Unavailable", StringComparison.OrdinalIgnoreCase)) return false;

        return true;
    }

    private async Task<bool> VehicleIsAvailableAsync(CreateBookingRequest request, CancellationToken cancellationToken)
    {
        var ownerUserId = request.CustomerUserId ?? _userId;
        return await _vehicleRepository.IsAvailableAsync(
            request.VehicleId,
            request.PickupDate,
            request.ReturnDate,
            excludeUserId: ownerUserId,
            excludeBookingId: null,
            cancellationToken: cancellationToken);
    }
}
