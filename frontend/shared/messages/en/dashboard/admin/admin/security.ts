import type { AdminSecurityLabels } from "../../../../types/dashboard/admin/admin/security";

const security: AdminSecurityLabels = {
  title: "Real-Time Payment Security Monitoring",
  subtitle: "Intrusion detection, live transactions audit, and file integrity checks",
  statsSection: {
    securityScore: "Security Score",
    activeThreats: "Active Threats",
    integrityViolations: "Integrity Violations",
    auditLogsCount: "Logs Recorded (24h)",
  },
  liveFeedSection: {
    title: "Live Transaction Security Feed",
    time: "Time",
    transactionId: "Transaction ID",
    amount: "Amount",
    status: "Security Status",
    action: "Action Taken",
    safe: "Approved",
    flagged: "Flagged / Review",
    blocked: "Blocked",
    liveFeedMonitor: "LIVE FEED MONITOR",
    times: {
      justNow: "Just now",
      oneMinAgo: "1 min ago",
      minsAgo: "{count} mins ago",
    },
    actions: {
      none: "None",
      threeDSecure: "3D-Secure Required",
      ipBlocked: "IP Blocked / Fraud Score 98",
      fraudScoreRejected: "Fraud Score Rejected",
      reviewTriggered: "Review triggered",
    },
  },
  intrusionAlertsSection: {
    title: "Intrusion Detection Alerts",
    noAlerts: "No intrusion alerts detected in the last 30 days",
    alertType: "Alert Type",
    severity: "Severity",
    description: "Description",
    high: "High",
    medium: "Medium",
    low: "Low",
    tableHeaderTimestamp: "Timestamp",
    resolved: "Resolved",
    alerts: {
      xss: {
        time: "23 Jun 2026 14:22",
        type: "XSS Attempt Blocked",
        desc: "Cross-Site Scripting input sanitized on Checkout Page (/checkout/[id])",
      },
      rateLimit: {
        time: "19 Jun 2026 09:12",
        type: "Rate Limit Exceeded",
        desc: "IP address 192.168.1.104 exceeded API call rate limit on Auth sign-in endpoint",
      },
    },
  },
  fileIntegritySection: {
    title: "File Integrity Monitor",
    status: "FIM Status",
    healthy: "Healthy",
    lastChecked: "Last checked: 5 mins ago",
    fileChanges: "File Changes Detected",
    viewDetailsButton: "View Details",
    tableHeaderPath: "Monitored Path",
    tableHeaderHash: "File Hash (SHA-256)",
    tableHeaderModified: "Last Modified",
    unchanged: "Unchanged",
    files: {
      nextConfig: {
        modified: "26 Jun 2026 12:00",
      },
      packageJson: {
        modified: "25 Jun 2026 18:30",
      },
      envProd: {
        modified: "14 Jun 2026 09:15",
      },
    },
  },
};

export default security;
