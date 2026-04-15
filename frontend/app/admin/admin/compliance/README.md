# Admin Compliance Page

## Page Info

- **Route**: `/admin/compliance`
- **Access**: 🔒 Protected — requires Admin or Compliance Officer role
- **Purpose**: Manage PCI DSS compliance activities: SAQ completion, vulnerability scans, penetration testing, third-party assessments, and compliance report generation.

**Sub-routes**:

- `/admin/compliance/dashboard` — Overview of compliance status
- `/admin/compliance/saq` — Self-Assessment Questionnaire
- `/admin/compliance/vulnerability-scans` — Scan tracking and remediation
- `/admin/compliance/penetration-tests` — Pen test coordination
- `/admin/compliance/reports` — Generate and export compliance reports
- `/admin/compliance/assessments` — Third-party assessor access

---

## API Endpoints

### `GET /api/v1/admin/compliance/reports/summary`

Retrieve overall compliance status and score.

---

### `GET /api/v1/admin/compliance/saq/current`

Get current SAQ completion status and questions.

---

### `GET /api/v1/admin/compliance/vulnerability-scans`

List vulnerability scans with findings and remediation status.

---

### `GET /api/v1/admin/compliance/penetration-tests`

List penetration tests with status and findings.

---

### `GET /api/v1/admin/compliance/assessments`

List third-party assessments and provide assessor access.

**Error Responses**

| Status | Meaning           |
| ------ | ----------------- |
| 401    | Unauthorized      |
| 403    | Insufficient role |
