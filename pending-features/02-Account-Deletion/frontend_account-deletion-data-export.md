# Feature: Account Deletion & Data Export

## Overview

Account Deletion & Data Export provides users with GDPR-compliant rights to export all personal data in machine-readable format and request permanent account deletion. This feature ensures users maintain complete control over their personal information, with transparent data retention policies, validation checks for active bookings, a 30-day grace period for deletion requests, and clear communication throughout the process. The feature supports GDPR Article 20 (Right to Data Portability) and Article 17 (Right to Erasure), building user trust through data transparency and control.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

F-AM-018

## Dependencies

F-AM-017 (Privacy Controls) - Account deletion and data export are part of broader privacy management

## User Stories

**As a privacy-conscious user**, I want to export all my personal data in a machine-readable format, so that I can review what information the platform has collected about me and transfer it to another service if needed.

**As a user leaving the platform**, I want to request permanent account deletion with a grace period, so that I can remove my personal information while having time to change my mind.

**As an EU resident**, I want to exercise my GDPR rights to data portability and erasure, so that I maintain control over my personal information as required by law.

**As a user concerned about data retention**, I want clear information about what data is retained after account deletion and why, so that I understand the platform's data retention policies.

**As a user with active bookings**, I want to be prevented from deleting my account until bookings are completed, so that I don't accidentally disrupt active rentals.

## Frontend Specifications

### Pages

#### Account Data Management Page (`/account/data-management`)
- Data export section with request button and status
- Account deletion section with warning and request button
- Data retention policy information
- Active data export requests list with status and download links
- Pending account deletion request status (if exists)
- GDPR rights information and links
- Data protection officer contact information
- Links to privacy policy and terms of service


### UI Components

#### DataExportSection Component
- "Export My Data" primary action button
- Explanation of what data will be included in export
- Timeline information (ready within 30 days)
- File format information (JSON or CSV)
- Export expiration information (30 days after generation)
- List of active export requests with:
  - Request date
  - Status (pending, processing, completed, failed)
  - Download button (when completed)
  - Expiration date
  - Progress indicator for processing requests
- Rate limit information (1 request per 30 days)
- Success/error notifications

#### AccountDeletionSection Component
- "Delete My Account" destructive action button with warning styling
- Warning message about permanent deletion
- List of requirements before deletion:
  - No active bookings
  - No outstanding payments
  - No pending disputes
- Grace period information (30 days)
- Data retention policy explanation
- Pending deletion request status (if exists):
  - Request date
  - Grace period end date
  - Countdown timer
  - "Cancel Deletion" button
- Confirmation dialog with password verification
- Success/error notifications

#### DataExportRequestDialog Component
- Modal dialog for export confirmation
- Explanation of export contents:
  - Profile information
  - Booking history
  - Payment history
  - Communication history
  - Support tickets
  - Login history
  - Verification documents
- Timeline: Ready within 30 days
- Email notification confirmation
- File format selection (JSON or CSV)
- "Confirm Export" and "Cancel" buttons
- Loading state during request submission

#### AccountDeletionConfirmationDialog Component
- Modal dialog for deletion confirmation
- Warning message: "This action cannot be undone"
- Checklist of what will be deleted:
  - Personal information (name, email, phone, address)
  - Profile photo and bio
  - Preferences and saved locations
  - Verification documents
- Checklist of what will be retained:
  - Transaction records (7 years for accounting)
  - Anonymized booking history
  - Fraud prevention data (as legally permitted)
- Grace period information (30 days to cancel)
- Password input field for verification
- Optional deletion reason dropdown
- Optional feedback text area
- "Confirm Deletion" and "Cancel" buttons
- Loading state during request submission


#### DataRetentionPolicySection Component
- Accordion or expandable section with retention policy details
- Categories of data with retention periods:
  - Active account data: Retained indefinitely
  - Inactive account data: Deleted after 3 years of inactivity
  - Transaction records: Retained for 7 years (legal requirement)
  - Fraud prevention data: Retained as legally permitted
  - Marketing data: Deleted immediately upon opt-out
  - Anonymized analytics: Retained indefinitely
