using System;

namespace Backend.Application.DTOs.Driver
{
    public class DriverDashboardSummaryDto
    {
        public string Status { get; set; } = null!;
        public string Availability { get; set; } = null!;
        public bool IsActive { get; set; }
        public int TotalTripsCompleted { get; set; }
        public double AverageRating { get; set; }
        public decimal TotalEarnings { get; set; }
        public int ActiveRequestsCount { get; set; }
        public int UpcomingAssignmentsCount { get; set; }

        // ── Extended aggregations ───────────────────────────────────────────
        /// <summary>All bookings ever assigned to this driver (any status except cancelled).</summary>
        public int TotalTrips { get; set; }
        /// <summary>Currently in-progress assignments (Active / ReadyForDelivery).</summary>
        public int ActiveTrips { get; set; }
        /// <summary>Completed assignments.</summary>
        public int CompletedTrips { get; set; }
        /// <summary>Confirmed/approved assignments whose pickup is still in the future.</summary>
        public int UpcomingTrips { get; set; }
    }
}
