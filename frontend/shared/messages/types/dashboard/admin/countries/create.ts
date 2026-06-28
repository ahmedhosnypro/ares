export type CreateCountryLabels = {
  readonly title: string;
  readonly backButtonTooltip: string;
  readonly cardTitle: string;
  readonly form: {
    readonly fields: {
      readonly nameEn: string;
      readonly nameAr: string;
      readonly placeholderEn: string;
      readonly placeholderAr: string;
    };
    readonly validation: {
      readonly nameEnRequired: string;
      readonly nameArRequired: string;
      readonly nameUniqueError: string;
    };
    readonly buttons: {
      readonly cancel: string;
      readonly submit: string;
      readonly submitting: string;
    };
  };
  readonly alerts: {
    readonly success: string;
    readonly error: string;
  };
};
