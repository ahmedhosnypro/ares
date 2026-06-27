export interface DriverDashboardLabels {
  title: string;
  description: string;
  historicalPayoutLogs: string;
  dashboardHeader: {
    welcomeBack: string;
    portalDescription: string;
  };
  kpiMetrics: {
    overviewMetrics: string;
    earnings: string;
    tripsDone: string;
    scheduled: string;
    rating: string;
  };
  activeAssignment: {
    activeRentalAssignment: string;
    inProgress: string;
    assignedClient: string;
    premiumCustomer: string;
    callClient: string;
    whatsappClient: string;
    journeyPath: string;
    pickupAddress: string;
    dropoffDestination: string;
    assignedFleetVehicle: string;
    luxurySedanClass: string;
    rentalScheduleAndGuidelines: string;
    activeDuration: string;
    guidelines: string[];
  };
  upcomingSchedule: {
    calendarAndShiftSchedule: string;
  };
  payoutLogs: {
    tripId: string;
    dateCompleted: string;
    client: string;
    vehicle: string;
    duration: string;
    earnings: string;
    payoutStatus: string;
  };
}
