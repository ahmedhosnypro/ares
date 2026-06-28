import type { InspectorHistoryLabels } from "../../../types/dashboard/inspector/history";

const history: InspectorHistoryLabels = {
  title: "Inspection History",
  description: "View all your submitted inspections.",
  searchPlaceholder: "Search by Booking Number, Vehicle, or Status...",
  filterStatusLabel: "Status",
  filterAllStatuses: "All Statuses",
  noResults: {
    title: "No results found",
    description: "Try adjusting your search query or status filter.",
  },
  emptyHistory: {
    title: "No history yet",
    description: "Submitted inspections will appear here.",
  },
  mobileCard: {
    photosCount: "Photos: {count}",
    submittedAt: "Submitted: {date}",
    submittedFallback: "—",
    viewReport: "View Report",
  },
  table: {
    booking: "Booking",
    vehicle: "Vehicle",
    submittedAt: "Submitted At",
    photos: "Photos",
    status: "Status",
    action: "Action",
    viewDetails: "View Details",
  },
  status: {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  },
};

export default history;
