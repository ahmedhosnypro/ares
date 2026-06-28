export type DriverSelectionLabels = {
  readonly title: string;
  readonly subtitle: string;
  readonly stepper: {
    readonly step1: string;
    readonly step2: string;
    readonly step3: string;
    readonly step4: string;
  };
  readonly licenseRequired: string;
  readonly error: string;
  readonly errorSaveSelection: string;
  readonly errorChangeMode: string;
  readonly intentLost: {
    readonly goBack: string;
    readonly message: string;
  };
  readonly modes: {
    readonly selfDrive: {
      readonly title: string;
      readonly description: string;
    };
    readonly withDriver: {
      readonly title: string;
      readonly description: string;
    };
  };
  readonly drivers: {
    readonly title: string;
    readonly unavailable: string;
    readonly noDrivers: string;
    readonly noDriversMessage: string;
    readonly experience: string;
    readonly driverFee: string;
    readonly selected: string;
    readonly unselect: string;
    readonly trips: string;
    readonly newDriver: string;
  };
  readonly actions: {
    readonly back: string;
    readonly continue: string;
    readonly continuePayment: string;
  };
};
