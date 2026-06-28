import type { DriverNotificationsLabels } from "../../types/dashboard/driver-notifications";

export const driverNotifications: DriverNotificationsLabels = {
  title: "Driver Notifications",
  description:
    "New ride requests, assignments, approvals, rejections, earnings and payouts — all your driver alerts in one place.",
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
  types: {
    earningReceivedTitle: "Earning Received",
    earningReceivedMessage: "A new earning has been credited to your account.",
    payoutCompletedTitle: "Payout Completed",
    payoutCompletedMessage: "Your payout has been processed successfully.",
    payoutRejectedTitle: "Payout Rejected",
    payoutRejectedMessage: "Your payout request was rejected. Please review the details.",
  },
};
