export type InspectorHistoryLabels = {
  readonly title: string;
  readonly description: string;
  readonly search: {
    readonly placeholder: string;
  };
  readonly filter: {
    readonly statusLabel: string;
    readonly allStatuses: string;
    readonly approved: string;
    readonly rejected: string;
    readonly pending: string;
  };
  readonly emptySearch: {
    readonly title: string;
    readonly description: string;
  };
  readonly emptyState: {
    readonly title: string;
    readonly description: string;
  };
  readonly mobileCard: {
    readonly photos: string;
    readonly submittedDate: string;
    readonly submittedFallback: string;
    readonly viewReport: string;
  };
  readonly table: {
    readonly booking: string;
    readonly vehicle: string;
    readonly submittedAt: string;
    readonly photos: string;
    readonly viewDetails: string;
  };
};
