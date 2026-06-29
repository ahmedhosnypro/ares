import type { InspectorInspectionsLabels } from "../../../types/dashboard/inspector/inspections";

const inspections: InspectorInspectionsLabels = {
  title: "Inspector Dashboard",
  description: "Overview of your assignments and today's metrics.",
  checkOuts: "Check-Outs",
  checkOutsSubtitle: "Deliveries today",
  checkIns: "Check-Ins",
  checkInsSubtitle: "Returns today",
  overdue: "Overdue Tasks",
  overdueSubtitle: "Past due",
  completedToday: "Completed Today",
  completedTodaySubtitle: "Done today",
  sectionTitle: "Today's Tasks",
  sectionSubtitle: "Tap a card to open the inspection form · Use the action buttons to call or navigate.",
  filters: {
    all: "All",
    checkOuts: "Check-Outs 🟢",
    checkIns: "Check-Ins 🔴",
  },
  searchPlaceholder: "Search by plate number…",
  searchAriaLabel: "Search by plate number",
  emptyState: {
    noMatchingTasks: "No matching tasks",
    allCaughtUp: "All caught up!",
    adjustFilter: "Try adjusting the filter or search term.",
    noPendingTasks: "You have no pending tasks for today.",
  },
  card: {
    checkOutBadge: "Check-Out 🟢",
    checkInBadge: "Check-In 🔴",
    callTooltip: "Call {customerName}",
    callAriaLabel: "Call {customerName}",
    mapsTooltip: "Open in Google Maps",
    mapsAriaLabel: "Open location in Google Maps",
  },
  status: {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  },
};

export default inspections;
