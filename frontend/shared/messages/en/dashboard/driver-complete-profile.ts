import type { DriverCompleteProfileLabels } from "../../types/dashboard/driver-complete-profile";

export const driverCompleteProfile: DriverCompleteProfileLabels = {
  title: "Complete Your Driver Profile",
  pageDescription: "Provide your license, ID, and work area details to start driving with ARES.",
  subtitle: "Please provide your details and documents to start receiving ride requests.",
  personalDetails: "Personal Details",
  address: "Address",
  emergencyContactName: "Emergency Contact Name",
  emergencyContactPhone: "Emergency Contact Phone",
  workAreas: "Work Areas",
  selectServiceAreas: "Select Service Areas",
  loadingAreas: "Loading areas...",
  licenseAndDocuments: "License & Documents",
  licenseNumber: "License Number",
  licenseExpiryDate: "License Expiry Date",
  driverLicenseImage: "Driver License Image",
  nationalIdFront: "National ID (Front)",
  nationalIdBack: "National ID (Back)",
  uploadImage: "Upload Image",
  submitProfile: "Submit Profile",
  errors: {
    pleaseUploadAllRequiredDocuments: "Please upload all required documents.",
    pleaseSelectAtLeastOneWorkArea: "Please select at least one work area.",
    failedToCompleteProfile: "Failed to complete profile.",
    anUnexpectedErrorOccurred: "An unexpected error occurred.",
  },
};
