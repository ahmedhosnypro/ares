import type { InspectorInspectionsLabels } from "../../types/dashboard/inspector/inspections";

export const inspectorInspections: InspectorInspectionsLabels = {
  page: {
    title: "Inspector Dashboard",
    subtitle: "Overview of your assignments and today\u2019s metrics.",
    todayTasksTitle: "Today\u2019s Tasks",
    todayTasksSubtitle: "Tap a card to open the inspection form \u00b7 Use the action buttons to call or navigate.",
  },
  stats: {
    checkOuts: "Check-Outs",
    checkOutsSubtitle: "Deliveries today",
    checkIns: "Check-Ins",
    checkInsSubtitle: "Returns today",
    overdueTasks: "Overdue Tasks",
    overdueTasksSubtitle: "Past due",
    completedToday: "Completed Today",
    completedTodaySubtitle: "Done today",
  },
  statusBadge: {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  },
  taskCard: {
    checkOut: "Check-Out \ud83d\udfe2",
    checkIn: "Check-In \ud83d\udd34",
    callCustomer: "Call {customerName}",
    openInMaps: "Open in Google Maps",
    openInMapsAriaLabel: "Open location in Google Maps",
  },
  tasksList: {
    filterAll: "All",
    filterCheckOuts: "Check-Outs \ud83d\udfe2",
    filterCheckIns: "Check-Ins \ud83d\udd34",
    searchPlaceholder: "Search by plate number\u2026",
    searchAriaLabel: "Search by plate number",
  },
  emptyState: {
    noMatchingTasks: "No matching tasks",
    tryAdjusting: "Try adjusting the filter or search term.",
    allCaughtUp: "All caught up!",
    noPendingTasks: "You have no pending tasks for today.",
  },
};
