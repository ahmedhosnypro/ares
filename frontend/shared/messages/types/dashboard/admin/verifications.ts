export type AdminVerificationsLabels = {
  readonly title: string;
  readonly subtitle: string;
  readonly tabs: {
    readonly identity: string;
    readonly driverLicense: string;
  };
  readonly filters: {
    readonly allStatuses: string;
    readonly all: string;
    readonly pending: string;
    readonly approved: string;
    readonly verified: string;
    readonly rejected: string;
  };
  readonly table: {
    readonly user: string;
    readonly userName: string;
    readonly email: string;
    readonly documentType: string;
    readonly licenseNumber: string;
    readonly expiryDate: string;
    readonly status: string;
    readonly submittedDate: string;
    readonly actions: string;
    readonly viewTooltip: string;
    readonly approveTooltip: string;
    readonly rejectTooltip: string;
    readonly totalRecords: string;
    readonly emptyIdentity: string;
    readonly emptyLicense: string;
  };
  readonly viewModal: {
    readonly identityTitle: string;
    readonly licenseTitle: string;
    readonly userLabel: string;
    readonly docTypeLabel: string;
    readonly licenseNumLabel: string;
    readonly expiryDateLabel: string;
    readonly statusLabel: string;
    readonly rejectReasonLabel: string;
    readonly frontImage: string;
    readonly backImage: string;
    readonly licenseImage: string;
    readonly noImage: string;
    readonly close: string;
    readonly reject: string;
    readonly approve: string;
  };
  readonly rejectModal: {
    readonly identityTitle: string;
    readonly licenseTitle: string;
    readonly description: string;
    readonly reasonLabel: string;
    readonly reasonRequired: string;
    readonly cancel: string;
    readonly confirm: string;
    readonly rejecting: string;
  };
  readonly alerts: {
    readonly fetchIdentityError: string;
    readonly approveIdentitySuccess: string;
    readonly approveIdentityError: string;
    readonly rejectIdentitySuccess: string;
    readonly rejectIdentityError: string;
    readonly fetchLicenseError: string;
    readonly approveLicenseSuccess: string;
    readonly approveLicenseError: string;
    readonly rejectLicenseSuccess: string;
    readonly rejectLicenseError: string;
  };
};
