using Backend.Application.DTOs.Vehicle;
using FluentValidation;

namespace Backend.Application.Validators;

/// <summary>
/// Validator for <see cref="CreateSupplierVehicleRequest"/>.
///
/// Rules mirror <see cref="CreateVehicleRequestValidator"/> closely but
/// drop the <c>UserId</c> rule (owner is set server-side) and the
/// <c>Status</c> / <c>AvailabilityStatus</c> rules (those fields are
/// hard-coded by the service on creation).
/// </summary>
public class CreateSupplierVehicleRequestValidator : AbstractValidator<CreateSupplierVehicleRequest>
{
    public CreateSupplierVehicleRequestValidator()
    {
        RuleFor(x => x.Make)
            .NotEmpty().WithMessage("Make is required")
            .MaximumLength(100).WithMessage("Make must not exceed 100 characters");

        RuleFor(x => x.Model)
            .NotEmpty().WithMessage("Model is required")
            .MaximumLength(100).WithMessage("Model must not exceed 100 characters");

        RuleFor(x => x.Year)
            .GreaterThan(1900).WithMessage("Year must be greater than 1900")
            .LessThanOrEqualTo(DateTime.Now.Year + 1).WithMessage("Year cannot be in the future");

        RuleFor(x => x.Color)
            .NotEmpty().WithMessage("Color is required")
            .MaximumLength(50).WithMessage("Color must not exceed 50 characters");

        RuleFor(x => x.LicensePlate)
            .NotEmpty().WithMessage("License plate is required")
            .MaximumLength(50).WithMessage("License plate must not exceed 50 characters");

        RuleFor(x => x.Transmission)
            .NotEmpty().WithMessage("Transmission is required")
            .Must(x => x == "Manual" || x == "Automatic")
            .WithMessage("Transmission must be either 'Manual' or 'Automatic'");

        RuleFor(x => x.FuelType)
            .NotEmpty().WithMessage("Fuel type is required")
            .MaximumLength(50).WithMessage("Fuel type must not exceed 50 characters");

        RuleFor(x => x.Seats)
            .GreaterThan(0).WithMessage("Seats must be greater than 0")
            .LessThanOrEqualTo(50).WithMessage("Seats must not exceed 50");

        RuleFor(x => x.PricePerDay)
            .GreaterThan(0).WithMessage("Price per day must be greater than 0");

        RuleFor(x => x.LocationCity)
            .NotEmpty().WithMessage("Location city is required")
            .MaximumLength(100).WithMessage("Location city must not exceed 100 characters");
    }
}
