export interface DriverNotificationTypeLabels {
  readonly earningReceivedTitle: string;
  readonly earningReceivedMessage: string;
  readonly payoutCompletedTitle: string;
  readonly payoutCompletedMessage: string;
  readonly payoutRejectedTitle: string;
  readonly payoutRejectedMessage: string;
}

export interface DriverNotificationsLabels {
  title: string;
  description: string;
  fetchError: string;
  markAllError: string;
  deleteSuccess: string;
  deleteError: string;
  signInRequired: string;
  unreadCount: string;
  markAsReadTooltip: string;
  read: string;
  deleteTooltip: string;
  loading: string;
  empty: string;
  markAllAsReadTooltip: string;
  types: DriverNotificationTypeLabels;
}
