export interface SupplierVehiclesLabels {
  readonly metaTitle: string;
  readonly metaDescription: string;
  readonly title: string;
  readonly description: string;
  readonly addNewVehicle: string;
  readonly searchPlaceholder: string;
  readonly filters: {
    readonly status: string;
    readonly availability: string;
    readonly allStatuses: string;
    readonly allAvailability: string;
  };
  readonly empty: {
    readonly noVehiclesMatchFilters: string;
    readonly noVehiclesYet: string;
    readonly tryClearingFilters: string;
    readonly addFirstVehicle: string;
  };
  readonly table: {
    readonly vehicle: string;
    readonly pricePerDay: string;
    readonly status: string;
    readonly availability: string;
    readonly bookings: string;
    readonly created: string;
    readonly actions: string;
    readonly showing: string;
    readonly of: string;
    readonly vehicles: string;
    readonly perDay: string;
  };
  readonly deleteDialog: {
    readonly title: string;
    readonly body: string;
  };
  readonly tooltips: {
    readonly view: string;
    readonly accountRestricted: string;
    readonly onlyApprovedAvailable: string;
    readonly setUnavailable: string;
    readonly setAvailable: string;
  };
  readonly toasts: {
    readonly vehicleDeleted: string;
    readonly vehicleNowAvailable: string;
    readonly vehicleNowUnavailable: string;
    readonly failedToDelete: string;
    readonly onlyApprovedAvailable: string;
    readonly failedToUpdateAvailability: string;
  };
  readonly errors: {
    readonly notSignedIn: string;
    readonly loadFailed: string;
  };
  readonly chips: {
    readonly unknown: string;
    readonly pending: string;
    readonly approved: string;
    readonly rejected: string;
    readonly available: string;
    readonly unavailable: string;
    readonly fullyBooked: string;
  };
}
