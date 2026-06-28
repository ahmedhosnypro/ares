export type AdminSecurityLabels = {
  readonly title: string;
  readonly subtitle: string;
  readonly statsSection: {
    readonly securityScore: string;
    readonly activeThreats: string;
    readonly integrityViolations: string;
    readonly auditLogsCount: string;
  };
  readonly liveFeedSection: {
    readonly title: string;
    readonly time: string;
    readonly transactionId: string;
    readonly amount: string;
    readonly status: string;
    readonly action: string;
    readonly safe: string;
    readonly flagged: string;
    readonly blocked: string;
    readonly liveFeedMonitor: string;
    readonly times: {
      readonly justNow: string;
      readonly oneMinAgo: string;
      readonly minsAgo: string;
    };
    readonly actions: {
      readonly none: string;
      readonly threeDSecure: string;
      readonly ipBlocked: string;
      readonly fraudScoreRejected: string;
      readonly reviewTriggered: string;
    };
  };
  readonly intrusionAlertsSection: {
    readonly title: string;
    readonly noAlerts: string;
    readonly alertType: string;
    readonly severity: string;
    readonly description: string;
    readonly high: string;
    readonly medium: string;
    readonly low: string;
    readonly tableHeaderTimestamp: string;
    readonly resolved: string;
    readonly alerts: {
      readonly xss: {
        readonly time: string;
        readonly type: string;
        readonly desc: string;
      };
      readonly rateLimit: {
        readonly time: string;
        readonly type: string;
        readonly desc: string;
      };
    };
  };
  readonly fileIntegritySection: {
    readonly title: string;
    readonly status: string;
    readonly healthy: string;
    readonly lastChecked: string;
    readonly fileChanges: string;
    readonly viewDetailsButton: string;
    readonly tableHeaderPath: string;
    readonly tableHeaderHash: string;
    readonly tableHeaderModified: string;
    readonly unchanged: string;
    readonly files: {
      readonly nextConfig: {
        readonly modified: string;
      };
      readonly packageJson: {
        readonly modified: string;
      };
      readonly envProd: {
        readonly modified: string;
      };
    };
  };
};
