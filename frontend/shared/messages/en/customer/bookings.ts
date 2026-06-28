import type { CustomerBookingsLabels } from "../../types/customer/bookings";

const bookings: CustomerBookingsLabels = {
  title: "My Bookings",
  description: "Track, manage, and review all your car rental reservations in one place.",
  signInRequired: {
    title: "Sign in required",
    message: "Please sign in to view your bookings.",
    signInButton: "Sign In",
  },
  resumeBooking: {
    title: "You have an unfinished booking",
    message: "Continue where you left off with {vehicle}",
    vehicleHeld: "your vehicle is being held.",
    resume: "Continue",
    cancel: "Discard",
  },
  filters: {
    searchPlaceholder: "Search cars or locations...",
    filterByStatus: "Filter by Status:",
    all: "All",
    sortBy: "Sort by:",
    sortOptions: {
      dateDesc: "Date: Newest First",
      dateAsc: "Date: Oldest First",
      priceAsc: "Price: Low to High",
      priceDesc: "Price: High to Low",
      statusAsc: "Status: A to Z",
      statusDesc: "Status: Z to A",
    },
  },
  list: {
    loading: "Loading your bookings...",
    error: "Failed to load bookings. Please try again.",
    firstTripTitle: "Ready for your first trip?",
    firstTripMessage:
      "You haven't made any reservations yet. Browse our premium collection of vehicles and start your journey today.",
    noMatches: "No matches found",
    noMatchesHint: "Try adjusting your filters or searching for something else.",
    retry: "Retry",
    pagination: {
      showing: "Showing",
      of: "of",
      bookings: "bookings",
    },
    empty: {
      title: "No bookings yet",
      message: "Your booking history will appear here once you make a reservation.",
      browse: "Browse Vehicles",
    },
    status: {
      draft: "Draft",
      pending: "Pending",
      confirmed: "Confirmed",
      active: "Active",
      completed: "Completed",
      cancelled: "Cancelled",
    },
    actions: {
      view: "View Details",
      cancel: "Cancel Booking",
      extend: "Extend Trip",
    },
  },
  card: {
    unknownCar: "Unknown Car",
    unknownSupplier: "Unknown Supplier",
    totalLabel: "Total Price",
    carImageAlt: "Car image",
    pickup: "Pick-up",
    dropoff: "Drop-off",
    viewDetails: "View Details",
    details: "Details",
    notAvailable: "N/A",
  },
};

export default bookings;
