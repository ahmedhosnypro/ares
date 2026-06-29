import type { BookingPaymentLabels } from "../../types/customer/booking-payment";

const bookingPayment: BookingPaymentLabels = {
  title: "Complete Your Booking",
  subtitle: "Securely process your payment to confirm your reservation.",
  stepper: {
    payment: "Payment",
  },
  error: {
    verificationRequired: {
      title: "Verification Required",
    },
    bookingStatusChanged: {
      title: "Booking Status Changed",
      message: "This booking is no longer in progress. Please check your booking details.",
    },
    vehicleUnavailable: {
      title: "Vehicle Unavailable",
    },
    generic: {
      message: "An unexpected error occurred. Please try again later.",
    },
  },
  actions: {
    viewBooking: "View Booking",
    completeVerification: "Complete Verification",
    returnHome: "Return Home",
    restartBooking: "Restart Booking",
  },
  hold: {
    expired: {
      title: "Reservation Hold Expired",
      message: "The time window to complete your payment has expired. Please start a new booking.",
    },
    active: {
      title: "Reservation Hold Active",
      message: "Complete your payment before the hold expires.",
      remaining: "remaining",
    },
  },
  payment: {
    failed: {
      title: "Payment Failed",
      message: "Your previous payment attempt was unsuccessful. Please try again.",
    },
  },
  form: {
    securePayment: "Secure Payment",
    loading: "Loading secure payment form\u2026",
    iframeTitle: "Secure Payment",
    initiationFailed: "Failed to initiate payment",
    loadFailed: "Failed to load payment form",
  },
  express: {
    title: "Express Checkout",
    applePay: "Apple Pay",
    googlePay: "Google Pay",
    pay: "Pay",
    or: "OR",
  },
  orderSummary: {
    premiumClass: "Premium Class",
    suppliedBy: "Supplied by {supplier}",
    pickup: "Pickup",
    return: "Return",
    price: {
      rental: "{count} {unit} rental",
      day: "day",
      days: "days",
      discount: "Discount",
      discountSavings: "You save {amount}",
      totalAmount: "Total Amount",
    },
  },
  discountCodePlaceholder: "Enter discount code",
  discountCodeApply: "Apply",
  discountCodeApplied: "Discount applied!",
  discountCodeInvalid: "Invalid discount code",
  discountCodeRemove: "Remove",
  discountSavings: "You save {amount}",
  discountCodeLabel: "Discount Code",
};

export default bookingPayment;
