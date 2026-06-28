export type CategoriesLabels = {
  readonly title: string;
  readonly addCategory: string;
  readonly editCategory: string;
  readonly table: {
    readonly headers: {
      readonly name: string;
      readonly commission: string;
      readonly vehicles: string;
      readonly offer: string;
      readonly status: string;
      readonly actions: string;
    };
    readonly empty: string;
    readonly offerNone: string;
    readonly offerValue: string;
    readonly statusActive: string;
    readonly statusInactive: string;
  };
  readonly actions: {
    readonly edit: string;
    readonly delete: string;
    readonly deleteConfirm: string;
  };
  readonly alerts: {
    readonly deleteSuccess: string;
    readonly deleteError: string;
    readonly deleteHasVehiclesError: string;
    readonly saveSuccess: string;
    readonly loadError: string;
  };
  readonly form: {
    readonly addTitle: string;
    readonly editTitle: string;
    readonly fields: {
      readonly name: string;
      readonly description: string;
      readonly commission: string;
      readonly status: string;
      readonly offerTitle: string;
      readonly offerName: string;
      readonly discount: string;
      readonly startDate: string;
      readonly endDate: string;
      readonly offerStatus: string;
      readonly offerActive: string;
      readonly offerInactive: string;
    };
    readonly validation: {
      readonly nameRequired: string;
    };
    readonly errors: {
      readonly saveFailed: string;
    };
  };
};
