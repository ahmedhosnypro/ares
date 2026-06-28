export type AdminInspectorsLabels = {
  readonly title: string;
  readonly subtitle: string;
  readonly emptyTitle: string;
  readonly emptySubtitle: string;
  readonly addInspectorBtn: string;
  readonly searchPlaceholder: string;
  readonly statusAll: string;
  readonly statusActive: string;
  readonly statusDisabled: string;
  readonly stats: {
    readonly totalInspectors: string;
    readonly active: string;
    readonly disabled: string;
  };
  readonly table: {
    readonly inspector: string;
    readonly contact: string;
    readonly employeeCode: string;
    readonly availability: string;
    readonly status: string;
    readonly actions: string;
    readonly viewDetails: string;
    readonly disable: string;
    readonly enable: string;
    readonly available: string;
    readonly unavailable: string;
    readonly activeStatus: string;
    readonly disabledStatus: string;
  };
  readonly dialog: {
    readonly title: string;
    readonly subtitle: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly phoneNumber: string;
    readonly password: string;
    readonly employeeCode: string;
    readonly availableForAssignment: string;
    readonly currentlyUnavailable: string;
    readonly cancel: string;
    readonly creating: string;
    readonly create: string;
  };
  readonly validation: {
    readonly firstNameRequired: string;
    readonly lastNameRequired: string;
    readonly emailRequired: string;
    readonly emailInvalid: string;
    readonly emailTooLong: string;
    readonly passwordTooShort: string;
    readonly passwordUppercase: string;
    readonly passwordLowercase: string;
    readonly passwordDigit: string;
    readonly passwordSpecial: string;
    readonly employeeCodeRequired: string;
  };
  readonly alerts: {
    readonly loadError: string;
    readonly updateStatusError: string;
    readonly enabledSuccess: string;
    readonly disabledSuccess: string;
    readonly createSuccess: string;
    readonly createGenericError: string;
  };
  readonly mobile: {
    readonly codeLabel: string;
    readonly phoneLabel: string;
  };
};
