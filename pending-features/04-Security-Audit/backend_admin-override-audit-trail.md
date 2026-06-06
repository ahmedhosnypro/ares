# Feature: Admin Override with Audit Trail

## Overview

Admin Override with Audit Trail allows platform administrators to access all user and supplier data for support, oversight, and incident response purposes, while maintaining comprehensive audit logging for accountability and compliance. This feature balances operational needs with privacy protection by requiring justification for data access, logging all admin actions, and optionally notifying users when their data is accessed. The system ensures transparency and accountability while enabling effective platform administration.

## Sprint Category

sprint-01

## Feature ID

F-SEC-AUTHZ-005

## User Stories

### As a platform administrator
I want to access any user or supplier data for support purposes, so that I can resolve issues and provide effective customer service.

### As a user
I want to be notified when an administrator accesses my data, so that I have transparency and can verify the access was legitimate.

### As a compliance officer
I want all admin data access to be logged with justification, so that I can audit admin actions and ensure compliance with privacy regulations.

### As a security administrator
I want to monitor admin access patterns, so that I can detect and prevent unauthorized or suspicious admin activity.

## Frontend Specifications

### Pages

**Admin Dashboard** (`/admin/dashboard`)
- Access to all platform data and features
- Admin action history and audit log viewer
- User and supplier data search and access tools
- System-wide analytics and reports

**Admin User Access Page** (`/admin/users/:userId`)
- View any user's profile and data
- Justification input required before access
- Access reason dropdown (support ticket, investigation, compliance)
- User notification toggle (optional)
- Audit trail display for previous admin access

**Admin Supplier Access Page** (`/admin/suppliers/:supplierId`)
- View any supplier's data and operations
- Justification input required before access
- Access reason dropdown (support ticket, investigation, compliance)
- Supplier notification toggle (optional)
- Audit trail display for previous admin access

**Admin Audit Log Page** (`/admin/audit-log`)
- Comprehensive audit log of all admin actions
- Filtering by admin user, resource type, action, date range
- Export functionality for compliance reports
- Anomaly detection alerts for suspicious patterns

### UI Components

**Access Justification Modal Component**
- Modal dialog requiring justification before data access
- Reason dropdown (support ticket, investigation, compliance, other)
- Support ticket ID input field (required for support reason)
- Free-text justification field
- User notification checkbox
- Submit and cancel buttons

**Admin Action Banner Component**
- Prominent banner indicating admin is viewing user/supplier data
- Displays admin name and access reason
- Shows timestamp of access
- Provides link to audit log entry

**Audit Log Table Component**
- Sortable and filterable table of admin actions
- Columns: timestamp, admin user, resource type, resource ID, action, reason, authorized
- Row highlighting for unauthorized access attempts
- Export to CSV functionality

**Access Notification Component**
- In-app notification to users when admin accesses their data
- Email notification option
- Displays admin name, access reason, timestamp
- Link to privacy policy and contact support

### User Flows

**Admin Accessing User Data Flow**:
1. Admin navigates to user search page
2. Admin searches for user by email or ID
3. Admin clicks on user to view details
4. System displays access justification modal
5. Admin selects reason (e.g., "Support Ticket")
6. Admin enters support ticket ID
7. Admin optionally enables user notification
8. Admin submits justification
9. System logs access with justification
10. System displays user data to admin
11. System sends notification to user (if enabled)
12. Admin can view and modify user data
13. All admin actions logged in audit trail

**Admin Investigating Security Incident Flow**:
1. Security team detects suspicious activity
2. Admin navigates to user involved in incident
3. System displays access justification modal
4. Admin selects reason "Security Investigation"
5. Admin enters investigation reference number
6. Admin disables user notification (to avoid alerting suspect)
7. Admin submits justification
8. System logs access with investigation reference
9. Admin reviews user's booking history and activity
10. Admin takes appropriate action (suspend account, etc.)
11. All actions logged for compliance review

