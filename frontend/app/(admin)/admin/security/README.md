# Admin Security Page

## Page Info

- **Route**: `/admin/security`
- **Access**: 🔒 Protected — requires Admin or Security Analyst role
- **Purpose**: Real-time payment security monitoring: live transaction feed, security event log, access audit trail, intrusion detection alerts, and file integrity monitoring.

**Sub-routes**:
- `/admin/security/payment-monitoring` — Real-time security dashboard
- `/admin/security/payment-monitoring/events` — Security event log
- `/admin/security/payment-monitoring/access-logs` — Access audit trail
- `/admin/security/intrusion-detection` — Intrusion detection alerts
- `/admin/security/file-integrity` — File integrity monitoring

---

## API Endpoints

### `GET /api/v1/admin/security/payment-monitoring/dashboard`

Get real-time payment security metrics and KPIs.

---

### `GET /api/v1/admin/security/payment-monitoring/events`

Retrieve searchable security event log.

**Query Parameters**: `startDate`, `endDate`, `severity`, `eventType`, `page`, `limit`

---

### `GET /api/v1/admin/security/payment-monitoring/access-logs`

Retrieve comprehensive access audit trail.

**Query Parameters**: `userId`, `action`, `startDate`, `endDate`, `page`, `limit`

---

### `GET /api/v1/admin/security/intrusion-detection/alerts`

Retrieve intrusion detection alerts with response actions.

**Query Parameters**: `status` (`open | resolved | suppressed`), `severity`

---

### `GET /api/v1/admin/security/file-integrity/status`

Get file integrity monitoring status and recent violations.

---

### `GET /api/v1/admin/security/file-integrity/violations`

List file integrity violations with details.

**Error Responses**

| Status | Meaning               |
|--------|-----------------------|
| 401    | Unauthorized          |
| 403    | Insufficient role     |