- Legal basis for each retention period
- Links to detailed privacy policy
- Contact information for data protection officer

#### ExportDownloadCard Component
- Card displaying completed export request
- Export file name and size
- Generation date
- Expiration date with countdown
- "Download Export" primary button
- File format indicator (JSON or CSV)
- Security notice about secure download
- Delete export button (optional)

### User Flows

#### Request Data Export Flow
1. User navigates to Account Data Management page
2. User clicks "Export My Data" button
3. System checks if user has reached rate limit (1 per 30 days)
4. If rate limit exceeded: Display error message with next available date
5. If rate limit OK: Display DataExportRequestDialog
6. User reviews export contents and timeline
7. User selects file format (JSON or CSV)
8. User clicks "Confirm Export"
9. System validates user authentication
10. System creates data export request record
11. System queues background job for export generation
12. System displays success message with request ID
13. System sends confirmation email
14. User sees new export request in pending state
15. Background job processes export (may take up to 30 days)
16. When complete: System sends email notification with download link
17. User returns to Account Data Management page
18. User sees completed export with download button
19. User clicks "Download Export"
20. System validates export not expired
21. System generates secure download URL
22. User downloads export file
23. Export file expires after 30 days from generation


#### Request Account Deletion Flow
1. User navigates to Account Data Management page
2. User clicks "Delete My Account" button
3. System displays AccountDeletionConfirmationDialog
4. User reviews deletion warning and data retention policy
5. User enters password for verification
6. User optionally selects deletion reason
7. User optionally provides feedback
8. User clicks "Confirm Deletion"
9. System validates password
10. System checks for active bookings
11. System checks for outstanding payments
12. System checks for pending disputes
13. If validation fails: Display error with specific requirements
14. If validation passes: System creates account deletion request
15. System sets account status to "pending_deletion"
16. System calculates grace period end date (30 days from now)
17. System generates unique cancellation token
18. System sends confirmation email with cancellation link
19. System displays success message with grace period information
20. User account remains active during grace period
21. User can cancel deletion by clicking link in email or from account page
22. After 30 days: Background job executes permanent deletion
23. System deletes personal data per retention policy
24. System anonymizes booking history
25. System retains transaction records for legal compliance
26. System sends final confirmation email
27. User account is permanently deleted

#### Cancel Account Deletion Flow
1. User receives account deletion confirmation email
2. User clicks "Cancel Deletion" link in email
3. System validates cancellation token
4. System displays cancellation confirmation page
5. User clicks "Confirm Cancellation"
6. System updates deletion request status to "cancelled"
7. System sets account status back to "active"
8. System sends cancellation confirmation email
9. System displays success message
10. User account remains active

#### Download Data Export Flow
1. User receives data export ready email
2. User clicks download link in email or navigates to Account Data Management page
3. User sees completed export with download button
4. User clicks "Download Export"
5. System validates export not expired (30 days from generation)
6. If expired: Display error message and option to request new export
7. If valid: System generates secure, time-limited download URL
8. System logs download event for audit
9. Browser downloads export file
10. User saves file to local device
11. User can open file in text editor or spreadsheet application


### Data Requirements

#### User Account Data from Backend
- User ID
- Account status (active, pending_deletion, deleted)
- Email address
- Account creation date
- Last login date
- Active bookings count
- Outstanding payments count
- Pending disputes count

#### Data Export Requests from Backend
```typescript
interface DataExportRequest {
  requestId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileFormat: 'json' | 'csv';
  requestedAt: string; // ISO timestamp
  completedAt: string | null; // ISO timestamp
  expiresAt: string | null; // ISO timestamp
  downloadUrl: string | null;
  fileSize: number | null; // bytes
  errorMessage: string | null;
}
```

