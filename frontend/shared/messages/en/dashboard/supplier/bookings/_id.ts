import type { SupplierBookingDetailLabels } from "../../../../../types/dashboard/supplier/bookings/_id";

export const supplierBookingDetail: SupplierBookingDetailLabels = {
  metaTitle: "Booking Details | ARES Supplier",
  metaDescription: "Supplier Booking Details.",
  header: {
    title: "Booking #{ref}",
    statusDraft: "Draft",
    created: "Created {date}",
  },
  errors: {
    notFoundOrDenied: "Booking not found, or you don't have permission to view it.",
    sessionExpired: "Your session has expired. Please sign in again.",
    forbidden: "You don't have permission to view this booking.",
    loadFailedWithStatus: "Failed to load booking details ({status}).",
    loadFailed: "Failed to load booking details.",
    notFound: "Booking not found.",
  },
  backToBookings: "Back to Bookings",
  backToBookingsTooltip: "Back to bookings",
  customerInfo: {
    title: "Customer Information",
    name: "Name",
    email: "Email",
    phone: "Phone",
  },
  vehicleInfo: {
    title: "Vehicle Information",
    plate: "Plate: {plate}",
  },
  bookingInfo: {
    title: "Booking Information",
    pickupDate: "Pickup Date",
    returnDate: "Return Date",
    totalDays: "Total Days",
    daysUnit: "{count} days",
    pickupLocation: "Pickup Location",
    dropoffLocation: "Dropoff Location",
  },
  paymentInfo: {
    title: "Payment Information",
    totalAmount: "Total Amount",
    status: "Status",
    pendingStatus: "Pending",
    method: "Method",
    processedAt: "Processed At",
  },
};
