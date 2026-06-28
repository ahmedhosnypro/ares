export type AdminSchedulerLabels = {
  readonly title: string;
  readonly subtitle: string;
  readonly scheduleTripBtn: string;
  readonly autoAssignBtn: string;
  readonly exportScheduleBtn: string;
  readonly table: {
    readonly booking: string;
    readonly customer: string;
    readonly vehicle: string;
    readonly tripDate: string;
    readonly status: string;
    readonly driver: string;
    readonly actions: string;
    readonly empty: string;
    readonly noDriver: string;
  };
  readonly assignModal: {
    readonly title: string;
    readonly description: string;
    readonly selectDriverPlaceholder: string;
    readonly tripDateLabel: string;
    readonly cancel: string;
    readonly confirm: string;
  };
  readonly status: {
    readonly pending: string;
    readonly scheduled: string;
    readonly inProgress: string;
    readonly completed: string;
  };
  readonly alerts: {
    readonly scheduleSuccess: string;
    readonly scheduleError: string;
    readonly autoAssignStart: string;
    readonly autoAssignSuccess: string;
    readonly autoAssignError: string;
  };
};
