using Backend.Application.DTOs.Location;
using FluentValidation;

namespace Backend.Application.Validators;

/// <summary>
/// Validator for create location requests
/// </summary>
public class CreateLocationRequestValidator : AbstractValidator<CreateLocationRequest>
{
    public CreateLocationRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("User ID is required");

        RuleFor(x => x.AddressLine)
            .MaximumLength(255)
            .WithMessage("Address line must not exceed 255 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.AddressLine));

        RuleFor(x => x.City)
            .MaximumLength(100)
            .WithMessage("City must not exceed 100 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.City));

        RuleFor(x => x.Governorate)
            .MaximumLength(100)
            .WithMessage("Governorate must not exceed 100 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Governorate));

        RuleFor(x => x.Country)
            .MaximumLength(100)
            .WithMessage("Country must not exceed 100 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Country));

        RuleFor(x => x.PostalCode)
            .MaximumLength(20)
            .WithMessage("Postal code must not exceed 20 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.PostalCode));

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90)
            .WithMessage("Latitude must be between -90 and 90 degrees")
            .When(x => x.Latitude.HasValue);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180)
            .WithMessage("Longitude must be between -180 and 180 degrees")
            .When(x => x.Longitude.HasValue);

        // At least one location field should be provided
        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.AddressLine) ||
                      !string.IsNullOrWhiteSpace(x.City) ||
                      !string.IsNullOrWhiteSpace(x.Governorate) ||
                      !string.IsNullOrWhiteSpace(x.Country))
            .WithMessage("At least one location field (Address Line, City, Governorate, or Country) must be provided");
    }
}