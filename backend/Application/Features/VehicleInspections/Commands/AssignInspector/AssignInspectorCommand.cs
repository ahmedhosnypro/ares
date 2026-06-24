using System;
using MediatR;

namespace Backend.Application.Features.VehicleInspections.Commands.AssignInspector
{
    public class AssignInspectorCommand : IRequest<Guid>
    {
        public Guid BookingId { get; set; }
        public string InspectionType { get; set; }
        public bool IsManual { get; set; }

        public AssignInspectorCommand(Guid bookingId, string inspectionType = "Pickup", bool isManual = false)
        {
            BookingId = bookingId;
            InspectionType = inspectionType;
            IsManual = isManual;
        }
    }
}