**Compliance Officer Reviewing Audit Log Flow**:
1. Compliance officer navigates to audit log page
2. Officer filters by date range (e.g., last month)
3. Officer reviews all admin data access entries
4. Officer identifies access without proper justification
5. Officer exports audit log for compliance report
6. Officer follows up with admin for missing justifications
7. Officer generates monthly compliance report

### Data Requirements

**From Backend APIs**:
- Admin user information and permissions
- Full access to all user and supplier data
- Audit log entries with justifications
- Access statistics and anomaly alerts

**To Backend APIs**:
- Admin user ID and session token
- Access justification and reason
- Resource ID being accessed
- User notification preference

## Backend Specifications

### API Endpoints

**POST /api/admin/access-request**
- Purpose: Request access to user or supplier data with justification
- Authentication: Required (JWT token with Admin role)
- Request body: Resource type, resource ID, reason, justification, notify user
- Response: Access token with limited validity
- Status codes: 200 (success), 401 (unauthorized), 403 (forbidden), 400 (validation error)

**GET /api/admin/users/:userId**
- Purpose: Retrieve any user's data (requires access request)
- Authentication: Required (JWT token with Admin role + access token)
- Authorization: Verify access token is valid and matches resource
- Response: Complete user profile and data
- Status codes: 200 (success), 401 (unauthorized), 403 (forbidden), 404 (not found)

**GET /api/admin/suppliers/:supplierId**
- Purpose: Retrieve any supplier's data (requires access request)
- Authentication: Required (JWT token with Admin role + access token)
- Authorization: Verify access token is valid and matches resource
- Response: Complete supplier profile and data
- Status codes: 200 (success), 401 (unauthorized), 403 (forbidden), 404 (not found)

**GET /api/admin/audit-log**
- Purpose: Retrieve admin action audit log
- Authentication: Required (JWT token with Admin role)
- Query parameters: admin_id, resource_type, action, start_date, end_date, page, page_size
- Response: Paginated audit log entries
- Status codes: 200 (success), 401 (unauthorized), 403 (forbidden)

**GET /api/admin/audit-log/export**
- Purpose: Export audit log for compliance reporting
- Authentication: Required (JWT token with Admin role)
- Query parameters: start_date, end_date, format (csv, json)
- Response: Audit log file download
- Status codes: 200 (success), 401 (unauthorized), 403 (forbidden)

**GET /api/admin/audit-log/anomalies**
- Purpose: Retrieve detected anomalies in admin access patterns
- Authentication: Required (JWT token with Admin role)
- Response: Array of anomaly alerts
- Status codes: 200 (success), 401 (unauthorized), 403 (forbidden)

### Request Schemas

**Access Request**:
```
{
  "resourceType": "string (required, user or supplier)",
  "resourceId": "number (required)",
  "reason": "string (required, support_ticket, investigation, compliance, other)",
  "justification": "string (required, detailed explanation)",
  "supportTicketId": "string (optional, required if reason is support_ticket)",
  "investigationRef": "string (optional, required if reason is investigation)",
  "notifyUser": "boolean (optional, default false)"
}
```

### Response Schemas

**Access Request Response**:
```
{
  "accessToken": "string (JWT token with limited validity)",
  "expiresAt": "string (ISO 8601 timestamp)",
  "resourceType": "string",
  "resourceId": "number",
  "auditLogId": "number"
}
```

**Audit Log Response**:
```
{
  "entries": [
    {
      "id": "number",
      "adminId": "number",
      "adminName": "string",
      "adminEmail": "string",
      "resourceType": "string",
      "resourceId": "number",
      "resourceName": "string (user email or supplier name)",
      "action": "string (access, update, delete)",
      "reason": "string",
      "justification": "string",
      "supportTicketId": "string (optional)",
      "investigationRef": "string (optional)",
      "notifiedUser": "boolean",
      "ipAddress": "string",
      "userAgent": "string",
      "createdAt": "string (ISO 8601)"
    }
  ],
  "total": "number",
  "page": "number",
  "pageSize": "number"
}
```

