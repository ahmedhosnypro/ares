import type { CreateBookingLabels } from "../../../../types/dashboard/admin/bookings/create";

const createBooking: CreateBookingLabels = {
  title: "Create Booking",
  subtitle: "Set up a new reservation for a customer.",
  buttons: {
    create: "Create Booking",
  },
  steps: {
    customer: {
      title: "Customer",
      subtitle: "Search and pick the customer for this booking",
      label: "Customer",
      placeholder: "Search by name, email, or phone…",
      minCharacters: "Type at least 3 characters to search customers.",
      noOptions: "No customers found.",
      unnamed: "Unnamed customer",
      noEmail: "no email",
      noPhone: "no phone",
    },
    info: {
      title: "Booking Information",
      subtitle: "Dates and pickup / dropoff details",
      pickupDate: "Pickup Date",
      returnDate: "Return Date",
      pickupLocation: "Pickup Location",
      dropoffLocation: "Dropoff Location",
      pickupLocationPlaceholder: "Search pickup location…",
      dropoffLocationPlaceholder: "Search dropoff location…",
      noLocations: "No locations found.",
      returnDateError: "Return date must be after pickup date",
    },
    vehicle: {
      title: "Vehicle",
      subtitleActive: "Only available vehicles are shown for the selected dates and location",
      subtitleInactive: "Select a pickup location first to browse available vehicles",
      label: "Vehicle",
      placeholder: "Search by make, model, or plate…",
      noLocationSelected: "Please select a pickup location first.",
      noVehiclesFound: "No available vehicles found for the selected location and dates.",
      unnamed: "Unnamed",
      noPlate: "No plate",
      dailyRate: "{rate}/day",
      change: "Change",
    },
    payment: {
      title: "Payment Method",
      subtitle: "Choose how the customer will pay for this booking",
      cash: {
        title: "Cash Payment",
        description: "Booking confirmed immediately. Customer pays in cash upon rental.",
      },
      online: {
        title: "Online Payment",
        description: "Redirect to online checkout. Holds vehicle for 10 minutes until paid.",
      },
    },
  },
  summary: {
    title: "Pricing Summary",
    dailyRate: "Daily Rate",
    totalDays: "Total Days",
    totalDaysPlural: "{count} {count, plural, one {day} other {days}}",
    totalPrice: "Total Price",
    noticeLive: "Pricing updates live as you change vehicle and dates.",
    noticeConfirm: "The server confirms the final amount on save.",
    noticeFlow:
      "Payment is collected through a separate flow — creating a booking does not require completing payment.",
  },
};

export default createBooking;
