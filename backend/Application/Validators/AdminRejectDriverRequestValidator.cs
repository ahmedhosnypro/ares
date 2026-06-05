using FluentValidation;
using Backend.Application.DTOs.Driver;

namespace Backend.Application.Validators
{
    public class AdminRejectDriverRequestValidator : AbstractValidator<AdminRejectDriverRequest>
    {
        public AdminRejectDriverRequestValidator()
        {
            RuleFor(x => x.RejectionReason).NotEmpty().MaximumLength(500);
        }
    }
}
