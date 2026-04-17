using Backend.Application.DTOs.UserProfile;
using FluentValidation;
using PhoneNumbers;

namespace Backend.Application.Validators;

/// <summary>
/// Validator for user profile update requests
/// Validates: Requirements 6.7, 14.1
/// </summary>
public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required")
            .MaximumLength(20).WithMessage("Phone number must not exceed 20 characters")
            .Must(BeValidInternationalPhone)
            .WithMessage("Phone number must be a valid international phone number (e.g. +20 100 000 0000)");

        RuleFor(x => x.DateOfBirth)
            .LessThan(DateTime.Today).When(x => x.DateOfBirth.HasValue)
            .WithMessage("Date of birth must be in the past")
            .GreaterThan(DateTime.Today.AddYears(-120)).When(x => x.DateOfBirth.HasValue)
            .WithMessage("Date of birth must be within the last 120 years")
            .Must(BeAtLeast18YearsOld).When(x => x.DateOfBirth.HasValue)
            .WithMessage("You must be at least 18 years old");

        RuleFor(x => x.LanguagePreference)
            .NotEmpty().WithMessage("Language preference is required")
            .MaximumLength(10).WithMessage("Language preference must not exceed 10 characters")
            .Matches(@"^[a-z]{2}(-[A-Z]{2})?$")
            .WithMessage("Language preference must be a valid locale code (e.g. 'en', 'en-US')");

        RuleFor(x => x.CurrencyPreference)
            .NotEmpty().WithMessage("Currency preference is required")
            .Length(3).WithMessage("Currency preference must be a 3-letter ISO code")
            .Matches(@"^[A-Z]{3}$")
            .WithMessage("Currency preference must be a valid ISO 4217 code (e.g. 'USD', 'EUR')");

        RuleFor(x => x.Address)
            .NotNull().WithMessage("Address is required")
            .SetValidator(new AddressDtoValidator());

        RuleFor(x => x.EmergencyContact)
            .NotNull().WithMessage("Emergency contact is required")
            .SetValidator(new EmergencyContactDtoValidator());
    }

    private static bool BeValidInternationalPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return false;

        try
        {
            var util = PhoneNumberUtil.GetInstance();
            var parsed = util.Parse(phone, null); // null = requires country code in number
            return util.IsValidNumber(parsed);
        }
        catch (NumberParseException)
        {
            return false;
        }
    }

    private static bool BeAtLeast18YearsOld(DateTime? dateOfBirth)
    {
        if (!dateOfBirth.HasValue) return true;
        var age = DateTime.Today.Year - dateOfBirth.Value.Year;
        if (dateOfBirth.Value.Date > DateTime.Today.AddYears(-age)) age--;
        return age >= 18;
    }
}

/// <summary>
/// Validator for address information
/// </summary>
public class AddressDtoValidator : AbstractValidator<AddressDto>
{
    public AddressDtoValidator()
    {
        RuleFor(x => x.Street)
            .MaximumLength(200).WithMessage("Street address must not exceed 200 characters");

        RuleFor(x => x.City)
            .MaximumLength(100).WithMessage("City must not exceed 100 characters");

        RuleFor(x => x.State)
            .MaximumLength(100).WithMessage("State/Province must not exceed 100 characters");

        RuleFor(x => x.PostalCode)
            .MaximumLength(20).WithMessage("Postal code must not exceed 20 characters")
            .Matches(@"^[A-Za-z0-9\s\-]{0,20}$")
            .WithMessage("Postal code must contain only letters, numbers, spaces, and hyphens")
            .When(x => !string.IsNullOrWhiteSpace(x.PostalCode));

        RuleFor(x => x.Country)
            .MaximumLength(100).WithMessage("Country must not exceed 100 characters");
    }
}

/// <summary>
/// Validator for emergency contact information
/// </summary>
public class EmergencyContactDtoValidator : AbstractValidator<EmergencyContactDto>
{
    public EmergencyContactDtoValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(200).WithMessage("Emergency contact name must not exceed 200 characters");

        RuleFor(x => x.Phone)
            .MaximumLength(20).WithMessage("Emergency contact phone must not exceed 20 characters")
            .Must(BeValidInternationalPhone)
            .WithMessage("Emergency contact phone must be a valid international phone number")
            .When(x => !string.IsNullOrWhiteSpace(x.Phone));

        RuleFor(x => x.Relationship)
            .MaximumLength(50).WithMessage("Relationship must not exceed 50 characters");
    }

    private static bool BeValidInternationalPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return false;
        try
        {
            var util = PhoneNumberUtil.GetInstance();
            var parsed = util.Parse(phone, null);
            return util.IsValidNumber(parsed);
        }
        catch (NumberParseException)
        {
            return false;
        }
    }
}
