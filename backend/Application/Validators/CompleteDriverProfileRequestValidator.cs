using FluentValidation;
using Backend.Application.DTOs.Driver;
using System;

namespace Backend.Application.Validators
{
    public class CompleteDriverProfileRequestValidator : AbstractValidator<CompleteDriverProfileRequest>
    {
        public CompleteDriverProfileRequestValidator()
        {
            RuleFor(x => x.LicenseNumber).NotEmpty().MaximumLength(50);
            RuleFor(x => x.LicenseExpiryDate).GreaterThan(DateTime.UtcNow).WithMessage("License must not be expired.");
            RuleFor(x => x.Address).NotEmpty().MaximumLength(500);
            RuleFor(x => x.EmergencyContactName).NotEmpty().MaximumLength(150);
            RuleFor(x => x.EmergencyContactPhone).NotEmpty().MaximumLength(30);
            RuleFor(x => x.ServiceAreaIds).NotEmpty().WithMessage("At least one service area must be selected.");
        }
    }
}