**Anomaly Alert Response**:
```
{
  "anomalies": [
    {
      "id": "number",
      "type": "string (excessive_access, unusual_time, missing_justification)",
      "severity": "string (low, medium, high)",
      "adminId": "number",
      "adminName": "string",
      "description": "string",
      "detectedAt": "string (ISO 8601)",
      "resolved": "boolean"
    }
  ]
}
```

### Business Logic

**Access Request Validation**:
```
function validateAccessRequest(request, adminUser) {
  // 1. Verify admin has Admin role
  if (adminUser.role !== 'ADMIN') {
    throw new UnauthorizedError('Only admins can request data access');
  }
  
  // 2. Verify justification is provided
  if (!request.justification || request.justification.length < 20) {
    throw new ValidationError('Justification must be at least 20 characters');
  }
  
  // 3. Verify support ticket ID if reason is support_ticket
  if (request.reason === 'support_ticket' && !request.supportTicketId) {
    throw new ValidationError('Support ticket ID required for support access');
  }
  
  // 4. Verify investigation reference if reason is investigation
  if (request.reason === 'investigation' && !request.investigationRef) {
    throw new ValidationError('Investigation reference required for investigation access');
  }
  
  // 5. Verify resource exists
  const resource = database.query(
    `SELECT * FROM ${request.resourceType}s WHERE id = ?`,
    [request.resourceId]
  );
  if (!resource) {
    throw new NotFoundError('Resource not found');
  }
  
  return true;
}
```

**Access Token Generation**:
```
function generateAccessToken(adminId, resourceType, resourceId, reason) {
  // 1. Create access token with limited validity (1 hour)
  const token = jwt.sign({
    adminId: adminId,
    resourceType: resourceType,
    resourceId: resourceId,
    reason: reason,
    type: 'admin_access',
    exp: Date.now() + 3600000 // 1 hour
  }, SECRET_KEY);
  
  // 2. Store token in database for validation
  database.insert('admin_access_tokens', {
    token: token,
    admin_id: adminId,
    resource_type: resourceType,
    resource_id: resourceId,
    expires_at: new Date(Date.now() + 3600000)
  });
  
  return token;
}
```

**Audit Logging**:
```
function logAdminAccess(adminId, resourceType, resourceId, action, reason, justification, notifiedUser) {
  // 1. Create audit log entry
  const logEntry = {
    admin_id: adminId,
    resource_type: resourceType,
    resource_id: resourceId,
    action: action,
    reason: reason,
    justification: justification,
    notified_user: notifiedUser,
    ip_address: request.ip,
    user_agent: request.headers['user-agent'],
    created_at: new Date()
  };
  
  // 2. Insert into audit log
  const logId = database.insert('admin_audit_log', logEntry);
  
  // 3. Check for anomalies
  detectAnomalies(adminId, resourceType, action);
  
  return logId;
}
```

**User Notification**:
```
function notifyUserOfAdminAccess(userId, adminName, reason, justification) {
  // 1. Create notification
  const notification = {
    user_id: userId,
    type: 'admin_access',
    title: 'Administrator accessed your account',
    message: `${adminName} accessed your account for: ${reason}. Justification: ${justification}`,
    created_at: new Date()
  };
  
  // 2. Send in-app notification
  database.insert('notifications', notification);
  
  // 3. Send email notification
  emailService.send({
    to: user.email,
    subject: 'Administrator Account Access Notification',
    template: 'admin_access_notification',
    data: {
      adminName: adminName,
      reason: reason,
      justification: justification,
      timestamp: new Date()
    }
  });
}
```