#### Account Deletion Request from Backend
```typescript
interface AccountDeletionRequest {
  requestId: string;
  userId: string;
  status: 'pending' | 'cancelled' | 'completed';
  deletionReason: string | null;
  feedback: string | null;
  requestedAt: string; // ISO timestamp
  gracePeriodEndsAt: string; // ISO timestamp
  cancellationToken: string;
  cancelledAt: string | null; // ISO timestamp
  completedAt: string | null; // ISO timestamp
}
```

#### Data Retention Policy from Backend
```typescript
interface DataRetentionPolicy {
  categories: Array<{
    name: string;
    description: string;
    retentionPeriod: string;
    legalBasis: string;
  }>;
  lastUpdated: string; // ISO timestamp
}
```

## Backend Specifications

### API Endpoints

#### POST /api/users/{userId}/data-export
**Purpose**: Request GDPR-compliant data export

**Authentication**: Required (JWT token)

**Authorization**: User can only request their own data export

**Request Parameters**:
- `userId` (path parameter): User ID

**Request Body**:
```json
{
  "fileFormat": "string (json|csv, default: json)"
}
```

**Response Schema** (202 Accepted):
```json
{
  "success": true,
  "message": "Data export request received. You will receive an email when your export is ready (within 30 days).",
  "requestId": "string (UUID)",
  "estimatedCompletionDate": "string (ISO date)",
  "fileFormat": "string (json|csv)"
}
```

**Error Responses**:
- 400 Bad Request: Invalid file format
- 401 Unauthorized: Invalid or missing authentication token
- 429 Too Many Requests: User has exceeded rate limit (1 per 30 days)


#### GET /api/users/{userId}/data-export
**Purpose**: List all data export requests for user

**Authentication**: Required (JWT token)

**Authorization**: User can only view their own data export requests

**Request Parameters**:
- `userId` (path parameter): User ID

