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
    readonly offerEndsIn: string;
    readonly expiredOffer: string;
  };
  readonly actions: {
    readonly edit: string;
    readonly delete: string;
    readonly deleteConfirm: string;
    readonly viewDetails: string;
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
    readonly infoTitle: string;
    readonly cancelBtn: string;
    readonly createBtn: string;
    readonly creatingBtn: string;
    readonly statusActiveLabel: string;
    readonly statusInactiveLabel: string;
    readonly placeholders: {
      readonly name: string;
      readonly description: string;
    };
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
  readonly summaryCards: {
    readonly categories: string;
    readonly vehicles: string;
    readonly withOffers: string;
    readonly avgCommission: string;
  };
  readonly emptyState: {
    readonly noMatchTitle: string;
    readonly noCategoriesTitle: string;
    readonly noMatchDesc: string;
    readonly noCategoriesDesc: string;
    readonly clearFiltersBtn: string;
  };
  readonly toolbar: {
    readonly searchPlaceholder: string;
    readonly statusLabel: string;
    readonly allStatuses: string;
    readonly offerLabel: string;
    readonly allOffers: string;
    readonly activeOffer: string;
    readonly expiredOffer: string;
    readonly noOffer: string;
    readonly sortByLabel: string;
    readonly sortNameAZ: string;
    readonly sortNameZA: string;
    readonly sortVehiclesCount: string;
    readonly sortCommission: string;
    readonly sortCreatedDate: string;
  };
  readonly pagination: {
    readonly showing: string;
  };
};
