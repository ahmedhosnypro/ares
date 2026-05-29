using Backend.Application.DTOs.Booking;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using FluentValidation;
using Microsoft.AspNetCore.Identity;

namespace Backend.Application.Validators;

/// <summary>
/// Validator for booking creation requests
/// Validates: Requirements 4.4, 14.1
/// </summary>
public class CreateBookingRequestValidator : AbstractValidator<CreateBookingRequest>
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly UserManager<ApplicationUser>? _userManager;
    private readonly Guid _userId;

    public CreateBookingRequestValidator(
        IVehicleRepository vehicleRepository,
        UserManager<ApplicationUser>? userManager = null,
        Guid userId = default)
    {
        _vehicleRepository = vehicleRepository;
        _userManager = userManager;
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
            .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Pickup date must be today or in the future");

        RuleFor(x => x.ReturnDate)
            .NotEmpty().WithMessage("Return date is required")
            .GreaterThan(x => x.PickupDate).WithMessage("Return date must be after pickup date");

        RuleFor(x => x)
            .MustAsync(VehicleIsAvailableAsync)
            .WithMessage("Vehicle is not available for the selected dates")
            .When(x => x.VehicleId != Guid.Empty && x.PickupDate < x.ReturnDate);
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

    private async Task<bool> VehicleIsAvailableAsync(CreateBookingRequest request, CancellationToken cancellationToken)
        => await _vehicleRepository.IsAvailableAsync(
            request.VehicleId,
            request.PickupDate,
            request.ReturnDate,
            cancellationToken);
}
