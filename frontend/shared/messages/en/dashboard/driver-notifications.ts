import type { DriverNotificationsLabels } from "../../types/dashboard/driver-notifications";

export const driverNotifications: DriverNotificationsLabels = {
  title: "Driver Notifications",
  description:
    "New ride requests, assignments, approvals, rejections and cancellations — all your driver alerts in one place.",
  fetchError: "Failed to load notifications.",
  markAllError: "Failed to mark all notifications as read.",
  deleteSuccess: "Notification deleted successfully.",
  deleteError: "Failed to delete notification.",
  signInRequired: "Please sign in to view your notifications.",
  unreadCount: "{count} unread",
  markAsReadTooltip: "Mark as read",
  read: "Read",
  deleteTooltip: "Delete",
  loading: "Loading notifications...",
  empty: "You have no notifications yet.",
  markAllAsReadTooltip: "Mark all as read",
};
