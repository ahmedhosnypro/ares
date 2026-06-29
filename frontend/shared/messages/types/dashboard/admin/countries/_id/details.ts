export type CountryDetailsLabels = {
  readonly title: string;
  readonly backButtonTooltip: string;
  readonly cardTitle: string;
  readonly idLabel: string;
  readonly nameLabel: string;
  readonly actions: {
    readonly edit: string;
    readonly delete: string;
  };
  readonly alerts: {
    readonly loadFailed: string;
    readonly notFound: string;
    readonly deleteSuccess: string;
    readonly deleteError: string;
    readonly checkError: string;
    readonly cannotDelete: string;
  };
  readonly deleteDialog: {
    readonly title: string;
    readonly description: string;
    readonly notice: string;
    readonly cancel: string;
    readonly confirm: string;
  };
};
