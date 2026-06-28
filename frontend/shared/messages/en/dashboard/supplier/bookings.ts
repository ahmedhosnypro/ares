import type { SupplierBookingsLabels } from "../../types/dashboard/supplier/bookings";

export const supplierBookings: SupplierBookingsLabels = {
  metaTitle: "Bookings | ARES Supplier",
  metaDescription: "Supplier Bookings list.",
  title: "Bookings",
  subtitle: "Monitor and manage all bookings for your vehicles",
  search: {
    placeholder: "Search by ID, customer, or vehicle…",
  },
  filters: {
    bookingStatus: "Booking Status",
    paymentStatus: "Payment Status",
    allStatuses: "All Statuses",
    bookingStatusOptions: {
      draft: "Draft",
      paymentPending: "Payment Pending",
      confirmed: "Confirmed",
      active: "Active",
      completed: "Completed",
      cancelled: "Cancelled",
    },
    paymentStatusOptions: {
      pending: "Pending",
      authorized: "Authorized",
      captured: "Captured",
      failed: "Failed",
      refunded: "Refunded",
    },
  },
  statusLabels: {
    completed: "Completed",
    cancelled: "Cancelled",
    draft: "Draft",
    paymentPending: "PaymentPending",
  },
  table: {
    customer: "Customer",
    vehicle: "Vehicle",
    period: "Period",
    payment: "Payment",
    total: "Total",
    created: "Created",
  },
  empty: {
    title: "No bookings found",
    description: "Try adjusting your filters.",
  },
  customerDefault: "Unknown Customer",
  paymentDefault: "Pending",
  footer: {
    showingPage: "Showing page {page} of {totalPages} ({totalCount} total)",
  },
  actions: {
    viewDetails: "View Details",
  },
};
