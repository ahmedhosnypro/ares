export type OrderSummaryLabels = {
  readonly premiumClass: string;
  readonly suppliedBy: string;
  readonly pickup: string;
  readonly return: string;
  readonly price: {
    readonly rental: string;
    readonly day: string;
    readonly days: string;
    readonly discount: string;
    readonly totalAmount: string;
  };
};

export type BookingPaymentLabels = {
  readonly title: string;
  readonly subtitle: string;
  readonly stepper: {
    readonly payment: string;
  };
  readonly error: {
    readonly verificationRequired: {
      readonly title: string;
    };
    readonly bookingStatusChanged: {
      readonly title: string;
      readonly message: string;
    };
    readonly vehicleUnavailable: {
      readonly title: string;
    };
    readonly generic: {
      readonly message: string;
    };
  };
  readonly actions: {
    readonly viewBooking: string;
    readonly completeVerification: string;
    readonly returnHome: string;
    readonly restartBooking: string;
  };
  readonly hold: {
    readonly expired: {
      readonly title: string;
      readonly message: string;
    };
    readonly active: {
      readonly title: string;
      readonly message: string;
      readonly remaining: string;
    };
  };
  readonly payment: {
    readonly failed: {
      readonly title: string;
      readonly message: string;
    };
  };
  readonly form: {
    readonly securePayment: string;
    readonly loading: string;
    readonly iframeTitle: string;
    readonly initiationFailed: string;
    readonly loadFailed: string;
  };
  readonly express: {
    readonly title: string;
    readonly applePay: string;
    readonly googlePay: string;
    readonly pay: string;
    readonly or: string;
  };
  readonly orderSummary: OrderSummaryLabels;
};
