import type { AdminDriversLabels } from "../../../types/dashboard/admin/drivers";

const drivers: AdminDriversLabels = {
  title: "Driver Management",
  subtitle: "Review driver documents, verify, approve or reject applications, and enable or disable accounts.",
  tabs: {
    allDrivers: "All Drivers",
    pendingVerification: "Pending Verification",
  },
  searchPlaceholder: "Search by name, email or phone",
  status: "Status",
  errorLoad: "Could not load drivers.",
  noDrivers: "No drivers found",
  filters: {
    reset: "Reset",
  },
  table: {
    driver: "Driver",
    email: "Email",
    status: "Status",
    availability: "Availability",
    rating: "Rating",
    active: "Active",
    actions: "Actions",
    view: "View",
    viewLicense: "View License",
    verifyStatus: "Verify Status",
    toggleStatus: "Toggle Status",
    activeStatus: "Active",
    disabledStatus: "Disabled",
  },
  statuses: {
    all: "All",
    incomplete: "Incomplete",
    pendingVerification: "Pending Verification",
    verified: "Verified",
    rejected: "Rejected",
    suspended: "Suspended",
  },
};

export default drivers;
