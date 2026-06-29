using FluentValidation;
using Backend.Application.DTOs.Booking;

namespace Backend.Application.Validators;

public class RejectBookingRequestValidator : AbstractValidator<RejectBookingRequest>
{
    public RejectBookingRequestValidator()
    {
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(500);
    }
}
