export type CountriesLabels = {
  readonly title: string;
  readonly subtitle: string;
  readonly addCountry: string;
  readonly stats: {
    readonly totalCountries: string;
    readonly activeRegions: string;
    readonly activeRegionsDesc: string;
  };
  readonly searchPlaceholder: string;
  readonly table: {
    readonly headers: {
      readonly countryName: string;
      readonly actions: string;
    };
    readonly empty: string;
    readonly showing: string;
  };
  readonly actions: {
    readonly delete: string;
  };
  readonly deleteDialog: {
    readonly title: string;
    readonly description: string;
    readonly notice: string;
    readonly cancel: string;
    readonly confirm: string;
  };
  readonly alerts: {
    readonly deleteSuccess: string;
    readonly deleteError: string;
    readonly checkError: string;
    readonly cannotDelete: string;
  };
};
