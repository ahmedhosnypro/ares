export type CreateBookingLabels = {
  readonly title: string;
  readonly subtitle: string;
  readonly buttons: {
    readonly create: string;
  };
  readonly steps: {
    readonly customer: {
      readonly title: string;
      readonly subtitle: string;
      readonly label: string;
      readonly placeholder: string;
      readonly minCharacters: string;
      readonly noOptions: string;
      readonly unnamed: string;
      readonly noEmail: string;
      readonly noPhone: string;
    };
    readonly info: {
      readonly title: string;
      readonly subtitle: string;
      readonly pickupDate: string;
      readonly returnDate: string;
      readonly pickupLocation: string;
      readonly dropoffLocation: string;
      readonly pickupLocationPlaceholder: string;
      readonly dropoffLocationPlaceholder: string;
      readonly noLocations: string;
      readonly returnDateError: string;
    };
    readonly vehicle: {
      readonly title: string;
      readonly subtitleActive: string;
      readonly subtitleInactive: string;
      readonly label: string;
      readonly placeholder: string;
      readonly noLocationSelected: string;
      readonly noVehiclesFound: string;
      readonly unnamed: string;
      readonly noPlate: string;
      readonly dailyRate: string;
      readonly change: string;
    };
    readonly payment: {
      readonly title: string;
      readonly subtitle: string;
      readonly cash: {
        readonly title: string;
        readonly description: string;
      };
      readonly online: {
        readonly title: string;
        readonly description: string;
      };
    };
  };
  readonly summary: {
    readonly title: string;
    readonly dailyRate: string;
    readonly totalDays: string;
    readonly totalDaysPlural: string;
    readonly totalPrice: string;
    readonly noticeLive: string;
    readonly noticeConfirm: string;
    readonly noticeFlow: string;
  };
};
