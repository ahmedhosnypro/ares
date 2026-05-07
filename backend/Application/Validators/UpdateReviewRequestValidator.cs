using Backend.Application.DTOs.Review;
using FluentValidation;

namespace Backend.Application.Validators;

/// <summary>
/// Validator for review update requests.
/// Mirrors the same field rules as <see cref="CreateReviewRequestValidator"/>.
/// </summary>
public class UpdateReviewRequestValidator : AbstractValidator<UpdateReviewRequest>
{
    public UpdateReviewRequestValidator()
    {
        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5");

        RuleFor(x => x.Comment)
            .MaximumLength(1000).WithMessage("Review comment must not exceed 1000 characters")
            .When(x => !string.IsNullOrWhiteSpace(x.Comment));
    }
}
