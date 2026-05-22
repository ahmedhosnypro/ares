using Backend.Application.DTOs.UserManagement;
using FluentValidation;

namespace Backend.Application.Validators;

/// <summary>
/// Validator for CreateUserRequest DTO
/// </summary>
public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email is required")
            .EmailAddress()
            .WithMessage("Email must be a valid email address")
            .MaximumLength(256)
            .WithMessage("Email must not exceed 256 characters");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Password is required")
            .MinimumLength(6)
            .WithMessage("Password must be at least 6 characters long")
            .MaximumLength(100)
            .WithMessage("Password must not exceed 100 characters")
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)")
            .WithMessage("Password must contain at least one lowercase letter, one uppercase letter, and one digit");

        RuleFor(x => x.FirstName)
            .NotEmpty()
            .WithMessage("First name is required")
            .MaximumLength(100)
            .WithMessage("First name must not exceed 100 characters");

        RuleFor(x => x.LastName)
            .NotEmpty()
            .WithMessage("Last name is required")
            .MaximumLength(100)
            .WithMessage("Last name must not exceed 100 characters");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(20)
            .WithMessage("Phone number must not exceed 20 characters")
            .Matches(@"^\+?[1-9]\d{1,14}$")
            .WithMessage("Phone number must be a valid international format")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));

        RuleFor(x => x.Status)
            .MaximumLength(50)
            .WithMessage("Status must not exceed 50 characters")
            .Must(status => string.IsNullOrWhiteSpace(status) ||
                           new[] { "Active", "Inactive", "Suspended", "Pending" }.Contains(status))
            .WithMessage("Status must be one of: Active, Inactive, Suspended, Pending")
            .When(x => !string.IsNullOrWhiteSpace(x.Status));

        RuleFor(x => x.Roles)
            .Must(roles => roles == null || roles.All(role => !string.IsNullOrWhiteSpace(role)))
            .WithMessage("All roles must be non-empty strings")
            .Must(roles => roles == null || roles.Count <= 10)
            .WithMessage("Cannot assign more than 10 roles to a user")
            .When(x => x.Roles != null);
    }
}