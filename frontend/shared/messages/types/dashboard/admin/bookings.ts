export type AdminBookingsLabels = {
  readonly title: string;
  readonly subtitle: string;
  readonly newBooking: string;
  readonly alerts: {
    readonly createdSuccess: string;
    readonly deleteSuccess: string;
    readonly deleteError: string;
    readonly changeStatusSuccess: string;
    readonly changeStatusError: string;
  };
  readonly table: {
    readonly daysCount: string;
    readonly headers: {
      readonly booking: string;
      readonly vehicle: string;
      readonly supplier: string;
      readonly period: string;
      readonly status: string;
      readonly paymentMethod: string;
      readonly paymentStatus: string;
      readonly total: string;
    };
    readonly pagination: {
      readonly showingPage: string;
    };
    readonly empty: {
      readonly title: string;
      readonly description: string;
    };
  };
  readonly filters: {
    readonly searchPlaceholder: string;
    readonly dateFrom: string;
    readonly dateTo: string;
    readonly statuses: {
      readonly all: string;
      readonly draft: string;
      readonly paymentPending: string;
      readonly confirmed: string;
      readonly active: string;
      readonly completed: string;
      readonly cancelled: string;
    };
  };
  readonly paymentStatuses: {
    readonly captured: string;
    readonly refunded: string;
    readonly failed: string;
    readonly pending: string;
    readonly unpaid: string;
  };
  readonly deleteDialog: {
    readonly title: string;
    readonly content: string;
    readonly subcontent: string;
  };
  readonly menu: {
    readonly viewDetails: string;
    readonly editBooking: string;
    readonly changeStatus: string;
    readonly deleteBooking: string;
  };
  readonly changeStatusModal: {
    readonly title: string;
    readonly currentLabel: string;
    readonly newStatusLabel: string;
    readonly statuses: {
      readonly paymentPending: string;
      readonly confirmed: string;
      readonly active: string;
      readonly completed: string;
      readonly cancelled: string;
    };
  };
  readonly analytics: {
    readonly title: string;
    readonly total: string;
    readonly chartTooltip: string;
    readonly kpis: {
      readonly activeBookings: string;
      readonly pickupQueue: string;
      readonly returnQueue: string;
      readonly upcomingPickups: string;
    };
    readonly statuses: {
      readonly draft: string;
      readonly paymentPending: string;
      readonly confirmed: string;
      readonly active: string;
      readonly completed: string;
      readonly cancelled: string;
      readonly cancelledByAdmin: string;
    };
  };
};
