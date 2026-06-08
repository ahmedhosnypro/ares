using System;
using MediatR;

namespace Backend.Application.Features.VehicleInspections.Commands.AssignInspector
{
    public class AssignInspectorCommand : IRequest<Guid>
    {
        public Guid BookingId { get; set; }

        public AssignInspectorCommand(Guid bookingId)
        {
            BookingId = bookingId;
        }
    }
}
