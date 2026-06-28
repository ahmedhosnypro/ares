import type { AccountBookingsLabels } from "../../types/customer/account-bookings";

const accountBookings: AccountBookingsLabels = {
  title: "Booking History",
  description: "Track, manage, and review all your car rental reservations in one place.",
  loading: "Loading bookings...",
  error: {
    title: "Unable to load bookings",
    message: "Please try again in a moment.",
  },
  empty: {
    title: "No bookings yet",
    message: "Your booking history will appear here once you make a reservation.",
  },
  filters: {
    title: "Filters",
    status: "Status",
    dateRange: "Date Range",
    startDate: "Start Date",
    endDate: "End Date",
    supplier: "Supplier",
    search: "Search",
    apply: "Apply Filters",
    clear: "Clear Filters",
  },
  activeTrip: {
    title: "Active Trip",
    viewDetails: "View Trip Details",
    extendTrip: "Extend Trip",
    vehicleControls: "Vehicle Controls",
  },
  export: {
    title: "Export Records",
    format: "Format",
    csv: "CSV",
    pdf: "PDF",
    excel: "Excel",
    exportButton: "Export Bookings",
  },
};

export default accountBookings;
