export type AdminDriversLabels = {
  readonly title: string;
  readonly subtitle: string;
  readonly tabs: {
    readonly allDrivers: string;
    readonly pendingVerification: string;
  };
  readonly searchPlaceholder: string;
  readonly status: string;
  readonly errorLoad: string;
  readonly noDrivers: string;
  readonly filters: {
    readonly reset: string;
  };
  readonly table: {
    readonly driver: string;
    readonly email: string;
    readonly status: string;
    readonly availability: string;
    readonly rating: string;
    readonly active: string;
    readonly actions: string;
    readonly view: string;
    readonly viewLicense: string;
    readonly verifyStatus: string;
    readonly toggleStatus: string;
    readonly activeStatus: string;
    readonly disabledStatus: string;
  };
  readonly statuses: {
    readonly all: string;
    readonly incomplete: string;
    readonly pendingVerification: string;
    readonly verified: string;
    readonly rejected: string;
    readonly suspended: string;
  };
  readonly availabilities: {
    readonly available: string;
    readonly unavailable: string;
    readonly reserved: string;
  };
};
