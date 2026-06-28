export interface SupplierBookingDetailLabels {
  readonly metaTitle: string;
  readonly metaDescription: string;
  readonly header: {
    readonly title: string;
    readonly statusDraft: string;
    readonly created: string;
  };
  readonly errors: {
    readonly notFoundOrDenied: string;
    readonly sessionExpired: string;
    readonly forbidden: string;
    readonly loadFailedWithStatus: string;
    readonly loadFailed: string;
    readonly notFound: string;
  };
  readonly backToBookings: string;
  readonly backToBookingsTooltip: string;
  readonly customerInfo: {
    readonly title: string;
    readonly name: string;
    readonly email: string;
    readonly phone: string;
  };
  readonly vehicleInfo: {
    readonly title: string;
    readonly plate: string;
  };
  readonly bookingInfo: {
    readonly title: string;
    readonly pickupDate: string;
    readonly returnDate: string;
    readonly totalDays: string;
    readonly daysUnit: string;
    readonly pickupLocation: string;
    readonly dropoffLocation: string;
  };
  readonly paymentInfo: {
    readonly title: string;
    readonly totalAmount: string;
    readonly status: string;
    readonly pendingStatus: string;
    readonly method: string;
    readonly processedAt: string;
  };
}
