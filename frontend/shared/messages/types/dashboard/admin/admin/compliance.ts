export type AdminComplianceLabels = {
  readonly title: string;
  readonly subtitle: string;
  readonly statusSection: {
    readonly overallStatus: string;
    readonly compliant: string;
    readonly nonCompliant: string;
    readonly score: string;
    readonly lastAssessment: string;
  };
  readonly saqSection: {
    readonly title: string;
    readonly progress: string;
    readonly questionsRemaining: string;
    readonly continueButton: string;
    readonly tabTitle: string;
    readonly requirementSubtitle: string;
    readonly inProgress: string;
    readonly tableHeaderId: string;
    readonly tableHeaderDescription: string;
    readonly req3_1: {
      readonly desc: string;
    };
    readonly req3_4: {
      readonly desc: string;
    };
    readonly req4_1: {
      readonly desc: string;
    };
    readonly req6_2: {
      readonly desc: string;
    };
  };
  readonly scansSection: {
    readonly title: string;
    readonly lastScan: string;
    readonly passed: string;
    readonly failed: string;
    readonly findings: string;
    readonly highSeverity: string;
    readonly mediumSeverity: string;
    readonly lowSeverity: string;
    readonly runScanButton: string;
    readonly scanSuccessAlert: string;
    readonly recentLogsTitle: string;
    readonly refreshButton: string;
    readonly tableHeaderDate: string;
    readonly tableHeaderTarget: string;
    readonly log1: {
      readonly date: string;
      readonly target: string;
      readonly findings: string;
    };
    readonly log2: {
      readonly date: string;
      readonly target: string;
      readonly findings: string;
    };
    readonly log3: {
      readonly date: string;
      readonly target: string;
      readonly findings: string;
    };
    readonly scanningBackdropText: string;
  };
  readonly penTestSection: {
    readonly title: string;
    readonly lastTest: string;
    readonly status: string;
    readonly active: string;
    readonly scheduleButton: string;
  };
  readonly reportsSection: {
    readonly title: string;
    readonly generateButton: string;
    readonly downloadRoC: string;
    readonly downloadAoC: string;
    readonly generatedReportsTitle: string;
    readonly rocDescription: string;
    readonly aocDescription: string;
    readonly downloadPdfButton: string;
  };
};
