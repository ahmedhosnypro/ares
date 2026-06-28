import type { EditBookingLabels } from "../../../../../types/dashboard/admin/bookings/_id/edit";

const edit: EditBookingLabels = {
  pageTitle: "Edit Booking",
  errors: {
    loadFailed: "Failed to load booking details.",
    notFound: "Booking not found.",
    dateError: "Pickup date must be before return date.",
    returnDateError: "Return date must be after pickup date",
    saveFailed: "Failed to save changes.",
  },
  buttons: {
    cancel: "Cancel",
    saveChanges: "Save Changes",
    backToBookings: "Back to Bookings",
  },
  notices: {
    terminal: "This booking is {status} and its details can no longer be edited.",
    priceCalculation:
      "Total price is recalculated automatically when dates change and confirmed by the server on save.",
  },
  bookingSummary: {
    title: "Booking Summary",
    plate: "Plate: {plate}",
    supplier: "Supplier: {name}",
    customer: "Customer",
    paymentStatus: "Payment Status",
    unpaid: "Unpaid",
    dailyRate: "Daily Rate",
  },
  editableInfo: {
    title: "Editable Booking Information",
    pickupDate: "Pickup Date",
    returnDate: "Return Date",
    pickupLocation: "Pickup Location",
    dropoffLocation: "Dropoff Location",
    bookingStatus: "Booking Status",
  },
  pricingSummary: {
    title: "Pricing Summary",
    dailyRate: "Daily Rate",
    totalDays: "Total Days",
    totalPrice: "Total Price",
    daysValue: "{count} {count, plural, one {day} other {days}}",
  },
};

export default edit;
