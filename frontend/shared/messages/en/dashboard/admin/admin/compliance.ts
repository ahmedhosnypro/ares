import type { AdminComplianceLabels } from "../../../../types/dashboard/admin/admin/compliance";

const compliance: AdminComplianceLabels = {
  title: "PCI DSS Compliance Center",
  subtitle: "Manage security assessments, vulnerability scans, and audit reports",
  statusSection: {
    overallStatus: "Overall Compliance Status",
    compliant: "Compliant",
    nonCompliant: "Non-Compliant",
    score: "Compliance Score",
    lastAssessment: "Last Assessment",
  },
  saqSection: {
    title: "Self-Assessment Questionnaire (SAQ-D)",
    progress: "SAQ Completion Progress",
    questionsRemaining: "{count} questions remaining",
    continueButton: "Continue SAQ",
    tabTitle: "PCI DSS Self-Assessment Questionnaire D - Requirements",
    requirementSubtitle: "Requirement 3 & 4",
    inProgress: "In Progress",
    tableHeaderId: "ID",
    tableHeaderDescription: "Requirement Description",
    req3_1: {
      desc: "Protect stored cardholder data (CHD) and limit storage and retention time.",
    },
    req3_4: {
      desc: "Render PAN unreadable anywhere it is stored (e.g., using strong cryptography).",
    },
    req4_1: {
      desc: "Use strong cryptography and security protocols to safeguard sensitive CHD during transmission.",
    },
    req6_2: {
      desc: "Ensure that all system components and software are protected from known vulnerabilities by installing security patches.",
    },
  },
  scansSection: {
    title: "Vulnerability Scans",
    lastScan: "Last Scan",
    passed: "Passed",
    failed: "Failed",
    findings: "Findings",
    highSeverity: "High Severity",
    mediumSeverity: "Medium Severity",
    lowSeverity: "Low Severity",
    runScanButton: "Run Vulnerability Scan",
    scanSuccessAlert: "Vulnerability scan finished successfully. Status: Compliant. 0 High vulnerabilities found.",
    recentLogsTitle: "Recent Scan Logs",
    refreshButton: "Refresh Scans",
    tableHeaderDate: "Scan Date",
    tableHeaderTarget: "Target / Scope",
    log1: {
      date: "24 Jun 2026",
      target: "Ares Payment API & Web Gateway",
      findings: "0 Critical, 0 High, 2 Med, 5 Low",
    },
    log2: {
      date: "10 May 2026",
      target: "Ares Database & Backend Cluster",
      findings: "0 Critical, 0 High, 0 Med, 2 Low",
    },
    log3: {
      date: "15 Apr 2026",
      target: "External Network Domain (ares-rental.com)",
      findings: "0 Critical, 1 High (Remediated), 4 Med",
    },
    scanningBackdropText: "Scanning system for vulnerabilities...",
  },
  penTestSection: {
    title: "Penetration Testing",
    lastTest: "Last Test",
    status: "Status",
    active: "Active / Safe",
    scheduleButton: "Schedule Test",
  },
  reportsSection: {
    title: "Compliance Reports",
    generateButton: "Generate Report",
    downloadRoC: "Download RoC (Report on Compliance)",
    downloadAoC: "Download AoC (Attestation of Compliance)",
    generatedReportsTitle: "Generated Compliance Reports",
    rocDescription: "Report on Compliance (RoC) - Full assessment report signed by QSA.",
    aocDescription: "Attestation of Compliance (AoC) - Official summary of compliance status.",
    downloadPdfButton: "Download PDF",
  },
};

export default compliance;
