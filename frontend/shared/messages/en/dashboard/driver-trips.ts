import type { DriverTripsLabels } from "../../types/dashboard/driver-trips";

export const driverTrips: DriverTripsLabels = {
  title: "My Trips",
  description: "Manage your assigned, active, and completed ride requests.",
  failedToLoadAssignments: "Failed to load assignments",
  couldNotLoadTrips: "Could not load your trips.",
  cancelTripConfirm:
    "Are you sure you want to cancel this trip? This action cannot be undone and is only allowed at least 24h before pickup.",
  failedToCancel: "Failed to cancel",
  failedToCancelTrip: "Failed to cancel trip",
  upcoming: "Upcoming",
  active: "Active",
  completed: "Completed",
  noTripsFound: "No trips found in this category.",
  pickup: "Pickup",
  dropoff: "Dropoff",
  driverFee: "Driver Fee",
  cancelTrip: "Cancel Trip",
  failedToUpdateAvailability: "Failed to update availability",
  statusConfirmed: "Confirmed",
  statusApproved: "Approved",
  statusReadyForDelivery: "Ready for Delivery",
  statusActive: "Active",
  statusCompleted: "Completed",
  statusCancelled: "Cancelled",
  ariaLabel: "Driver trips tabs",
};
