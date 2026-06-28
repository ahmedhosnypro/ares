import type { InspectionDetailLabels } from "../../../../../types/dashboard/inspector/inspections/_id";

export const inspectionDetail: InspectionDetailLabels = {
  pageTitle: "Inspection Report",
  subtitle: "Review details and submit for booking #{bookingNumber}",
  errors: {
    accessDenied: "You do not have access to this inspection.",
    notFound: "Inspection not found.",
    loadFailed: "Failed to load inspection details.",
    notFoundShort: "Not found",
  },
  goBack: "Go Back",
  lockedAlert: "This inspection report has been submitted and is locked for editing.",
  bookingInfo: {
    title: "Details",
    bookingNumber: "Booking Number",
    vehicle: "Vehicle",
    assignedTo: "Assigned To",
    scheduledDate: "Scheduled Date",
    submittedAt: "Submitted At",
  },
  vehicleMetrics: {
    title: "Vehicle Metrics",
    odometerReading: "Odometer Reading",
    odometerPlaceholder: "e.g. 45000",
    odometerUnit: "km",
    fuelLevel: "Fuel Level: {level}%",
    fuelMarksE: "E",
    fuelMarksHalf: "1/2",
    fuelMarksF: "F",
  },
  images: {
    title: "Visual Evidence ({current}/{max})",
    uploadButton: "Upload Photos",
    noPhotosProvided: "No photos provided",
    uploadPrompt: "Upload Inspection Photos",
    dragDropHint: "Drag and drop or click to browse (Min {min}, Max {max})",
    altText: "Inspection",
    maxImagesError: "Maximum {max} images allowed",
    minImagesError: "At least {min} photo is required",
  },
  conditions: {
    title: "Condition & Notes",
    generalConditionLabel: "Damage Report / General Condition (Optional)",
    generalConditionPlaceholder: "List any visible damage, scratches, or general condition remarks...",
    notesLabel: "Final Inspection Notes (Required)",
    notesPlaceholder: "Detailed observations to support your final decision...",
  },
  decision: {
    title: "Final Decision",
    approve: "Approve Vehicle",
    reject: "Reject Vehicle",
    selectDecisionError: "Please select a decision (Approve or Reject)",
  },
  validation: {
    notesRequired: "Please provide inspection notes",
    odometerInvalid: "Please enter a valid odometer reading",
  },
  dialog: {
    title: "Submit Inspection Report?",
    description: "You are about to mark this vehicle as <strong>{decision}</strong>. This action is permanent and will notify the relevant parties.",
    confirmAndSubmit: "Confirm & Submit",
  },
  submitButton: "Submit Final Report",
  toast: {
    submittedSuccessfully: "Inspection submitted successfully",
    submissionFailed: "Submission failed. Please try again.",
  },
};
