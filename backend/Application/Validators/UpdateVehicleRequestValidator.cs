using Backend.Application.DTOs.Vehicle;
using FluentValidation;

namespace Backend.Application.Validators;

/// <summary>
/// Validator for update vehicle requests
/// </summary>
public class UpdateVehicleRequestValidator : AbstractValidator<UpdateVehicleRequest>
{
    public UpdateVehicleRequestValidator()
    {
        RuleFor(x => x.Make)
            .MaximumLength(100)
            .WithMessage("Make must not exceed 100 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Make));

        RuleFor(x => x.Model)
            .MaximumLength(100)
            .WithMessage("Model must not exceed 100 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Model));

        RuleFor(x => x.Year)
            .GreaterThan(1900)
            .WithMessage("Year must be greater than 1900")
            .LessThanOrEqualTo(DateTime.UtcNow.Year + 1)
            .WithMessage("Year cannot be in the future")
            .When(x => x.Year.HasValue);

        RuleFor(x => x.Color)
            .MaximumLength(50)
            .WithMessage("Color must not exceed 50 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Color));

        RuleFor(x => x.LicensePlate)
            .MaximumLength(50)
            .WithMessage("License plate must not exceed 50 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.LicensePlate));

        RuleFor(x => x.Transmission)
            .Must(x => x == "Manual" || x == "Automatic")
            .WithMessage("Transmission must be either 'Manual' or 'Automatic'")
            .When(x => !string.IsNullOrWhiteSpace(x.Transmission));

        RuleFor(x => x.FuelType)
            .MaximumLength(50)
            .WithMessage("Fuel type must not exceed 50 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.FuelType));

        RuleFor(x => x.Seats)
            .GreaterThan(0)
            .WithMessage("Seats must be greater than 0")
            .LessThanOrEqualTo(50)
            .WithMessage("Seats must not exceed 50")
            .When(x => x.Seats.HasValue);

        RuleFor(x => x.PricePerDay)
            .GreaterThan(0)
            .WithMessage("Price per day must be greater than 0")
            .When(x => x.PricePerDay.HasValue);

        RuleFor(x => x.LocationCity)
            .MaximumLength(100)
            .WithMessage("Location city must not exceed 100 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.LocationCity));

        RuleFor(x => x.Status)
            .MaximumLength(50)
            .WithMessage("Status must not exceed 50 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Status));

        RuleFor(x => x.AvailabilityStatus)
            .MaximumLength(50)
            .WithMessage("Availability status must not exceed 50 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.AvailabilityStatus));
    }
}