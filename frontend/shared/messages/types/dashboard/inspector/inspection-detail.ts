export type InspectorInspectionDetailLabels = {
  readonly errors: {
    readonly accessDenied: string;
    readonly notFound: string;
    readonly failedToLoad: string;
    readonly maxImages: string;
    readonly selectDecision: string;
    readonly provideNotes: string;
    readonly enterOdometer: string;
    readonly photoRequired: string;
    readonly submitFailed: string;
  };
  readonly success: {
    readonly submitted: string;
  };
  readonly actions: {
    readonly goBack: string;
    readonly cancel: string;
    readonly confirmSubmit: string;
    readonly uploadPhotos: string;
    readonly submitFinalReport: string;
    readonly approveVehicle: string;
    readonly rejectVehicle: string;
  };
  readonly labels: {
    readonly notFound: string;
    readonly title: string;
    readonly subtitle: string;
    readonly dialogTitle: string;
    readonly dialogText: string;
    readonly detailsTitle: string;
    readonly bookingNumber: string;
    readonly vehicle: string;
    readonly assignedTo: string;
    readonly scheduledDate: string;
    readonly submittedAt: string;
    readonly lockedAlert: string;
    readonly vehicleMetrics: string;
    readonly odometerReading: string;
    readonly odometerPlaceholder: string;
    readonly odometerUnit: string;
    readonly fuelLevel: string;
    readonly fuelMarksE: string;
    readonly fuelMarksHalf: string;
    readonly fuelMarksF: string;
    readonly visualEvidence: string;
    readonly noPhotos: string;
    readonly uploadTitle: string;
    readonly uploadSubtitle: string;
    readonly imageAltText: string;
    readonly conditionTitle: string;
    readonly damageReport: string;
    readonly damagePlaceholder: string;
    readonly finalNotes: string;
    readonly finalNotesPlaceholder: string;
    readonly finalDecision: string;
  };
};
