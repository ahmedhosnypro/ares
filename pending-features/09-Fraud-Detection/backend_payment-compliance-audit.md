# Feature: Payment Compliance & Audit

## Overview

This feature implements comprehensive compliance validation and audit capabilities for payment security, including PCI DSS Self-Assessment Questionnaire (SAQ) management, quarterly vulnerability scanning, penetration testing coordination, compliance reporting, and third-party assessment support. The system enables systematic compliance validation, maintains documentation for audits, tracks remediation of identified issues, and provides evidence of ongoing compliance with payment security standards. This ensures the platform maintains payment processing capabilities and avoids costly penalties.

## Sprint Category

sprint-01

## Feature IDs

- F-COMP-PAY-016: Self-Assessment Questionnaire (SAQ) Management
- F-COMP-PAY-017: Quarterly Vulnerability Scanning
- F-COMP-PAY-018: Penetration Testing Coordination
- F-COMP-PAY-019: Compliance Reporting & Documentation
- F-COMP-PAY-020: Third-Party Assessment Support

## User Stories

### As a compliance officer
I want to manage PCI DSS self-assessments systematically, so that I can validate and document compliance annually.

### As a security engineer
I want to coordinate quarterly vulnerability scans, so that I can identify and remediate security weaknesses.

### As a platform operator
I want comprehensive compliance reports, so that I can demonstrate compliance to acquiring banks and auditors.

### As a QSA (Qualified Security Assessor)
I want access to compliance documentation and evidence, so that I can efficiently conduct third-party assessments.

## Backend Specifications

### API Endpoints

#### SAQ Management

