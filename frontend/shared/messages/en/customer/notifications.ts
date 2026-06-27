import type { CustomerNotificationsLabels } from "../../types/customer/notifications";

const notifications: CustomerNotificationsLabels = {
  metaTitle: "My Notifications | ARES Car Rental",
  metaDescription: "Stay updated with your latest booking status, offers, and system alerts in one place.",
  title: "Notifications",
  signInRequired: "Please sign in to view your notifications.",
  loading: "Loading your notifications...",
  empty: "You're all caught up. No notifications yet.",
  unreadCount: "{count} Unread",
  read: "Read",
  markAsReadTooltip: "Mark as read",
  deleteTooltip: "Delete",
  markAllAsReadTooltip: "Mark all as read",
  fetchError: "Failed to load notifications. Please try again later.",
  markAllError: "Failed to mark all as read.",
  deleteSuccess: "Notification deleted successfully.",
  deleteError: "Failed to delete notification. Please try again.",
};

export default notifications;
