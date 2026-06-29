export type BookingDetailsLabels = {
  readonly pageTitle: string;
  readonly lastUpdated: string;
  readonly backToBookingsTooltip: string;
  readonly errors: {
    readonly loadFailed: string;
    readonly deleteFailed: string;
    readonly deleteConfirm: string;
    readonly notFound: string;
  };
  readonly badges: {
    readonly confirmed: string;
    readonly active: string;
    readonly completed: string;
    readonly cancelled: string;
    readonly paymentpending: string;
    readonly pendingapproval: string;
    readonly expired: string;
    readonly approved: string;
    readonly pending: string;
    readonly rejected: string;
    readonly unverified: string;
    readonly available: string;
    readonly maintenance: string;
    readonly rented: string;
    readonly unavailable: string;
    readonly paid: string;
    readonly unpaid: string;
    readonly captured: string;
    readonly refunded: string;
    readonly failed: string;
  };
  readonly buttons: {
    readonly back: string;
    readonly edit: string;
    readonly changeStatus: string;
    readonly delete: string;
    readonly approve: string;
    readonly reject: string;
    readonly refresh: string;
  };
  readonly bookingInfo: {
    readonly title: string;
    readonly subtitle: string;
    readonly number: string;
    readonly status: string;
    readonly totalDays: string;
    readonly daysValue: string;
    readonly pickupDate: string;
    readonly returnDate: string;
    readonly totalAmount: string;
    readonly pickupLocation: string;
    readonly dropoffLocation: string;
    readonly createdDate: string;
    readonly lastUpdated: string;
  };
  readonly customerInfo: {
    readonly title: string;
    readonly subtitle: string;
    readonly email: string;
    readonly phone: string;
    readonly emailVerified: string;
    readonly idVerification: string;
    readonly emptyState: {
      readonly title: string;
      readonly description: string;
    };
  };
  readonly vehicleInfo: {
    readonly title: string;
    readonly subtitle: string;
    readonly make: string;
    readonly model: string;
    readonly year: string;
    readonly licensePlate: string;
    readonly dailyRate: string;
    readonly availability: string;
    readonly supplierHeader: string;
    readonly supplierName: string;
    readonly supplierCompanyName: string;
    readonly supplierEmail: string;
    readonly supplierPhone: string;
  };
  readonly paymentInfo: {
    readonly title: string;
    readonly subtitle: string;
    readonly status: string;
    readonly amount: string;
    readonly currency: string;
    readonly method: string;
    readonly reference: string;
    readonly authCode: string;
    readonly paidDate: string;
    readonly created: string;
    readonly failureReason: string;
    readonly refundHeader: string;
    readonly refundAmount: string;
    readonly refundStatus: string;
    readonly refundMethod: string;
    readonly refundDate: string;
    readonly emptyState: {
      readonly title: string;
      readonly description: string;
    };
  };
  readonly approvalInfo: {
    readonly title: string;
    readonly subtitle: string;
    readonly pendingBanner: string;
    readonly rejectedBanner: string;
    readonly approvedBy: string;
    readonly approvedByAdmin: string;
    readonly approvedAt: string;
    readonly rejectionReason: string;
    readonly rejectButton: string;
    readonly approveButton: string;
  };
  readonly refundDialog: {
    readonly processRefundButton: string;
    readonly title: string;
    readonly loadingPreview: string;
    readonly policy: string;
    readonly percentage: string;
    readonly suggestedRefund: string;
    readonly inputLabel: string;
    readonly maxHelper: string;
    readonly confirmRefundButton: string;
    readonly processingState: string;
  };
  readonly inspection: {
    readonly pickupTitle: string;
    readonly returnTitle: string;
    readonly assignedInspector: string;
    readonly date: string;
    readonly submittedAt: string;
    readonly notSubmitted: string;
    readonly pendingStatus: string;
    readonly condition: string;
    readonly mileage: string;
    readonly fuelLevel: string;
    readonly conditionNotes: string;
    readonly imagesTitle: string;
    readonly emptyState: {
      readonly title: string;
      readonly description: string;
    };
  };
  readonly timeline: {
    readonly title: string;
    readonly subtitle: string;
    readonly emptyState: {
      readonly title: string;
      readonly description: string;
    };
    readonly events: {
      readonly bookingCreated: {
        readonly title: string;
        readonly description: string;
      };
      readonly inspectorAssigned: {
        readonly title: string;
        readonly description: string;
      };
      readonly pickupInspectionCompleted: {
        readonly title: string;
        readonly description: string;
      };
      readonly returnInspectionCompleted: {
        readonly title: string;
        readonly description: string;
      };
      readonly paymentCompleted: {
        readonly title: string;
        readonly description: string;
      };
      readonly bookingCancelled: {
        readonly title: string;
      };
      readonly bookingCompleted: {
        readonly title: string;
      };
      readonly refundProcessed: {
        readonly title: string;
        readonly description: string;
      };
    };
  };
};