**Anomaly Detection**:
```
function detectAnomalies(adminId, resourceType, action) {
  // 1. Check for excessive access (> 50 accesses per hour)
  const recentAccess = database.query(
    `SELECT COUNT(*) as count FROM admin_audit_log 
     WHERE admin_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
    [adminId]
  );
  if (recentAccess.count > 50) {
    createAnomalyAlert(adminId, 'excessive_access', 'high');
  }
  
  // 2. Check for unusual time access (outside business hours)
  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) {
    createAnomalyAlert(adminId, 'unusual_time', 'medium');
  }
  
  // 3. Check for missing justification
  const recentWithoutJustification = database.query(
    `SELECT COUNT(*) as count FROM admin_audit_log 
     WHERE admin_id = ? AND (justification IS NULL OR justification = '') 
     AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    [adminId]
  );
  if (recentWithoutJustification.count > 0) {
    createAnomalyAlert(adminId, 'missing_justification', 'high');
  }
}
```

### Authentication Requirements

**Required Authentication**:
- Valid JWT token in Authorization header
- Token must have Admin role
- Admin account must be active and not suspended

**Authorization Checks**:
- Verify admin has Admin role
- Verify access token is valid for requested resource
- Verify access token has not expired
- Log all admin data access

## Database Specifications

### Schema Changes

**admin_audit_log table** (new):
- `id` column: INT, primary key, auto-increment
- `admin_id` column: INT, foreign key to users.id
- `resource_type` column: VARCHAR(50), type of resource accessed (user, supplier, booking, etc.)
- `resource_id` column: INT, ID of resource accessed
- `action` column: VARCHAR(50), action performed (access, update, delete)
- `reason` column: VARCHAR(100), reason for access (support_ticket, investigation, compliance, other)
- `justification` column: TEXT, detailed justification for access
- `support_ticket_id` column: VARCHAR(100), support ticket reference (optional)
- `investigation_ref` column: VARCHAR(100), investigation reference (optional)
- `notified_user` column: BOOLEAN, whether user was notified
- `ip_address` column: VARCHAR(45), IP address of admin
- `user_agent` column: TEXT, user agent string
- `created_at` column: TIMESTAMP, when access occurred

**admin_access_tokens table** (new):
- `id` column: INT, primary key, auto-increment
- `token` column: VARCHAR(500), access token
- `admin_id` column: INT, foreign key to users.id
- `resource_type` column: VARCHAR(50), type of resource
- `resource_id` column: INT, ID of resource
- `expires_at` column: TIMESTAMP, token expiration time
- `revoked` column: BOOLEAN, whether token has been revoked
- `created_at` column: TIMESTAMP, token creation time

**admin_anomaly_alerts table** (new):
- `id` column: INT, primary key, auto-increment
- `admin_id` column: INT, foreign key to users.id
- `type` column: VARCHAR(50), anomaly type (excessive_access, unusual_time, missing_justification)
- `severity` column: VARCHAR(20), severity level (low, medium, high)
- `description` column: TEXT, anomaly description
- `detected_at` column: TIMESTAMP, when anomaly was detected
- `resolved` column: BOOLEAN, whether anomaly has been resolved
- `resolved_at` column: TIMESTAMP, when anomaly was resolved
- `resolved_by` column: INT, foreign key to users.id (who resolved it)

### Table Definitions

**admin_audit_log table**:
```sql
CREATE TABLE admin_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  reason VARCHAR(100) NOT NULL,
  justification TEXT NOT NULL,
  support_ticket_id VARCHAR(100),
  investigation_ref VARCHAR(100),
  notified_user BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_admin_id (admin_id),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_created_at (created_at),
  INDEX idx_reason (reason)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**admin_access_tokens table**:
```sql
CREATE TABLE admin_access_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(500) NOT NULL UNIQUE,
  admin_id INT NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_admin_id (admin_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**admin_anomaly_alerts table**:
```sql
CREATE TABLE admin_anomaly_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP NULL,
  resolved_by INT NULL,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_admin_id (admin_id),
  INDEX idx_detected_at (detected_at),
  INDEX idx_resolved (resolved),
  INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

**admin_audit_log ↔ users**: Many-to-One
- Many audit log entries for one admin user
- Foreign key: admin_audit_log.admin_id → users.id
- On Delete: CASCADE (delete logs when admin deleted)

**admin_access_tokens ↔ users**: Many-to-One
- Many access tokens for one admin user
- Foreign key: admin_access_tokens.admin_id → users.id
- On Delete: CASCADE (delete tokens when admin deleted)

**admin_anomaly_alerts ↔ users**: Many-to-One
- Many anomaly alerts for one admin user
- Foreign key: admin_anomaly_alerts.admin_id → users.id
- Foreign key: admin_anomaly_alerts.resolved_by → users.id
- On Delete: CASCADE (delete alerts when admin deleted)

### Indexes

**admin_audit_log table**:
- Primary key index on `id`
- Index on `admin_id` for admin-specific queries
- Composite index on `(resource_type, resource_id)` for resource-specific queries
- Index on `created_at` for temporal queries
- Index on `reason` for filtering by access reason

**admin_access_tokens table**:
- Primary key index on `id`
- Unique index on `token` for token validation
- Index on `admin_id` for admin-specific queries
- Index on `expires_at` for token expiration cleanup

**admin_anomaly_alerts table**:
- Primary key index on `id`
- Index on `admin_id` for admin-specific queries
- Index on `detected_at` for temporal queries
- Index on `resolved` for filtering unresolved alerts
- Index on `severity` for filtering by severity level

## Technology Stack

- **Backend**: .NET 8+ with C#, ASP.NET Core Web API
- **Database**: MySQL 8.0+ with InnoDB storage engine
- **Frontend**: Next.js 14+ with TypeScript, React 18+
- **Authentication**: JWT tokens with Admin role
- **Notifications**: Email service integration (SendGrid, AWS SES)

## Implementation Notes

### Security Considerations

**Accountability**:
- All admin data access requires justification
- All admin actions logged with timestamp and IP address
- Audit logs are immutable (cannot be deleted or modified)
- Regular audit log reviews for compliance

**Transparency**:
- Users notified when admin accesses their data (optional)
- Audit logs available for compliance review
- Anomaly detection alerts for suspicious admin activity

**Access Control**:
- Admin override requires Admin role
- Access tokens have limited validity (1 hour)
- Tokens can be revoked if compromised
- Separate authentication for sensitive operations

### Performance Optimization

**Database Optimization**:
- Index all foreign keys in audit tables
- Use partitioning for large audit log tables
- Archive old audit logs to separate storage
- Use read replicas for audit log queries

**Caching**:
- Cache admin permissions in JWT token
- Cache access tokens for validation
- Invalidate cache on token revocation

### Error Handling

**Access Request Errors**:
- 400 Bad Request: Invalid justification or missing required fields
- 401 Unauthorized: Admin not authenticated
- 403 Forbidden: User does not have Admin role
- 404 Not Found: Resource does not exist

### Testing Strategy

**Unit Tests**:
- Test access request validation logic
- Test access token generation and validation
- Test audit logging functionality
- Test anomaly detection algorithms

**Integration Tests**:
- Test end-to-end admin data access flow
- Test user notification functionality
- Test audit log export functionality
- Test anomaly alert generation

### Compliance

**GDPR Compliance**:
- Admin access logging meets GDPR audit requirements
- User notification provides transparency
- Audit logs retained for 7 years for compliance

**SOC 2 Compliance**:
- Admin access controls meet SOC 2 requirements
- Audit trail provides evidence of access controls
- Anomaly detection demonstrates monitoring

## Related Requirements

- REQ-SEC-6: Role-Based Access Control (RBAC)
- REQ-SEC-8: Audit Logging and Monitoring
- REQ-COMP-1: GDPR Compliance
- REQ-COMP-3: SOC 2 Compliance

## Related Features

- F-SEC-AUTHZ-001: Role-Based Access Control (RBAC)
- F-SEC-AUTHZ-003: Supplier Data Isolation
- F-SEC-AUTHZ-004: User Data Privacy Controls
- F-OPS-ANAL-001: Admin Analytics Dashboard

## Success Metrics

- 100% of admin data access logged with justification
- Audit log completeness > 99.99%
- Anomaly detection accuracy > 90%
- User notification delivery rate > 99%
- Compliance audit score > 95%
- Admin access response time < 100ms
 