export type AccountBookingsLabels = {
  readonly title: string;
  readonly description: string;
  readonly loading: string;
  readonly error: {
    readonly title: string;
    readonly message: string;
  };
  readonly empty: {
    readonly title: string;
    readonly message: string;
  };
  readonly filters: {
    readonly title: string;
    readonly status: string;
    readonly dateRange: string;
    readonly startDate: string;
    readonly endDate: string;
    readonly supplier: string;
    readonly search: string;
    readonly apply: string;
    readonly clear: string;
  };
  readonly activeTrip: {
    readonly title: string;
    readonly viewDetails: string;
    readonly extendTrip: string;
    readonly vehicleControls: string;
  };
  readonly export: {
    readonly title: string;
    readonly format: string;
    readonly csv: string;
    readonly pdf: string;
    readonly excel: string;
    readonly exportButton: string;
  };
};