**Response Schema** (200 OK):
```json
{
  "exports": [
    {
      "requestId": "string (UUID)",
      "status": "string (pending|processing|completed|failed)",
      "fileFormat": "string (json|csv)",
      "requestedAt": "string (ISO timestamp)",
      "completedAt": "string (ISO timestamp, nullable)",
      "expiresAt": "string (ISO timestamp, nullable)",
      "downloadUrl": "string (URL, nullable)",
      "fileSize": "number (bytes, nullable)",
      "errorMessage": "string (nullable)"
    }
  ],
  "canRequestNew": "boolean",
  "nextAvailableRequestDate": "string (ISO date, nullable)"
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing authentication token
- 403 Forbidden: User attempting to access another user's exports

#### GET /api/users/{userId}/data-export/{requestId}/download
**Purpose**: Generate secure download URL for completed export

**Authentication**: Required (JWT token)

**Authorization**: User can only download their own data exports

**Request Parameters**:
- `userId` (path parameter): User ID
- `requestId` (path parameter): Data export request ID

**Response Schema** (200 OK):
```json
{
  "downloadUrl": "string (pre-signed URL, valid for 1 hour)",
  "fileName": "string",
  "fileSize": "number (bytes)",
  "expiresAt": "string (ISO timestamp)"
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing authentication token
- 404 Not Found: Export request not found or not completed
- 410 Gone: Export file has expired


#### POST /api/users/{userId}/account-deletion
**Purpose**: Request account deletion (GDPR Right to Erasure)

**Authentication**: Required (JWT token)

**Authorization**: User can only request their own account deletion

**Request Parameters**:
- `userId` (path parameter): User ID

**Request Body**:
```json
{
  "password": "string (required for verification)",
  "deletionReason": "string (optional, enum: privacy_concerns|switching_platform|no_longer_needed|poor_experience|other)",
  "feedback": "string (optional, max 1000 characters)"
}
```

**Response Schema** (202 Accepted):
```json
{
  "success": true,
  "message": "Account deletion request received. Your account will be permanently deleted after 30 days unless you cancel the request.",
  "requestId": "string (UUID)",
  "gracePeriodEndsAt": "string (ISO date)",
  "cancellationUrl": "string (URL)"
}
```

**Error Responses**:
- 400 Bad Request: Invalid request data or validation errors
- 401 Unauthorized: Invalid or missing authentication token, or incorrect password
- 409 Conflict: Active bookings, outstanding payments, or pending disputes exist
- 409 Conflict: Account deletion request already pending

**Validation Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Cannot delete account due to active bookings or outstanding payments",
  "validationErrors": {
    "activeBookings": "number",
    "outstandingPayments": "number",
    "pendingDisputes": "number"
  },
  "requiredActions": [
    "Complete or cancel all active bookings",
    "Settle all outstanding payments",
    "Resolve all pending disputes"
  ]
}
```

#### GET /api/users/{userId}/account-deletion
**Purpose**: Get status of pending account deletion request

**Authentication**: Required (JWT token)

**Authorization**: User can only view their own account deletion request

**Request Parameters**:
- `userId` (path parameter): User ID

**Response Schema** (200 OK):
```json
{
  "requestId": "string (UUID)",
  "status": "string (pending|cancelled|completed)",
  "deletionReason": "string (nullable)",
  "requestedAt": "string (ISO timestamp)",
  "gracePeriodEndsAt": "string (ISO timestamp)",
  "cancelledAt": "string (ISO timestamp, nullable)",
  "completedAt": "string (ISO timestamp, nullable)",
  "daysRemaining": "number"
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing authentication token
- 404 Not Found: No pending account deletion request


#### DELETE /api/users/{userId}/account-deletion/{requestId}
**Purpose**: Cancel pending account deletion request

**Authentication**: Required (JWT token or cancellation token from email)

**Authorization**: User can only cancel their own account deletion request

**Request Parameters**:
- `userId` (path parameter): User ID
- `requestId` (path parameter): Account deletion request ID

**Query Parameters** (optional):
- `token` (query parameter): Cancellation token from email (alternative to JWT)

**Response Schema** (200 OK):
```json
{
  "success": true,
  "message": "Account deletion request cancelled successfully. Your account remains active."
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing authentication token
- 404 Not Found: Account deletion request not found
- 410 Gone: Account deletion already completed

#### GET /api/users/{userId}/data-retention-policy
**Purpose**: Get data retention policy information

**Authentication**: Required (JWT token)

**Request Parameters**:
- `userId` (path parameter): User ID

**Response Schema** (200 OK):
```json
{
  "categories": [
    {
      "name": "string",
      "description": "string",
      "retentionPeriod": "string",
      "legalBasis": "string"
    }
  ],
  "lastUpdated": "string (ISO timestamp)"
}
```

### Business Logic

#### Data Export Generation
**Export Contents**:
- Profile information: Name, email, phone, address, date of birth, profile photo URL, bio, preferences
- Booking history: All bookings with vehicle details, dates, locations, pricing, status
- Payment history: All transactions, invoices, payment methods (masked), refunds
- Communication history: Emails sent, SMS sent, push notifications sent (content and timestamps)
- Support tickets: All support interactions, chat transcripts, ticket status
- Login history: Login timestamps, IP addresses, device information, user agents
- Verification documents: Driver license data (not images for security), verification status
- Saved preferences: Favorite locations, saved searches, notification preferences
- Privacy settings: All privacy and data sharing preferences
- Loyalty data: Points balance, tier status, rewards history

**Export Format**:
- JSON: Structured hierarchical format with nested objects
- CSV: Flattened format with separate files for each data category (zip archive)

**Export Process**:
1. Create export request record with pending status
2. Queue background job for export generation
3. Send confirmation email to user
4. Background job collects data from all systems
5. Background job generates export file in requested format
6. Background job uploads file to secure storage (S3, Azure Blob)
7. Background job generates pre-signed download URL (valid for 30 days)
8. Background job updates export request with completed status and download URL
9. Send email notification with download link
10. Export file expires after 30 days (automatic deletion)


#### Account Deletion Validation
**Pre-Deletion Checks**:
1. Verify no active bookings (status: confirmed, in_progress, pending_pickup, pending_return)
2. Verify no outstanding payments (unpaid invoices, pending charges)
3. Verify no pending disputes (damage claims, billing disputes)
4. Verify no pending refunds (refunds in processing state)
5. Verify password is correct for security
6. Check if deletion request already pending

**If Validation Fails**:
- Return 409 Conflict with detailed validation errors
- Provide list of required actions to resolve issues
- Do not create deletion request

**If Validation Passes**:
- Create account deletion request with 30-day grace period
- Set account status to "pending_deletion"
- Generate unique cancellation token
- Send confirmation email with cancellation link
- User account remains functional during grace period

#### Account Deletion Processing
**Grace Period (30 Days)**:
- Account remains active and functional
- User can log in and use all features
- User can cancel deletion request at any time
- Display warning banner on all pages about pending deletion
- Send reminder emails at 7 days and 1 day before deletion

**After Grace Period**:
- Background job executes permanent deletion
- Delete personal data:
  - Name, email, phone, address, date of birth
  - Profile photo, bio, emergency contact
  - Preferences, saved locations, saved searches
  - Notification preferences, privacy settings
  - Verification documents (driver license scans, ID photos)
  - Login history, device information
  - Support tickets and chat transcripts
- Anonymize booking history:
  - Replace user name with "Deleted User [UUID]"
  - Remove contact information
  - Retain booking dates, vehicle, location, pricing for analytics
- Retain transaction records:
  - Required for accounting and tax compliance (7 years)
  - Anonymize user name but retain transaction details
  - Retain payment method type (not full details)
- Retain fraud prevention data:
  - As legally permitted for security purposes
  - Hashed identifiers for fraud detection
- Send final confirmation email (to email on file before deletion)
- Mark account as permanently deleted
- Log deletion for compliance audit


#### Data Retention Policy
**Active Accounts**:
- All data retained indefinitely while account is active
- User can update or delete data at any time

**Inactive Accounts**:
- No login for 2 years: Send reminder email
- No login for 3 years: Send final warning email
- No login for 3 years + 6 months: Automatically delete account per inactive account policy

**Deleted Accounts**:
- Personal data: Deleted immediately
- Transaction records: Retained for 7 years (accounting, tax, legal compliance)
- Anonymized booking data: Retained indefinitely for analytics
- Fraud prevention data: Retained as legally permitted (typically 5-7 years)

**Legal Basis for Retention**:
- Transaction records: Legal obligation (tax law, accounting standards)
- Fraud prevention: Legitimate interest (security, fraud prevention)
- Anonymized analytics: Legitimate interest (business analytics, service improvement)

### Authentication Requirements

- All endpoints require valid JWT authentication token
- Token must contain userId claim matching the requested user
- Session must be active and not expired
- Account deletion requires password re-verification for security
- Cancellation token from email can be used as alternative to JWT for cancellation endpoint
- Rate limiting:
  - Data export: 1 request per 30 days per user
  - Account deletion: 1 request per 90 days per user (if cancelled)
  - Download: 10 downloads per hour per user
- Audit logging: All data export and account deletion actions logged with IP address and user agent

## Database Specifications

### Schema Changes

#### DataExportRequests Table (New)
```sql
CREATE TABLE DataExportRequests (
  request_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  request_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  file_format ENUM('json', 'csv') DEFAULT 'json',
  export_file_url VARCHAR(500),
  file_size BIGINT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  error_message TEXT,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  INDEX idx_user_export_requests (user_id),
  INDEX idx_request_status (request_status),
  INDEX idx_requested_at (requested_at),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```


#### AccountDeletionRequests Table (New)
```sql
CREATE TABLE AccountDeletionRequests (
  request_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  request_status ENUM('pending', 'cancelled', 'completed') DEFAULT 'pending',
  deletion_reason ENUM('privacy_concerns', 'switching_platform', 'no_longer_needed', 'poor_experience', 'other'),
  feedback TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grace_period_ends_at TIMESTAMP NOT NULL,
  cancellation_token VARCHAR(255) UNIQUE NOT NULL,
  cancelled_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  INDEX idx_user_deletion_requests (user_id),
  INDEX idx_request_status (request_status),
  INDEX idx_grace_period_ends_at (grace_period_ends_at),
  INDEX idx_cancellation_token (cancellation_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### DataExportDownloads Table (New)
```sql
CREATE TABLE DataExportDownloads (
  download_id VARCHAR(36) PRIMARY KEY,
  request_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (request_id) REFERENCES DataExportRequests(request_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  INDEX idx_request_downloads (request_id),
  INDEX idx_user_downloads (user_id),
  INDEX idx_downloaded_at (downloaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### AccountDeletionAuditLog Table (New)
```sql
CREATE TABLE AccountDeletionAuditLog (
  log_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  request_id VARCHAR(36),
  action ENUM('request_created', 'request_cancelled', 'deletion_completed', 'reminder_sent') NOT NULL,
  action_details TEXT,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (request_id) REFERENCES AccountDeletionRequests(request_id) ON DELETE SET NULL,
  INDEX idx_user_deletion_audit (user_id),
  INDEX idx_request_audit (request_id),
  INDEX idx_performed_at (performed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Users Table Modification
```sql
ALTER TABLE Users 
ADD COLUMN account_status ENUM('active', 'pending_deletion', 'deleted', 'suspended') DEFAULT 'active',
ADD INDEX idx_account_status (account_status);
```


### Relationships

- Users (1) → DataExportRequests (Many): One user can make multiple data export requests over time
- Users (1) → AccountDeletionRequests (Many): One user can make multiple account deletion requests (if cancelled and re-requested)
- DataExportRequests (1) → DataExportDownloads (Many): One export can be downloaded multiple times
- AccountDeletionRequests (1) → AccountDeletionAuditLog (Many): One deletion request generates multiple audit log entries

### Indexes

**Performance Optimization Indexes**:
- `idx_user_export_requests (user_id)`: Fast lookup of user's export requests
- `idx_request_status (request_status)`: Monitor pending/processing export requests for background jobs
- `idx_requested_at (requested_at)`: Time-based queries for export requests
- `idx_expires_at (expires_at)`: Identify expired exports for cleanup jobs
- `idx_user_deletion_requests (user_id)`: Fast lookup of user's deletion requests
- `idx_grace_period_ends_at (grace_period_ends_at)`: Identify deletion requests ready for processing
- `idx_cancellation_token (cancellation_token)`: Fast lookup for email cancellation links
- `idx_request_downloads (request_id)`: Track downloads per export request
- `idx_user_downloads (user_id)`: Track user download activity
- `idx_downloaded_at (downloaded_at)`: Time-based queries for download audit
- `idx_user_deletion_audit (user_id)`: Fast lookup of user deletion audit trail
- `idx_performed_at (performed_at)`: Time-based queries for audit log
- `idx_account_status (account_status)`: Filter users by account status

## Technology Stack

- **Backend**: .NET 8+ with C# and ASP.NET Core Web API
- **Database**: MySQL 8.0+ with InnoDB storage engine
- **Frontend**: Next.js 14+ with React 18+ and TypeScript
- **Authentication**: JWT tokens with .NET Identity
- **File Storage**: AWS S3, Azure Blob Storage, or Google Cloud Storage for export files
- **Background Jobs**: Hangfire, Quartz.NET, or Azure Functions for export generation and account deletion
- **Email Service**: SendGrid, AWS SES, or Azure Communication Services for notifications
- **Encryption**: AES-256 for export file encryption at rest

## Implementation Notes

### GDPR Compliance
- Implement data export within 30 days as required by GDPR Article 20 (Right to Data Portability)
- Implement account deletion as required by GDPR Article 17 (Right to Erasure)
- Provide machine-readable format (JSON or CSV) for data portability
- Maintain audit log of all data export and deletion requests
- Retain only legally required data after account deletion
- Provide clear data retention policy information
- Honor user requests without undue delay
- Verify user identity before processing requests (password verification)


### Data Export Best Practices
- Generate exports asynchronously using background jobs
- Compress export files (gzip) to reduce storage and download time
- Encrypt export files at rest using AES-256
- Use pre-signed URLs with short expiration (1 hour) for downloads
- Automatically delete expired export files after 30 days
- Include metadata in export: generation date, data categories, retention policies
- Provide both JSON (structured) and CSV (spreadsheet-friendly) formats
- For CSV exports, create separate files for each data category in a zip archive
- Include README file in export explaining data structure and categories
- Log all export downloads for security audit
- Rate limit export requests to prevent abuse (1 per 30 days)
- Send email notifications at key stages: request received, export ready, export expiring soon

### Account Deletion Best Practices
- Implement 30-day grace period to prevent accidental deletions
- Validate no active bookings or outstanding payments before accepting deletion request
- Require password re-verification for security
- Send multiple reminder emails during grace period (7 days, 1 day before deletion)
- Provide easy cancellation mechanism (link in email, button in account page)
- Display warning banner on all pages during grace period
- Anonymize rather than delete data where legally required (transaction records)
- Retain fraud prevention data as legally permitted
- Send final confirmation email after deletion is complete
- Log all deletion actions for compliance audit
- Provide clear data retention policy explaining what is deleted and what is retained
- Collect optional feedback to understand why users are leaving

### Security Considerations
- Require password verification for account deletion requests
- Use secure, unique cancellation tokens for email-based cancellation
- Encrypt export files at rest and in transit
- Use pre-signed URLs with short expiration for export downloads
- Rate limit export and deletion requests to prevent abuse
- Log all actions with IP address and user agent for security audit
- Monitor for suspicious patterns (mass deletions, rapid export requests)
- Implement CSRF protection for all state-changing operations
- Validate user authentication and authorization on all endpoints
- Use HTTPS for all communications
- Securely delete export files after expiration (overwrite before deletion)

### Performance Optimization
- Use background jobs for long-running operations (export generation, account deletion)
- Queue export requests and process in batches during off-peak hours
- Use database indexes for fast queries on status and expiration dates
- Cache data retention policy information (rarely changes)
- Compress export files to reduce storage costs
- Use CDN for export file downloads if available
- Monitor background job performance and scale as needed
- Implement job retry logic for transient failures
- Use database transactions for account deletion to ensure data consistency

### User Experience Best Practices
- Provide clear explanations of what data will be exported
- Show estimated timeline for export generation (within 30 days)
- Send email notifications at key stages to keep user informed
- Display export status prominently on account page
- Make download button obvious when export is ready
- Warn users about export expiration (30 days)
- Provide clear warning about permanent nature of account deletion
- Explain grace period and cancellation process clearly
- Display countdown timer for pending deletion
- Make cancellation easy (one-click from email or account page)
- Explain data retention policy in plain language
- Provide contact information for data protection officer
- Offer optional feedback collection to understand user concerns

### Testing Considerations
- Test export generation with various data volumes
- Test export file format (JSON and CSV) for correctness
- Test export download with expired and valid URLs
- Test account deletion validation (active bookings, payments)
- Test grace period countdown and reminder emails
- Test cancellation from email link and account page
- Test permanent deletion after grace period
- Test data retention (what is deleted, what is retained)
- Test rate limiting for export and deletion requests
- Test error handling for all failure scenarios
- Test GDPR compliance with sample data
- Test security: authentication, authorization, password verification
- Test performance with large export files and high request volumes

