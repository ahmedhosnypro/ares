export type AdminVehiclesMgmtLabels = {
  readonly title: string;
  readonly subtitle: string;
  readonly stats: {
    readonly totalAssets: string;
    readonly available: string;
    readonly inMaintenance: string;
    readonly outOfService: string;
  };
  readonly actions: {
    readonly editStatus: string;
    readonly statusHistory: string;
    readonly importCsv: string;
    readonly exportData: string;
    readonly bulkAction: string;
  };
  readonly table: {
    readonly vehicle: string;
    readonly category: string;
    readonly location: string;
    readonly status: string;
    readonly action: string;
    readonly empty: string;
    readonly searchPlaceholder: string;
    readonly allStatuses: string;
    readonly allCategories: string;
  };
  readonly statusDialog: {
    readonly title: string;
    readonly selectStatus: string;
    readonly reason: string;
    readonly expectedReturn: string;
    readonly cancel: string;
    readonly save: string;
    readonly successAlert: string;
  };
  readonly historyDialog: {
    readonly title: string;
    readonly date: string;
    readonly statusChange: string;
    readonly reason: string;
    readonly user: string;
    readonly close: string;
    readonly empty: string;
  };
  readonly bulkDialog: {
    readonly title: string;
    readonly selectAction: string;
    readonly updatePricing: string;
    readonly changeStatus: string;
    readonly assignLocation: string;
    readonly updateAvailability: string;
    readonly apply: string;
    readonly cancel: string;
    readonly successAlert: string;
    readonly affectingCount: string;
    readonly changeStatusMaintenance: string;
  };
  readonly statuses: {
    readonly active: string;
    readonly maintenance: string;
    readonly outOfService: string;
  };
  readonly alerts: {
    readonly importSuccess: string;
    readonly exportSuccess: string;
  };
};