**GET /api/v1/admin/compliance/saq/current**
- Purpose: Retrieve current SAQ status and progress
- Authentication: Required (JWT, Compliance Officer role)
- Response:
  ```
  {
    "saqType": "SAQ-A|SAQ-A-EP|SAQ-D",
    "version": "string",
    "status": "not_started|in_progress|completed|submitted",
    "completionPercentage": "number",
    "dueDate": "ISO8601 date",
    "lastUpdated": "ISO8601 datetime",
    "completedSections": "number",
    "totalSections": "number",
    "nonCompliantItems": "number"
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden

**GET /api/v1/admin/compliance/saq/questions**
- Purpose: Retrieve SAQ questions with responses
- Authentication: Required (JWT, Compliance Officer role)
- Query Parameters: section (optional)
- Response:
  ```
  {
    "questions": [
      {
        "id": "string",
        "section": "string",
        "questionNumber": "string",
        "questionText": "string",
        "response": "yes|no|not_applicable|not_tested",
        "evidence": "string",
        "notes": "string",
        "lastUpdated": "ISO8601 datetime",
        "updatedBy": "string"
      }
    ]
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden

**PUT /api/v1/admin/compliance/saq/questions/{questionId}**
- Purpose: Update SAQ question response
- Authentication: Required (JWT, Compliance Officer role)
- Path Parameters: questionId (string)
- Request Body:
  ```
  {
    "response": "yes|no|not_applicable|not_tested",
    "evidence": "string",
    "notes": "string"
  }
  ```
- Response: 200 OK with updated question
- Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

**POST /api/v1/admin/compliance/saq/submit**
- Purpose: Submit completed SAQ and generate Attestation of Compliance (AOC)
- Authentication: Required (JWT, Compliance Officer role)
- Request Body:
  ```
  {
    "attestationDate": "ISO8601 date",
    "attestedBy": "string",
    "title": "string",
    "signature": "string"
  }
  ```
- Response:
  ```
  {
    "submissionId": "string",
    "aocDocument": "string (URL)",
    "submittedAt": "ISO8601 datetime",
    "validUntil": "ISO8601 date"
  }
  ```
- Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden

#### Vulnerability Scanning

**GET /api/v1/admin/compliance/vulnerability-scans**
- Purpose: Retrieve vulnerability scan history
- Authentication: Required (JWT, Compliance Officer or Security Admin role)
- Query Parameters: startDate, endDate, status, page, pageSize
- Response:
  ```
  {
    "scans": [
      {
        "id": "string",
        "scanDate": "ISO8601 date",
        "scanType": "quarterly|ad_hoc|post_change",
        "vendor": "string",
        "status": "scheduled|in_progress|completed|failed",
        "passingStatus": "passed|failed|pending",
        "vulnerabilitiesFound": "number",
        "criticalVulnerabilities": "number",
        "highVulnerabilities": "number",
        "mediumVulnerabilities": "number",
        "lowVulnerabilities": "number",
        "reportUrl": "string",
        "nextScanDue": "ISO8601 date"
      }
    ],
    "pagination": {
      "page": "number",
      "pageSize": "number",
      "totalRecords": "number"
    }
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden

**POST /api/v1/admin/compliance/vulnerability-scans/schedule**
- Purpose: Schedule a new vulnerability scan
- Authentication: Required (JWT, Compliance Officer or Security Admin role)
- Request Body:
  ```
  {
    "scanDate": "ISO8601 date",
    "scanType": "quarterly|ad_hoc|post_change",
    "vendor": "string",
    "targetSystems": ["string"],
    "notes": "string"
  }
  ```
- Response: 201 Created with scan details
- Status Codes: 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden

**GET /api/v1/admin/compliance/vulnerability-scans/{scanId}/vulnerabilities**
- Purpose: Retrieve detailed vulnerability findings from a scan
- Authentication: Required (JWT, Compliance Officer or Security Admin role)
- Path Parameters: scanId (string)
- Query Parameters: severity, status, page, pageSize
- Response:
  ```
  {
    "vulnerabilities": [
      {
        "id": "string",
        "cveId": "string",
        "title": "string",
        "description": "string",
        "severity": "critical|high|medium|low",
        "cvssScore": "number",
        "affectedSystem": "string",
        "affectedComponent": "string",
        "status": "open|in_remediation|resolved|accepted_risk",
        "remediationPlan": "string",
        "targetResolutionDate": "ISO8601 date",
        "resolvedDate": "ISO8601 date"
      }
    ],
    "pagination": {
      "page": "number",
      "pageSize": "number",
      "totalRecords": "number"
    }
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found

**PUT /api/v1/admin/compliance/vulnerabilities/{vulnerabilityId}/remediate**
- Purpose: Update vulnerability remediation status
- Authentication: Required (JWT, Security Admin role)
- Path Parameters: vulnerabilityId (string)
- Request Body:
  ```
  {
    "status": "in_remediation|resolved|accepted_risk",
    "remediationPlan": "string",
    "targetResolutionDate": "ISO8601 date",
    "notes": "string"
  }
  ```
- Response: 200 OK with updated vulnerability
- Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

#### Penetration Testing

**GET /api/v1/admin/compliance/penetration-tests**
- Purpose: Retrieve penetration testing history
- Authentication: Required (JWT, Compliance Officer or Security Admin role)
- Query Parameters: startDate, endDate, page, pageSize
- Response:
  ```
  {
    "tests": [
      {
        "id": "string",
        "testDate": "ISO8601 date",
        "testType": "annual|post_change|targeted",
        "vendor": "string",
        "scope": "string",
        "status": "scheduled|in_progress|completed",
        "findingsCount": "number",
        "criticalFindings": "number",
        "highFindings": "number",
        "reportUrl": "string",
        "nextTestDue": "ISO8601 date"
      }
    ],
    "pagination": {
      "page": "number",
      "pageSize": "number",
      "totalRecords": "number"
    }
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden

**POST /api/v1/admin/compliance/penetration-tests/schedule**
- Purpose: Schedule a new penetration test
- Authentication: Required (JWT, Compliance Officer role)
- Request Body:
  ```
  {
    "testDate": "ISO8601 date",
    "testType": "annual|post_change|targeted",
    "vendor": "string",
    "scope": "string",
    "targetSystems": ["string"],
    "notes": "string"
  }
  ```
- Response: 201 Created with test details
- Status Codes: 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden

#### Compliance Reporting

**GET /api/v1/admin/compliance/reports/summary**
- Purpose: Retrieve compliance status summary
- Authentication: Required (JWT, Compliance Officer role)
- Response:
  ```
  {
    "overallStatus": "compliant|non_compliant|in_progress",
    "lastAssessmentDate": "ISO8601 date",
    "nextAssessmentDue": "ISO8601 date",
    "saqStatus": "completed|in_progress|overdue",
    "lastVulnerabilityScan": "ISO8601 date",
    "nextVulnerabilityScan": "ISO8601 date",
    "lastPenetrationTest": "ISO8601 date",
    "nextPenetrationTest": "ISO8601 date",
    "openVulnerabilities": "number",
    "openFindings": "number",
    "complianceScore": "number (0-100)"
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden

**GET /api/v1/admin/compliance/reports/detailed**
- Purpose: Generate detailed compliance report
- Authentication: Required (JWT, Compliance Officer role)
- Query Parameters: startDate, endDate, format (pdf|json|csv)
- Response:
  ```
  {
    "reportId": "string",
    "generatedAt": "ISO8601 datetime",
    "reportPeriod": {
      "startDate": "ISO8601 date",
      "endDate": "ISO8601 date"
    },
    "saqCompliance": {
      "status": "string",
      "completionDate": "ISO8601 date",
      "nonCompliantItems": "number"
    },
    "vulnerabilityScans": {
      "scansCompleted": "number",
      "passingScans": "number",
      "openVulnerabilities": "number"
    },
    "penetrationTests": {
      "testsCompleted": "number",
      "openFindings": "number"
    },
    "securityIncidents": {
      "totalIncidents": "number",
      "criticalIncidents": "number",
      "averageResolutionTime": "number (hours)"
    },
    "recommendations": ["string"],
    "downloadUrl": "string"
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden

**POST /api/v1/admin/compliance/reports/export**
- Purpose: Export compliance documentation package
- Authentication: Required (JWT, Compliance Officer role)
- Request Body:
  ```
  {
    "includeItems": ["saq", "vulnerability_scans", "penetration_tests", "audit_logs", "security_policies"],
    "dateRange": {
      "startDate": "ISO8601 date",
      "endDate": "ISO8601 date"
    },
    "format": "pdf|zip"
  }
  ```
- Response:
  ```
  {
    "exportId": "string",
    "status": "processing|completed|failed",
    "downloadUrl": "string",
    "expiresAt": "ISO8601 datetime"
  }
  ```
- Status Codes: 202 Accepted, 400 Bad Request, 401 Unauthorized, 403 Forbidden

#### Third-Party Assessment

**GET /api/v1/admin/compliance/assessments**
- Purpose: Retrieve third-party assessment history
- Authentication: Required (JWT, Compliance Officer role)
- Query Parameters: startDate, endDate, assessmentType, page, pageSize
- Response:
  ```
  {
    "assessments": [
      {
        "id": "string",
        "assessmentType": "qsa_onsite|asv_scan|penetration_test",
        "assessor": "string",
        "assessorCompany": "string",
        "scheduledDate": "ISO8601 date",
        "completedDate": "ISO8601 date",
        "status": "scheduled|in_progress|completed|failed",
        "outcome": "compliant|non_compliant|conditional",
        "findingsCount": "number",
        "reportUrl": "string"
      }
    ],
    "pagination": {
      "page": "number",
      "pageSize": "number",
      "totalRecords": "number"
    }
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden

**POST /api/v1/admin/compliance/assessments/schedule**
- Purpose: Schedule a third-party assessment
- Authentication: Required (JWT, Compliance Officer role)
- Request Body:
  ```
  {
    "assessmentType": "qsa_onsite|asv_scan|penetration_test",
    "assessor": "string",
    "assessorCompany": "string",
    "scheduledDate": "ISO8601 date",
    "scope": "string",
    "contactEmail": "string",
    "notes": "string"
  }
  ```
- Response: 201 Created with assessment details
- Status Codes: 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden

**GET /api/v1/admin/compliance/assessments/{assessmentId}/evidence**
- Purpose: Retrieve evidence package for third-party assessment
- Authentication: Required (JWT, Compliance Officer role)
- Path Parameters: assessmentId (string)
- Response:
  ```
  {
    "assessmentId": "string",
    "evidencePackage": {
      "networkDiagrams": ["string (URLs)"],
      "systemInventory": "string (URL)",
      "securityPolicies": ["string (URLs)"],
      "auditLogs": "string (URL)",
      "vulnerabilityScanReports": ["string (URLs)"],
      "penetrationTestReports": ["string (URLs)"],
      "incidentResponsePlan": "string (URL)",
      "trainingRecords": "string (URL)"
    },
    "generatedAt": "ISO8601 datetime"
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found

### Business Logic

#### SAQ Management

1. **SAQ Type Determination**
   - Analyze payment processing methods to determine appropriate SAQ type
   - SAQ-A: Hosted payment pages only, no cardholder data storage
   - SAQ-A-EP: Hosted payment pages with partial e-commerce
   - SAQ-D: All other merchants
   - Update SAQ type if payment processing methods change

2. **Question Response Tracking**
   - Present all SAQ questions organized by section
   - Track responses (yes, no, not applicable, not tested)
   - Require evidence documentation for each response
   - Flag non-compliant responses for remediation
   - Calculate completion percentage

3. **Compliance Validation**
   - Validate all questions are answered before submission
   - Ensure all non-compliant items have remediation plans
   - Verify evidence is provided for critical requirements
   - Generate warnings for responses that may indicate non-compliance
   - Require review and approval before submission

4. **AOC Generation**
   - Generate Attestation of Compliance document
   - Include company information and assessment details
   - Require authorized signature (digital or scanned)
   - Generate PDF document for submission to acquiring bank
   - Track AOC validity period (typically 1 year)

#### Vulnerability Scanning

1. **Scan Scheduling**
   - Schedule quarterly scans automatically
   - Support ad-hoc scans on demand
   - Require scans after significant network changes
   - Integrate with Approved Scanning Vendor (ASV) APIs
   - Send scan requests to ASV with target system details

2. **Scan Result Processing**
   - Receive scan results from ASV
   - Parse vulnerability findings
   - Classify vulnerabilities by CVSS score
   - Determine passing status (no vulnerabilities rated 4.0 or higher)
   - Generate alerts for failed scans

3. **Vulnerability Remediation Tracking**
   - Create remediation tasks for identified vulnerabilities
   - Assign vulnerabilities to responsible teams
   - Track remediation progress and target dates
   - Require rescan after remediation
   - Verify vulnerabilities are resolved in rescan

4. **Compliance Reporting**
   - Track quarterly scan completion
   - Maintain passing scan status
   - Generate compliance reports showing scan history
   - Provide evidence of vulnerability remediation
   - Alert when scans are overdue

#### Penetration Testing

1. **Test Coordination**
   - Schedule annual penetration tests
   - Schedule tests after significant infrastructure changes
   - Coordinate with penetration testing vendors
   - Define test scope and rules of engagement
   - Provide necessary access and documentation to testers

2. **Finding Management**
   - Receive penetration test reports
   - Parse and categorize findings
   - Assess risk and impact of findings
   - Create remediation tasks for findings
   - Track remediation progress

3. **Retest Coordination**
   - Schedule retests to verify remediation
   - Provide evidence of fixes to testers
   - Verify findings are resolved
   - Document retest results
   - Close findings after successful retest

#### Compliance Reporting

1. **Automated Report Generation**
   - Generate compliance status reports on demand
   - Include SAQ status, vulnerability scan results, penetration test findings
   - Calculate compliance score based on multiple factors
   - Identify compliance gaps and risks
   - Provide recommendations for improvement

2. **Evidence Collection**
   - Collect evidence from multiple sources (audit logs, scan reports, policies)
   - Organize evidence by PCI DSS requirement
   - Generate evidence packages for auditors
   - Maintain evidence repository with version control
   - Provide secure access to evidence for authorized users

3. **Compliance Dashboard**
   - Display overall compliance status
   - Show upcoming compliance deadlines
   - Track open compliance items
   - Display compliance trends over time
   - Provide drill-down into specific requirements

#### Third-Party Assessment Support

1. **Assessment Preparation**
   - Generate system inventory documentation
   - Collect network diagrams and architecture documentation
   - Compile security policies and procedures
   - Prepare audit log samples
   - Organize evidence by PCI DSS requirement

2. **Assessor Access**
   - Provide secure portal for assessors to access documentation
   - Track assessor access to systems and data
   - Facilitate assessor interviews and walkthroughs
   - Respond to assessor information requests
   - Maintain communication log with assessors

3. **Finding Remediation**
   - Track findings from third-party assessments
   - Create remediation plans for non-compliant items
   - Assign remediation tasks to responsible teams
   - Monitor remediation progress
   - Provide evidence of remediation to assessors

### Authentication Requirements

- JWT tokens with Compliance Officer or Security Admin role required
- Multi-factor authentication required for compliance management functions
- Session timeout of 30 minutes for compliance interfaces
- All API calls logged with user identity and timestamp
- Require additional authentication for SAQ submission and report export

### Integration Points

1. **ASV Integration**
   - API integration with Approved Scanning Vendors
   - Automated scan scheduling and result retrieval
   - Support for multiple ASV providers (Qualys, Rapid7, Tenable)
   - Webhook support for scan completion notifications

2. **Document Management**
   - Integration with document storage (AWS S3, Azure Blob Storage)
   - Secure storage for compliance documentation
   - Version control for policy documents
   - Access control for sensitive compliance documents

3. **Task Management**
   - Create tasks in project management system for remediation
   - Track task completion and link to vulnerabilities/findings
   - Notify responsible teams of new remediation tasks
   - Integrate with Jira, ServiceNow, or similar platforms

4. **Notification System**
   - Send email notifications for compliance deadlines
   - Alert on failed vulnerability scans
   - Notify of new penetration test findings
   - Remind about upcoming assessments

### Performance Requirements

- SAQ question retrieval within 500ms
- Vulnerability scan list retrieval within 1 second
- Compliance report generation within 30 seconds
- Evidence package export within 2 minutes
- Support concurrent access by multiple compliance officers

### Data Retention

- SAQ responses: Permanent retention
- Vulnerability scan results: 3 years minimum
- Penetration test reports: 3 years minimum
- Compliance reports: 3 years minimum
- Assessment documentation: Permanent retention

## Technology Stack

- **Backend**: .NET 8+ with C#, ASP.NET Core Web API
- **Database**: MySQL 8.0+ for compliance data storage
- **Document Storage**: AWS S3 or Azure Blob Storage for reports and evidence
- **PDF Generation**: iTextSharp or PdfSharp for AOC and report generation
- **Integration**: REST APIs for ASV and penetration testing vendor integration
- **Scheduling**: Hangfire or Quartz.NET for automated scan scheduling

## Implementation Notes

### SAQ Type Selection

The platform should use SAQ-A or SAQ-A-EP to minimize compliance scope:

- **SAQ-A**: Use if all payment processing is via hosted payment pages (redirect to payment gateway)
- **SAQ-A-EP**: Use if payment data is collected on platform pages but immediately sent to payment gateway
- **SAQ-D**: Required if platform stores, processes, or transmits cardholder data

Recommended approach: Use hosted payment pages (SAQ-A) to minimize compliance burden.

### Vulnerability Scan Frequency

PCI DSS requires quarterly scans by an ASV. Implement automated scheduling:

- Schedule scans for the same day each quarter (e.g., 15th of Jan, Apr, Jul, Oct)
- Send reminders 2 weeks before scan due date
- Automatically schedule rescan after vulnerability remediation
- Maintain passing scan status at all times

### Penetration Testing Scope

Annual penetration testing should cover:

- External network perimeter
- Web applications handling payment data
- Internal network segmentation
- Wireless networks (if applicable)
- Social engineering (optional)

Engage qualified penetration testing firms with PCI DSS experience.

### Compliance Documentation

Maintain comprehensive documentation for audits:

- Network diagrams showing payment system segmentation
- Data flow diagrams for cardholder data
- System inventory with all components handling payment data
- Security policies and procedures
- Incident response plan
- Security awareness training records
- Vendor management documentation

### Continuous Compliance

Compliance is not a one-time activity. Implement continuous compliance practices:

- Regular review of security controls
- Ongoing vulnerability management
- Continuous monitoring and alerting
- Regular security awareness training
- Periodic policy reviews and updates
- Proactive risk assessments
