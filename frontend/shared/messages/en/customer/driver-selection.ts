import type { DriverSelectionLabels } from "../../types/customer/driver-selection";

const driverSelection: DriverSelectionLabels = {
  title: "Choose your driving mode",
  subtitle: "{vehicleLabel} · {pickupDate} to {returnDate}",
  stepper: {
    step1: "Vehicle",
    step2: "Driver",
    step3: "Payment",
    step4: "Confirmation",
  },
  licenseRequired:
    "You don't have an approved driving license on file, so a driver is required for this booking. You can add a license from your profile to unlock self-drive.",
  error: "We couldn't load drivers right now. Please try again.",
  errorSaveSelection: "Failed to save your selection. Please try again.",
  errorChangeMode: "Failed to change mode. Please try again.",
  intentLost: {
    goBack: "Go Back",
    message:
      "We could not find your booking details. Your session may have expired or the vehicle is no longer available.",
  },
  modes: {
    selfDrive: {
      title: "Self Drive",
      description: "Drive the vehicle yourself. Requires a verified driving license.",
    },
    withDriver: {
      title: "Request a Driver",
      description: "Pick a verified driver to drive for you. A driver fee applies.",
    },
  },
  drivers: {
    title: "Available drivers",
    unavailable: "{count} others in this area are currently busy or unavailable",
    noDrivers: "No drivers available",
    noDriversMessage:
      "No verified drivers are available for these dates right now. Please try different dates or check back later.",
    experience: "Experience",
    driverFee: "Driver fee",
    selected: "SELECTED",
    unselect: "Tap again to unselect",
    trips: "trips",
    newDriver: "New",
  },
  actions: {
    back: "Back",
    continue: "Continue",
    continuePayment: "Continue to payment",
  },
};

export default driverSelection;
