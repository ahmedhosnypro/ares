using FluentValidation;
using Backend.Application.DTOs.Driver;

namespace Backend.Application.Validators
{
    public class UpdateDriverAvailabilityRequestValidator : AbstractValidator<UpdateDriverAvailabilityRequest>
    {
        public UpdateDriverAvailabilityRequestValidator()
        {
            RuleFor(x => x.Availability).IsInEnum();
        }
    }
}
