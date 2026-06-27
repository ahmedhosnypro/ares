export interface DriverCompleteProfileLabels {
  title: string;
  subtitle: string;
  personalDetails: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  workAreas: string;
  selectServiceAreas: string;
  loadingAreas: string;
  licenseAndDocuments: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  driverLicenseImage: string;
  nationalIdFront: string;
  nationalIdBack: string;
  uploadImage: string;
  submitProfile: string;
  errors: {
    pleaseUploadAllRequiredDocuments: string;
    pleaseSelectAtLeastOneWorkArea: string;
    failedToCompleteProfile: string;
    anUnexpectedErrorOccurred: string;
  };
}
