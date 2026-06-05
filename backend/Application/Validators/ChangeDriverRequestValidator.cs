using FluentValidation;
using Backend.Application.DTOs.Driver;

namespace Backend.Application.Validators
{
    public class ChangeDriverRequestValidator : AbstractValidator<ChangeDriverRequest>
    {
        public ChangeDriverRequestValidator()
        {
            RuleFor(x => x.Reason).NotEmpty().MaximumLength(500);
        }
    }
}
