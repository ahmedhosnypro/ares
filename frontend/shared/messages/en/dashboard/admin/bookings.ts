import type { AdminBookingsLabels } from "../../../types/dashboard/admin/bookings";

const bookings: AdminBookingsLabels = {
  title: "Bookings Management",
  subtitle: "Monitor and manage all ARES reservations",
  newBooking: "New Booking",
  alerts: {
    createdSuccess: "Booking {bookingNumber} created and pending customer payment.",
    deleteSuccess: "Booking deleted successfully.",
    deleteError: "Failed to delete booking.",
    changeStatusSuccess: "Booking status changed successfully.",
    changeStatusError: "Failed to change status. Please try again.",
  },
  table: {
    daysCount: "{count} {count, plural, one {Day} other {Days}}",
    fallbacks: {
      unknownCustomer: "Unknown Customer",
      unknownVehicle: "Unknown Vehicle",
      noPlate: "No Plate",
      noPaymentMethod: "None",
      currencySymbol: "SAR ",
    },
    headers: {
      booking: "Booking",
      vehicle: "Vehicle",
      supplier: "Supplier",
      period: "Period",
      status: "Status",
      paymentMethod: "Payment Method",
      paymentStatus: "Payment Status",
      total: "Total",
    },
    pagination: {
      showingPage: "Showing page <strong/> of {totalPages} ({totalCount} total)",
    },
    empty: {
      title: "No bookings found",
      description: "Try adjusting your filters or create a new booking.",
    },
  },
  filters: {
    searchPlaceholder: "Search by ID, customer, or vehicle…",
    dateFrom: "From",
    dateTo: "To",
    statuses: {
      all: "All Statuses",
      draft: "Draft",
      paymentPending: "Payment Pending",
      pendingApproval: "Pending Approval",
      confirmed: "Confirmed",
      active: "Active",
      completed: "Completed",
      cancelled: "Cancelled",
      rejected: "Rejected",
    },
  },
  paymentStatuses: {
    captured: "Captured",
    refunded: "Refunded",
    failed: "Failed",
    pending: "Pending",
    unpaid: "Unpaid",
  },
  deleteDialog: {
    title: "Delete Booking",
    content: "Are you sure you want to delete this booking?",
    subcontent: "This action cannot be undone.",
  },
  menu: {
    viewDetails: "View Details",
    editBooking: "Edit Booking",
    changeStatus: "Change Status",
    deleteBooking: "Delete Booking",
    approveBooking: "Approve",
    rejectBooking: "Reject",
  },
  changeStatusModal: {
    title: "Change Booking Status",
    currentLabel: "Current:",
    newStatusLabel: "New status",
    statuses: {
      paymentPending: "Payment Pending",
      pendingApproval: "Pending Approval",
      confirmed: "Confirmed",
      active: "Active",
      completed: "Completed",
      cancelled: "Cancelled",
      rejected: "Rejected",
    },
  },
  approvals: {
    approveDialog: {
      title: "Approve Booking",
      content:
        "Are you sure you want to approve this booking? The customer will be notified and the booking will become confirmed.",
    },
    rejectDialog: {
      title: "Reject Booking",
      content:
        "Are you sure you want to reject this booking? The payment will be refunded and the customer will be notified.",
      reasonLabel: "Rejection Reason",
      reasonPlaceholder: "Provide a reason for rejecting this booking…",
    },
    approvedSuccess: "Booking approved successfully.",
    rejectedSuccess: "Booking rejected successfully.",
    approveError: "Failed to approve booking. Please try again.",
    rejectError: "Failed to reject booking. Please try again.",
  },
  overview: {
    title: "Booking Overview",
    total: "Total",
    noBookings: "No bookings found.",
    loadFailed: "Failed to load booking statistics.",
    fallbackStatus: "Other",
  },
  analytics: {
    title: "Booking Status Distribution",
    total: "Total",
    chartTooltip: "Bookings",
    kpis: {
      activeBookings: "Active Bookings",
      pickupQueue: "Pickup Queue",
      returnQueue: "Return Queue",
      upcomingPickups: "Upcoming Pickups",
    },
    statuses: {
      draft: "Draft",
      paymentPending: "Payment Pending",
      pendingApproval: "Pending Approval",
      confirmed: "Confirmed",
      active: "Active",
      completed: "Completed",
      cancelled: "Cancelled",
      cancelledByAdmin: "Cancelled By Admin",
      rejected: "Rejected",
    },
  },
};

export default bookings;
