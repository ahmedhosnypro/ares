export type InspectorInspectionsLabels = {
  readonly title: string;
  readonly description: string;
  readonly checkOuts: string;
  readonly checkOutsSubtitle: string;
  readonly checkIns: string;
  readonly checkInsSubtitle: string;
  readonly overdue: string;
  readonly overdueSubtitle: string;
  readonly completedToday: string;
  readonly completedTodaySubtitle: string;
  readonly sectionTitle: string;
  readonly sectionSubtitle: string;
  readonly filters: {
    readonly all: string;
    readonly checkOuts: string;
    readonly checkIns: string;
  };
  readonly searchPlaceholder: string;
  readonly searchAriaLabel: string;
  readonly emptyState: {
    readonly noMatchingTasks: string;
    readonly allCaughtUp: string;
    readonly adjustFilter: string;
    readonly noPendingTasks: string;
  };
  readonly card: {
    readonly checkOutBadge: string;
    readonly checkInBadge: string;
    readonly callTooltip: string;
    readonly callAriaLabel: string;
    readonly mapsTooltip: string;
    readonly mapsAriaLabel: string;
  };
  readonly status: {
    readonly pending: string;
    readonly approved: string;
    readonly rejected: string;
  };
};
