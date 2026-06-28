export type InspectorHistoryLabels = {
  readonly title: string;
  readonly description: string;
  readonly searchPlaceholder: string;
  readonly filterStatusLabel: string;
  readonly filterAllStatuses: string;
  readonly noResults: {
    readonly title: string;
    readonly description: string;
  };
  readonly emptyHistory: {
    readonly title: string;
    readonly description: string;
  };
  readonly mobileCard: {
    readonly photosCount: string;
    readonly submittedAt: string;
    readonly submittedFallback: string;
    readonly viewReport: string;
  };
  readonly table: {
    readonly booking: string;
    readonly vehicle: string;
    readonly submittedAt: string;
    readonly photos: string;
    readonly status: string;
    readonly action: string;
    readonly viewDetails: string;
  };
  readonly status: {
    readonly pending: string;
    readonly approved: string;
    readonly rejected: string;
  };
};
