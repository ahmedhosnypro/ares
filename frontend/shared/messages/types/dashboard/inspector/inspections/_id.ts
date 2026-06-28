export type InspectionDetailLabels = {
  readonly pageTitle: string;
  readonly subtitle: string;
  readonly errors: {
    readonly accessDenied: string;
    readonly notFound: string;
    readonly loadFailed: string;
    readonly notFoundShort: string;
  };
  readonly goBack: string;
  readonly lockedAlert: string;
  readonly bookingInfo: {
    readonly title: string;
    readonly bookingNumber: string;
    readonly vehicle: string;
    readonly assignedTo: string;
    readonly scheduledDate: string;
    readonly submittedAt: string;
  };
  readonly vehicleMetrics: {
    readonly title: string;
    readonly odometerReading: string;
    readonly odometerPlaceholder: string;
    readonly odometerUnit: string;
    readonly fuelLevel: string;
    readonly fuelMarksE: string;
    readonly fuelMarksHalf: string;
    readonly fuelMarksF: string;
  };
  readonly images: {
    readonly title: string;
    readonly uploadButton: string;
    readonly noPhotosProvided: string;
    readonly uploadPrompt: string;
    readonly dragDropHint: string;
    readonly altText: string;
    readonly maxImagesError: string;
    readonly minImagesError: string;
  };
  readonly conditions: {
    readonly title: string;
    readonly generalConditionLabel: string;
    readonly generalConditionPlaceholder: string;
    readonly notesLabel: string;
    readonly notesPlaceholder: string;
  };
  readonly decision: {
    readonly title: string;
    readonly approve: string;
    readonly reject: string;
    readonly selectDecisionError: string;
  };
  readonly validation: {
    readonly notesRequired: string;
    readonly odometerInvalid: string;
  };
  readonly dialog: {
    readonly title: string;
    readonly description: string;
    readonly confirmAndSubmit: string;
  };
  readonly submitButton: string;
  readonly toast: {
    readonly submittedSuccessfully: string;
    readonly submissionFailed: string;
  };
};
