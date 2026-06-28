export type CategoryDetailsLabels = {
  readonly backToCategories: string;
  readonly statusActive: string;
  readonly statusInactive: string;
  readonly stats: {
    readonly totalVehicles: string;
    readonly totalBookings: string;
    readonly revenue: string;
  };
  readonly vehiclesTable: {
    readonly title: string;
    readonly headers: {
      readonly makeModel: string;
      readonly licensePlate: string;
      readonly actions: string;
    };
    readonly viewButton: string;
    readonly empty: string;
  };
  readonly promotions: {
    readonly title: string;
    readonly activeScheduled: string;
    readonly addBtn: string;
    readonly percentOff: string;
    readonly deleteConfirm: string;
    readonly empty: string;
    readonly alerts: {
      readonly deleteSuccess: string;
      readonly deleteError: string;
      readonly saveSuccess: string;
      readonly saveError: string;
      readonly loadError: string;
      readonly requiredFields: string;
      readonly dateOrderError: string;
    };
    readonly form: {
      readonly addTitle: string;
      readonly editTitle: string;
      readonly name: string;
      readonly discount: string;
      readonly startDate: string;
      readonly endDate: string;
      readonly status: string;
      readonly statusOptions: {
        readonly active: string;
        readonly inactive: string;
        readonly expired: string;
      };
    };
  };
  readonly errors: {
    readonly notFound: string;
    readonly loadError: string;
  };
};
