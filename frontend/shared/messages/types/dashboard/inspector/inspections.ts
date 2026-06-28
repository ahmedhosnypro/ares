export interface InspectorInspectionsLabels {
  page: {
    title: string;
    subtitle: string;
    todayTasksTitle: string;
    todayTasksSubtitle: string;
  };
  stats: {
    checkOuts: string;
    checkOutsSubtitle: string;
    checkIns: string;
    checkInsSubtitle: string;
    overdueTasks: string;
    overdueTasksSubtitle: string;
    completedToday: string;
    completedTodaySubtitle: string;
  };
  statusBadge: {
    pending: string;
    approved: string;
    rejected: string;
  };
  taskCard: {
    checkOut: string;
    checkIn: string;
    callCustomer: string;
    openInMaps: string;
    openInMapsAriaLabel: string;
  };
  tasksList: {
    filterAll: string;
    filterCheckOuts: string;
    filterCheckIns: string;
    searchPlaceholder: string;
    searchAriaLabel: string;
  };
  emptyState: {
    noMatchingTasks: string;
    tryAdjusting: string;
    allCaughtUp: string;
    noPendingTasks: string;
  };
}
