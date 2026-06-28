import type { AdminVehiclesMgmtLabels } from "../../../../types/dashboard/admin/admin/vehicles";

const vehicles: AdminVehiclesMgmtLabels = {
  title: "Fleet Inventory Management",
  subtitle: "Monitor operational status, view performance metrics, and perform bulk operations on the vehicle fleet.",
  stats: {
    totalAssets: "Total Fleet Assets",
    available: "Available Vehicles",
    inMaintenance: "Under Maintenance",
    outOfService: "Out of Service",
  },
  actions: {
    editStatus: "Update Status",
    statusHistory: "View History",
    importCsv: "Import CSV",
    exportData: "Export Fleet",
    bulkAction: "Bulk Action",
  },
  table: {
    vehicle: "Vehicle Info",
    category: "Category",
    location: "Location",
    status: "Status",
    action: "Actions",
    empty: "No vehicles found in fleet.",
    searchPlaceholder: "Search by plate or name...",
    allStatuses: "All Statuses",
    allCategories: "All Categories",
  },
  statusDialog: {
    title: "Update Operational Status",
    selectStatus: "Select Status",
    reason: "Reason for status change",
    expectedReturn: "Expected Return Date",
    cancel: "Cancel",
    save: "Save Changes",
    successAlert: "Vehicle status updated successfully.",
  },
  historyDialog: {
    title: "Vehicle Status History",
    date: "Change Date",
    statusChange: "Status Transition",
    reason: "Reason",
    user: "Action By",
    close: "Close",
    empty: "No status changes recorded.",
  },
  bulkDialog: {
    title: "Perform Bulk Operation",
    selectAction: "Select Action",
    updatePricing: "Update Pricing Metrics",
    changeStatus: "Change Status of Selected",
    assignLocation: "Re-assign to Location",
    updateAvailability: "Set Availability Status",
    apply: "Apply to Selected",
    cancel: "Cancel",
    successAlert: "Bulk operation applied successfully to {count} vehicles.",
    affectingCount: "Currently affecting {count} selected vehicles.",
    changeStatusMaintenance: "Change Status of Selected (→ Maintenance)",
  },
  statuses: {
    active: "Active",
    maintenance: "Maintenance",
    outOfService: "Out of Service",
  },
  alerts: {
    importSuccess: "Fleet imported successfully from CSV.",
    exportSuccess: "Fleet inventory downloaded successfully.",
  },
};

export default vehicles;
