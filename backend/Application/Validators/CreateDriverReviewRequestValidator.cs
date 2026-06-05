using FluentValidation;
using Backend.Application.DTOs.Driver;

namespace Backend.Application.Validators
{
    public class CreateDriverReviewRequestValidator : AbstractValidator<CreateDriverReviewRequest>
    {
        public CreateDriverReviewRequestValidator()
        {
            RuleFor(x => x.Rating).InclusiveBetween(1, 5);
            RuleFor(x => x.Comment).MaximumLength(1000);
        }
    }
}
