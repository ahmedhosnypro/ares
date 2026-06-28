export type BookingDetailLabels = {
  readonly title: string;
  readonly metaTitle: string;
  readonly metaTitleWithCar: string;
  readonly metaDescription: string;
  readonly signInRequired: {
    readonly title: string;
    readonly message: string;
    readonly signInButton: string;
  };
  readonly error: {
    readonly notFound: {
      readonly title: string;
      readonly message: string;
    };
    readonly accessDenied: {
      readonly title: string;
      readonly message: string;
    };
    readonly sessionExpired: {
      readonly title: string;
      readonly message: string;
    };
    readonly generic: {
      readonly title: string;
      readonly message: string;
    };
  };
  readonly details: {
    readonly title: string;
    readonly status: string;
    readonly dates: string;
    readonly vehicle: string;
    readonly pickup: string;
    readonly dropoff: string;
    readonly price: string;
    readonly driver: string;
    readonly addons: string;
  };
  readonly actions: {
    readonly cancel: string;
    readonly cancelConfirm: string;
    readonly cancelSuccess: string;
    readonly cancelError: string;
    readonly extend: string;
    readonly vehicleControls: string;
  };
  readonly overview: {
    readonly title: string;
    readonly refId: string;
    readonly backToBookings: string;
  };
  readonly car: {
    readonly bookedCarAlt: string;
    readonly unknownCar: string;
    readonly supplier: string;
    readonly payLater: string;
    readonly prepaid: string;
  };
  readonly location: {
    readonly pickup: string;
    readonly dropoff: string;
  };
  readonly driverInfo: {
    readonly title: string;
    readonly noEmailAvailable: string;
    readonly noDriver: string;
  };
  readonly inspection: {
    readonly title: string;
    readonly assignedInspector: string;
    readonly noInspectorAssigned: string;
    readonly preDelivery: string;
    readonly postReturn: string;
    readonly dateLabel: string;
    readonly approved: string;
    readonly pending: string;
    readonly rejected: string;
    readonly notRequired: string;
  };
  readonly summary: {
    readonly title: string;
    readonly vehicle: string;
    readonly duration: string;
    readonly days: string;
    readonly totalPrice: string;
    readonly viewAllBookings: string;
  };
  readonly cancelBooking: {
    readonly cancellationUnavailable: string;
    readonly cancelBooking: string;
    readonly cancelButtonTitle: string;
    readonly calculatingRefund: string;
    readonly refundPreviewError: string;
    readonly refundPolicy: string;
    readonly refundPercentage: string;
    readonly cancellationFee: string;
    readonly youWillReceive: string;
    readonly confirmQuestion: string;
    readonly cannotBeUndone: string;
    readonly keepBooking: string;
    readonly cancelling: string;
    readonly confirmCancel: string;
  };
  readonly review: {
    readonly title: string;
    readonly rating: string;
    readonly commentOptional: string;
    readonly cancel: string;
    readonly submitting: string;
    readonly saving: string;
    readonly submitReview: string;
    readonly saveChanges: string;
    readonly editableUntil: string;
    readonly editWindowPassed: string;
    readonly noFeedback: string;
    readonly editReview: string;
    readonly emptyPrompt: string;
    readonly writeReview: string;
    readonly validationPickRating: string;
    readonly errorBadRequest: string;
    readonly errorConflict: string;
    readonly errorGeneric: string;
    readonly errorLoadReview: string;
    readonly successUpdated: string;
    readonly successSubmitted: string;
  };
  readonly driverSelection: {
    readonly assignedDriver: string;
    readonly trips: string;
    readonly changeDriver: string;
    readonly changeDriverTitle: string;
    readonly changeDriverDescription: string;
    readonly reasonOptional: string;
    readonly cancel: string;
    readonly confirmChange: string;
    readonly selectDriverTitle: string;
    readonly searchingDrivers: string;
    readonly selectDriver: string;
    readonly changeReasonDefault: string;
    readonly errorLoadDrivers: string;
    readonly errorSelectDriver: string;
    readonly errorChangeDriver: string;
  };
  readonly feedback: {
    readonly cancelled: string;
    readonly notEligible: string;
    readonly forbidden: string;
    readonly notFound: string;
    readonly invalidBooking: string;
    readonly cancelFailed: string;
  };
  readonly notAvailable: string;
};
