export type CustomerBookingsLabels = {
  readonly title: string;
  readonly description: string;
  readonly signInRequired: {
    readonly title: string;
    readonly message: string;
    readonly signInButton: string;
  };
  readonly resumeBooking: {
    readonly title: string;
    readonly message: string;
    readonly vehicleHeld: string;
    readonly resume: string;
    readonly cancel: string;
  };
  readonly filters: {
    readonly searchPlaceholder: string;
    readonly filterByStatus: string;
    readonly all: string;
    readonly sortBy: string;
    readonly sortOptions: {
      readonly dateDesc: string;
      readonly dateAsc: string;
      readonly priceAsc: string;
      readonly priceDesc: string;
      readonly statusAsc: string;
      readonly statusDesc: string;
    };
  };
  readonly list: {
    readonly loading: string;
    readonly error: string;
    readonly firstTripTitle: string;
    readonly firstTripMessage: string;
    readonly noMatches: string;
    readonly noMatchesHint: string;
    readonly retry: string;
    readonly pagination: {
      readonly showing: string;
      readonly of: string;
      readonly bookings: string;
    };
    readonly empty: {
      readonly title: string;
      readonly message: string;
      readonly browse: string;
    };
    readonly status: {
      readonly draft: string;
      readonly pending: string;
      readonly confirmed: string;
      readonly active: string;
      readonly completed: string;
      readonly cancelled: string;
    };
    readonly actions: {
      readonly view: string;
      readonly cancel: string;
      readonly extend: string;
    };
  };
  readonly card: {
    readonly unknownCar: string;
    readonly unknownSupplier: string;
    readonly totalLabel: string;
    readonly carImageAlt: string;
    readonly pickup: string;
    readonly dropoff: string;
    readonly viewDetails: string;
    readonly details: string;
    readonly notAvailable: string;
  };
};
