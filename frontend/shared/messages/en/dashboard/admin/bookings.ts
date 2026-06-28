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
      confirmed: "Confirmed",
      active: "Active",
      completed: "Completed",
      cancelled: "Cancelled",
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
  },
  changeStatusModal: {
    title: "Change Booking Status",
    currentLabel: "Current:",
    newStatusLabel: "New status",
    statuses: {
      paymentPending: "Payment Pending",
      confirmed: "Confirmed",
      active: "Active",
      completed: "Completed",
      cancelled: "Cancelled",
    },
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
      confirmed: "Confirmed",
      active: "Active",
      completed: "Completed",
      cancelled: "Cancelled",
      cancelledByAdmin: "Cancelled By Admin",
    },
  },
};

export default bookings;
