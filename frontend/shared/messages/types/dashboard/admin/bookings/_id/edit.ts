export type EditBookingLabels = {
  readonly pageTitle: string;
  readonly errors: {
    readonly loadFailed: string;
    readonly notFound: string;
    readonly dateError: string;
    readonly returnDateError: string;
    readonly saveFailed: string;
  };
  readonly buttons: {
    readonly cancel: string;
    readonly saveChanges: string;
    readonly backToBookings: string;
  };
  readonly notices: {
    readonly terminal: string;
    readonly priceCalculation: string;
  };
  readonly bookingSummary: {
    readonly title: string;
    readonly plate: string;
    readonly supplier: string;
    readonly customer: string;
    readonly paymentStatus: string;
    readonly unpaid: string;
    readonly dailyRate: string;
  };
  readonly editableInfo: {
    readonly title: string;
    readonly pickupDate: string;
    readonly returnDate: string;
    readonly pickupLocation: string;
    readonly dropoffLocation: string;
    readonly bookingStatus: string;
  };
  readonly pricingSummary: {
    readonly title: string;
    readonly dailyRate: string;
    readonly totalDays: string;
    readonly totalPrice: string;
    readonly daysValue: string;
  };
};
