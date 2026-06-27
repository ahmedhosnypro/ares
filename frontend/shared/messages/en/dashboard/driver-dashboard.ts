import type { DriverDashboardLabels } from "../../types/dashboard/driver-dashboard";

export const driverDashboard: DriverDashboardLabels = {
  title: "Driver Dashboard",
  description: "Manage your driving requests, trips, and earnings.",
  historicalPayoutLogs: "Historical Payout Logs",
  dashboardHeader: {
    welcomeBack: "Welcome back, {userName}!",
    portalDescription: "ARES Premium Chauffeur Portal • Shift Active and monitored.",
  },
  kpiMetrics: {
    overviewMetrics: "Overview Metrics",
    earnings: "Earnings",
    tripsDone: "Trips Done",
    scheduled: "Scheduled",
    rating: "Rating",
  },
  activeAssignment: {
    activeRentalAssignment: "Active Rental Assignment",
    inProgress: "In Progress",
    assignedClient: "Assigned Client",
    premiumCustomer: "Premium Customer",
    callClient: "Call Client",
    whatsappClient: "WhatsApp Client",
    journeyPath: "Journey Path",
    pickupAddress: "Pickup address",
    dropoffDestination: "Drop-off destination",
    assignedFleetVehicle: "Assigned Fleet Vehicle",
    luxurySedanClass: "Luxury Sedan Class",
    rentalScheduleAndGuidelines: "Rental Schedule & Guidelines",
    activeDuration: "Active Duration",
    guidelines: [
      "Ensure vehicle cabin remains clean and client amenities are stocked.",
      "Verify route schedule and adjust for traffic before picking up client.",
      "Report any delays or telemetry issues immediately via dispatch.",
    ],
  },
  upcomingSchedule: {
    calendarAndShiftSchedule: "Calendar & Shift Schedule",
  },
  payoutLogs: {
    tripId: "Trip ID",
    dateCompleted: "Date Completed",
    client: "Client",
    vehicle: "Vehicle",
    duration: "Duration",
    earnings: "Earnings",
    payoutStatus: "Payout Status",
  },
};
