using Backend.Application.DTOs.Review;
using FluentValidation;

namespace Backend.Application.Validators;

/// <summary>
/// Validator for supplier reply create/update requests.
/// Reply must be non-empty and at most 2000 characters — matching
/// the <c>nvarchar(2000)</c> column on the Reviews table.
/// </summary>
public class SupplierReplyRequestValidator : AbstractValidator<SupplierReplyRequest>
{
    public SupplierReplyRequestValidator()
    {
        RuleFor(x => x.Reply)
            .NotEmpty().WithMessage("Reply text is required")
            .MaximumLength(2000).WithMessage("Reply must not exceed 2000 characters");
    }
}
