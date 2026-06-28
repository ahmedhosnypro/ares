export interface SupplierBookingsLabels {
  readonly metaTitle: string;
  readonly metaDescription: string;
  readonly title: string;
  readonly subtitle: string;
  readonly search: {
    readonly placeholder: string;
  };
  readonly filters: {
    readonly bookingStatus: string;
    readonly paymentStatus: string;
    readonly allStatuses: string;
    readonly bookingStatusOptions: {
      readonly draft: string;
      readonly paymentPending: string;
      readonly confirmed: string;
      readonly active: string;
      readonly completed: string;
      readonly cancelled: string;
    };
    readonly paymentStatusOptions: {
      readonly pending: string;
      readonly authorized: string;
      readonly captured: string;
      readonly failed: string;
      readonly refunded: string;
    };
  };
  readonly statusLabels: {
    readonly completed: string;
    readonly cancelled: string;
    readonly draft: string;
    readonly paymentPending: string;
  };
  readonly table: {
    readonly customer: string;
    readonly vehicle: string;
    readonly period: string;
    readonly payment: string;
    readonly total: string;
    readonly created: string;
  };
  readonly empty: {
    readonly title: string;
    readonly description: string;
  };
  readonly customerDefault: string;
  readonly paymentDefault: string;
  readonly footer: {
    readonly showingPage: string;
  };
  readonly actions: {
    readonly viewDetails: string;
  };
}
