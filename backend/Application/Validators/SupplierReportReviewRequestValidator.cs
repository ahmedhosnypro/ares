using Backend.Application.DTOs.Review;
using FluentValidation;

namespace Backend.Application.Validators;

/// <summary>
/// Validator for supplier review-report requests. The reason is
/// required so admins later have context, and is capped at the
/// underlying <c>nvarchar(1000)</c> column length.
/// </summary>
public class SupplierReportReviewRequestValidator : AbstractValidator<SupplierReportReviewRequest>
{
    public SupplierReportReviewRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Report reason is required")
            .MaximumLength(1000).WithMessage("Report reason must not exceed 1000 characters");
    }
}
