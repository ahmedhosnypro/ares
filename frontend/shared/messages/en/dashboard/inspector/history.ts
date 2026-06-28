import type { InspectorHistoryLabels } from "../../../types/dashboard/inspector/history";

export const inspectorHistory: InspectorHistoryLabels = {
  title: "Inspection History",
  description: "View all your submitted inspections.",
  search: {
    placeholder: "Search by Booking Number, Vehicle, or Status...",
  },
  filter: {
    statusLabel: "Status",
    allStatuses: "All Statuses",
    approved: "Approved",
    rejected: "Rejected",
    pending: "Pending",
  },
  emptySearch: {
    title: "No results found",
    description: "Try adjusting your search query or status filter.",
  },
  emptyState: {
    title: "No history yet",
    description: "Submitted inspections will appear here.",
  },
  mobileCard: {
    photos: "Photos: {count}",
    submittedDate: "Submitted: {date}",
    submittedFallback: "—",
    viewReport: "View Report",
  },
  table: {
    booking: "Booking",
    vehicle: "Vehicle",
    submittedAt: "Submitted At",
    photos: "Photos",
    viewDetails: "View Details",
  },
};
