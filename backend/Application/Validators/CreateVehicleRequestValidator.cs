using Backend.Application.DTOs.Vehicle;
using FluentValidation;

namespace Backend.Application.Validators;

/// <summary>
/// Validator for create vehicle requests
/// </summary>
public class CreateVehicleRequestValidator : AbstractValidator<CreateVehicleRequest>
{
    public CreateVehicleRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("User ID is required");

        RuleFor(x => x.Make)
            .NotEmpty()
            .WithMessage("Make is required")
            .MaximumLength(100)
            .WithMessage("Make must not exceed 100 characters");

        RuleFor(x => x.Model)
            .NotEmpty()
            .WithMessage("Model is required")
            .MaximumLength(100)
            .WithMessage("Model must not exceed 100 characters");

        RuleFor(x => x.Year)
            .GreaterThan(1900)
            .WithMessage("Year must be greater than 1900")
            .LessThanOrEqualTo(DateTime.UtcNow.Year + 1)
            .WithMessage("Year cannot be in the future");

        RuleFor(x => x.Color)
            .NotEmpty()
            .WithMessage("Color is required")
            .MaximumLength(50)
            .WithMessage("Color must not exceed 50 characters");

        RuleFor(x => x.LicensePlate)
            .NotEmpty()
            .WithMessage("License plate is required")
            .MaximumLength(50)
            .WithMessage("License plate must not exceed 50 characters");

        RuleFor(x => x.Transmission)
            .NotEmpty()
            .WithMessage("Transmission is required")
            .Must(x => x == "Manual" || x == "Automatic")
            .WithMessage("Transmission must be either 'Manual' or 'Automatic'");

        RuleFor(x => x.FuelType)
            .NotEmpty()
            .WithMessage("Fuel type is required")
            .MaximumLength(50)
            .WithMessage("Fuel type must not exceed 50 characters");

        RuleFor(x => x.Seats)
            .GreaterThan(0)
            .WithMessage("Seats must be greater than 0")
            .LessThanOrEqualTo(50)
            .WithMessage("Seats must not exceed 50");

        RuleFor(x => x.PricePerDay)
            .GreaterThan(0)
            .WithMessage("Price per day must be greater than 0");

        RuleFor(x => x.LocationCity)
            .NotEmpty()
            .WithMessage("Location city is required")
            .MaximumLength(100)
            .WithMessage("Location city must not exceed 100 characters");

        RuleFor(x => x.Status)
            .MaximumLength(50)
            .WithMessage("Status must not exceed 50 characters");

        RuleFor(x => x.AvailabilityStatus)
            .MaximumLength(50)
            .WithMessage("Availability status must not exceed 50 characters");
    }
}