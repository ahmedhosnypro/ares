using Backend.Application.DTOs.Vehicle;
using FluentValidation;

namespace Backend.Application.Validators;

/// <summary>
/// Validator for vehicle search requests
/// </summary>
public class VehicleSearchRequestValidator : AbstractValidator<VehicleSearchRequest>
{
    public VehicleSearchRequestValidator()
    {
        RuleFor(x => x.PickupLocationId)
            .NotEmpty().WithMessage("Pickup location is required");

        RuleFor(x => x.PickupDate)
            .NotEmpty().WithMessage("Pickup date is required")
            .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Pickup date must be today or in the future");

        RuleFor(x => x.ReturnDate)
            .NotEmpty().WithMessage("Return date is required")
            .GreaterThan(x => x.PickupDate).WithMessage("Return date must be after pickup date");

        RuleFor(x => x.MinPrice)
            .GreaterThanOrEqualTo(0).When(x => x.MinPrice.HasValue)
            .WithMessage("Minimum price must be greater than or equal to 0");

        RuleFor(x => x.MaxPrice)
            .GreaterThanOrEqualTo(0).When(x => x.MaxPrice.HasValue)
            .WithMessage("Maximum price must be greater than or equal to 0")
            .GreaterThanOrEqualTo(x => x.MinPrice ?? 0).When(x => x.MaxPrice.HasValue && x.MinPrice.HasValue)
            .WithMessage("Maximum price must be greater than or equal to minimum price");

        RuleFor(x => x.Page)
            .GreaterThan(0).WithMessage("Page must be greater than 0");

        RuleFor(x => x.Limit)
            .GreaterThan(0).WithMessage("Limit must be greater than 0")
            .LessThanOrEqualTo(100).WithMessage("Limit must not exceed 100");

        RuleFor(x => x.SortBy)
            .Must(sortBy => string.IsNullOrWhiteSpace(sortBy) ||
                           new[] { "price", "distance", "rating" }.Contains(sortBy.ToLower()))
            .When(x => !string.IsNullOrWhiteSpace(x.SortBy))
            .WithMessage("SortBy must be one of: price, distance, rating");
    }
}
