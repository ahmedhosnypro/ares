import type { AdminSchedulerLabels } from "../../../types/dashboard/admin/scheduler";

const scheduler: AdminSchedulerLabels = {
  title: "Admin — Scheduler",
  subtitle: "Manage and schedule delivery trips for pending bookings",
  scheduleTripBtn: "Schedule Trip",
  autoAssignBtn: "Auto Assign Drivers",
  exportScheduleBtn: "Export Schedule",
  table: {
    booking: "Booking",
    customer: "Customer",
    vehicle: "Vehicle",
    tripDate: "Trip Date",
    status: "Status",
    driver: "Driver",
    actions: "Actions",
    empty: "No pending bookings need scheduling today.",
    noDriver: "No driver assigned",
  },
  assignModal: {
    title: "Assign Driver",
    description: "Select a professional driver for this trip",
    selectDriverPlaceholder: "Select Driver",
    tripDateLabel: "Trip Date (Default: Today)",
    cancel: "Cancel",
    confirm: "Confirm Schedule",
  },
  status: {
    pending: "Pending",
    scheduled: "Scheduled",
    inProgress: "In Progress",
    completed: "Completed",
  },
  alerts: {
    scheduleSuccess: "Trip scheduled successfully",
    scheduleError: "Failed to schedule trip",
    autoAssignStart: "Auto-assignment initiated",
    autoAssignSuccess: "Auto-assignment completed successfully",
    autoAssignError: "Failed auto-assignment",
  },
};

export default scheduler;
