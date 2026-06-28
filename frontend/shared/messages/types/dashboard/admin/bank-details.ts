export type BankDetailsLabels = {
  readonly title: string;
  readonly subtitle: string;
  readonly form: {
    readonly sectionTitle: string;
    readonly bankName: string;
    readonly accountHolder: string;
    readonly iban: string;
    readonly swiftBic: string;
    readonly accountNumber: string;
    readonly routingNumber: string;
    readonly notes: string;
    readonly saveButton: string;
    readonly saving: string;
    readonly reset: string;
  };
  readonly preview: {
    readonly title: string;
    readonly description: string;
    readonly paymentMethod: string;
    readonly instruction: string;
    readonly importantNotes: string;
  };
  readonly alerts: {
    readonly success: string;
    readonly error: string;
    readonly loading: string;
    readonly reset: string;
  };
  readonly validation: {
    readonly required: string;
    readonly invalidIban: string;
    readonly invalidSwift: string;
  };
};
