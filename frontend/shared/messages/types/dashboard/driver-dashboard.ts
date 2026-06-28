export interface DriverDashboardLabels {
  title: string;
  description: string;
  historicalPayoutLogs: string;
  chauffeur: string;
  chauffeurInitial: string;
  dashboardHeader: {
    welcomeBack: string;
    portalDescription: string;
    defaultUserName: string;
    defaultInitial: string;
  };
  kpiMetrics: {
    overviewMetrics: string;
    earnings: string;
    tripsDone: string;
    scheduled: string;
    rating: string;
    ratingFormat: string;
    availableBalance: string;
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
    scheduled: string;
    assignedFleetVehicle: string;
    luxurySedanClass: string;
    rentalScheduleAndGuidelines: string;
    activeDuration: string;
    guidelines: readonly string[];
    day: string;
    days: string;
    daysRemaining: string;
    noAssignment: string;
    noActiveAssignment: string;
    noAssignmentDescription: string;
  };
  upcomingSchedule: {
    calendarAndShiftSchedule: string;
    day: string;
    days: string;
  };
  payoutLogs: {
    tripId: string;
    dateCompleted: string;
    client: string;
    vehicle: string;
    duration: string;
    earnings: string;
    payoutStatus: string;
    paid: string;
    pending: string;
  };
  availability: {
    status: string;
    available: string;
    unavailable: string;
    reserved: string;
    confirmAvailabilityChange: string;
    changeStatusTo: string;
    youWillNotReceiveRequests: string;
    youWillStartReceivingRequests: string;
    cancel: string;
    confirm: string;
    toggleAvailability: string;
    failedToUpdateAvailability: string;
  };
  inspectionWalkthrough: {
    preRental: string;
    postRental: string;
    walkthroughInspection: string;
    reviewConditionCheck: string;
    currentOdometer: string;
    odometerPlaceholder: string;
    fuelLevel: string;
    exteriorVerification: string;
    noNewScratches: string;
    correctTirePressure: string;
    cleanWindshield: string;
    interiorVerification: string;
    cleanCabin: string;
    dashboardFreeOfWarnings: string;
    documentationInGloveBox: string;
    walkthroughEvidence: string;
    uploadVerificationPhotos: string;
    dragAndDropPhotos: string;
    walkthroughLogNotes: string;
    logNotesPlaceholder: string;
    submitLog: string;
    submittingWalkthrough: string;
  };
}
