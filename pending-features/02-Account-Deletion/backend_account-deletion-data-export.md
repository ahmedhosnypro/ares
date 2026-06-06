# Feature: Account Deletion & Data Export (Backend)

## Overview

Backend implementation for GDPR-compliant account deletion and data export functionality. This service handles data export request processing, export file generation, account deletion validation, grace period management, and permanent data deletion. The implementation ensures compliance with GDPR Article 17 (Right to Erasure) and Article 20 (Right to Data Portability) while maintaining data integrity and security.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

F-AM-018, F-FUNC-UM-010

## Technical Architecture

### Service Layer Components

#### DataExportService
- Handles data export request creation and validation
- Manages export request lifecycle (pending → processing → completed/failed)
- Coordinates data collection from multiple sources
- Generates export files in JSON or CSV format
- Manages export file storage and expiration
- Sends email notifications at key stages
- Implements rate limiting (1 request per 30 days)

#### AccountDeletionService
- Handles account deletion request creation and validation
- Validates no active bookings or outstanding payments
- Manages grace period (30 days)
- Sends reminder emails during grace period
- Processes cancellation requests
- Executes permanent deletion after grace period
- Implements data retention policy
- Anonymizes data where required

#### DataCollectionService
- Collects user data from all system components
- Aggregates profile, booking, payment, communication data
- Formats data for export (JSON or CSV)
- Ensures data completeness and accuracy

#### DataRetentionService
- Implements data retention policy
- Identifies data to delete vs retain
- Anonymizes booking history
- Retains transaction records for legal compliance
- Manages fraud prevention data retention


### Background Job Components

#### DataExportGenerationJob
- Triggered when new export request is created
- Collects data from all sources
- Generates export file (JSON or CSV)
- Compresses and encrypts export file
- Uploads to secure storage (S3, Azure Blob)
- Generates pre-signed download URL
- Updates export request status
- Sends email notification with download link
- Implements retry logic for transient failures

#### AccountDeletionProcessingJob
- Runs daily to check for expired grace periods
- Identifies deletion requests ready for processing
- Executes permanent deletion for each request
- Deletes personal data per retention policy
- Anonymizes booking history
- Retains transaction records
- Updates account status to deleted
- Sends final confirmation email
- Logs deletion for compliance audit

#### ExportFileCleanupJob
- Runs daily to identify expired export files
- Deletes export files older than 30 days
- Updates export request status
- Frees up storage space
- Logs cleanup actions

#### DeletionReminderJob
- Runs daily to identify deletion requests in grace period
- Sends reminder emails at 7 days and 1 day before deletion
- Updates reminder sent status
- Logs reminder actions

## API Implementation

### Data Export Endpoints

#### POST /api/users/{userId}/data-export
**Implementation Details**:
- Validate user authentication and authorization
- Check rate limit (1 request per 30 days)
- Validate file format (json or csv)
- Create DataExportRequest record with pending status
- Queue DataExportGenerationJob
- Send confirmation email
- Return 202 Accepted with request ID

**Rate Limiting**:
- Query DataExportRequests table for user's recent requests
- Check if any request created within last 30 days
- If yes: Return 429 Too Many Requests with next available date
- If no: Allow request creation

**Error Handling**:
- Invalid file format: Return 400 Bad Request
- Rate limit exceeded: Return 429 with retry-after header
- Database error: Return 500 Internal Server Error


#### GET /api/users/{userId}/data-export
**Implementation Details**:
- Validate user authentication and authorization
- Query DataExportRequests table for user's exports
- Order by requested_at DESC
- Calculate canRequestNew based on rate limit
- Calculate nextAvailableRequestDate if rate limited
- Return list of export requests with status

#### GET /api/users/{userId}/data-export/{requestId}/download
**Implementation Details**:
- Validate user authentication and authorization
- Query DataExportRequest by requestId
- Verify export status is completed
- Check export not expired (expires_at > now)
- Generate pre-signed download URL (valid for 1 hour)
- Log download event in DataExportDownloads table
- Return download URL and file metadata

**Pre-Signed URL Generation**:
- Use cloud storage SDK (AWS S3, Azure Blob)
- Set expiration to 1 hour
- Include content-disposition header for filename
- Return secure HTTPS URL

**Error Handling**:
- Export not found: Return 404 Not Found
- Export not completed: Return 404 Not Found
- Export expired: Return 410 Gone
- Storage error: Return 500 Internal Server Error

### Account Deletion Endpoints

#### POST /api/users/{userId}/account-deletion
**Implementation Details**:
- Validate user authentication and authorization
- Verify password using password hashing service
- Check for active bookings (status: confirmed, in_progress, pending_pickup, pending_return)
- Check for outstanding payments (unpaid invoices)
- Check for pending disputes
- Check for existing pending deletion request
- If validation fails: Return 400 or 409 with detailed errors
- If validation passes:
  - Create AccountDeletionRequest record
  - Set grace_period_ends_at to 30 days from now
  - Generate unique cancellation_token
  - Set account status to pending_deletion
  - Send confirmation email with cancellation link
  - Log deletion request in audit log
  - Return 202 Accepted with request details

**Validation Logic**:
```
activeBookings = COUNT(Bookings WHERE user_id = userId AND status IN ('confirmed', 'in_progress', 'pending_pickup', 'pending_return'))
outstandingPayments = COUNT(Payments WHERE user_id = userId AND status = 'unpaid')
pendingDisputes = COUNT(Disputes WHERE user_id = userId AND status = 'pending')

IF activeBookings > 0 OR outstandingPayments > 0 OR pendingDisputes > 0:
  RETURN 409 Conflict with validation errors
```


#### GET /api/users/{userId}/account-deletion
**Implementation Details**:
- Validate user authentication and authorization
- Query AccountDeletionRequests for pending request
- Calculate daysRemaining = (grace_period_ends_at - now) / 86400
- Return deletion request details

#### DELETE /api/users/{userId}/account-deletion/{requestId}
**Implementation Details**:
- Validate authentication (JWT or cancellation token)
- Query AccountDeletionRequest by requestId
- Verify request status is pending
- Update request status to cancelled
- Set cancelled_at timestamp
- Set account status back to active
- Send cancellation confirmation email
- Log cancellation in audit log
- Return 200 OK

**Token-Based Cancellation**:
- Accept cancellation_token as query parameter
- Validate token matches request
- Allow cancellation without JWT authentication
- Useful for email-based cancellation links

## Business Logic Implementation

### Data Export Generation

**Data Collection Process**:
1. Query Users table for profile data
2. Query Bookings table for booking history
3. Query Payments table for payment history
4. Query Communications table for email/SMS history
5. Query SupportTickets table for support interactions
6. Query LoginHistory table for login activity
7. Query VerificationDocuments table for verification data
8. Query SavedPreferences table for user preferences
9. Query PrivacySettings table for privacy preferences
10. Query LoyaltyPoints table for loyalty data

**JSON Export Format**:
```json
{
  "exportMetadata": {
    "exportDate": "ISO timestamp",
    "userId": "UUID",
    "dataCategories": ["profile", "bookings", "payments", ...],
    "retentionPolicy": "URL to retention policy"
  },
  "profile": { /* profile data */ },
  "bookings": [ /* array of bookings */ ],
  "payments": [ /* array of payments */ ],
  "communications": [ /* array of communications */ ],
  "supportTickets": [ /* array of tickets */ ],
  "loginHistory": [ /* array of logins */ ],
  "verificationDocuments": [ /* array of documents */ ],
  "preferences": { /* preferences data */ },
  "privacySettings": { /* privacy settings */ },
  "loyalty": { /* loyalty data */ }
}
```

**CSV Export Format**:
- Create separate CSV file for each data category
- Flatten nested objects into columns
- Package all CSV files into ZIP archive
- Include README.txt explaining file structure

**File Processing**:
- Compress export file using gzip
- Encrypt file using AES-256
- Upload to secure storage with unique key
- Generate pre-signed URL with 30-day expiration
- Store URL in DataExportRequest record


### Account Deletion Processing

**Deletion Execution Logic**:
```
FOR EACH AccountDeletionRequest WHERE status = 'pending' AND grace_period_ends_at <= NOW():
  BEGIN TRANSACTION
  
  // Delete personal data
  DELETE FROM ProfilePhotos WHERE user_id = request.user_id
  DELETE FROM VerificationDocuments WHERE user_id = request.user_id
  DELETE FROM SavedPreferences WHERE user_id = request.user_id
  DELETE FROM PrivacySettings WHERE user_id = request.user_id
  DELETE FROM LoginHistory WHERE user_id = request.user_id
  DELETE FROM SupportTickets WHERE user_id = request.user_id
  DELETE FROM Communications WHERE user_id = request.user_id
  
  // Anonymize booking history
  UPDATE Bookings 
  SET customer_name = 'Deleted User ' + request.user_id,
      customer_email = NULL,
      customer_phone = NULL
  WHERE user_id = request.user_id
  
  // Anonymize transaction records (retain for 7 years)
  UPDATE Payments
  SET customer_name = 'Deleted User ' + request.user_id,
      customer_email = NULL
  WHERE user_id = request.user_id
  
  // Update user record
  UPDATE Users
  SET first_name = 'Deleted',
      last_name = 'User',
      email = 'deleted_' + request.user_id + '@deleted.local',
      phone = NULL,
      address = NULL,
      date_of_birth = NULL,
      bio = NULL,
      account_status = 'deleted'
  WHERE user_id = request.user_id
  
  // Update deletion request
  UPDATE AccountDeletionRequests
  SET request_status = 'completed',
      completed_at = NOW()
  WHERE request_id = request.request_id
  
  // Log deletion
  INSERT INTO AccountDeletionAuditLog (action, user_id, request_id, performed_at)
  VALUES ('deletion_completed', request.user_id, request.request_id, NOW())
  
  COMMIT TRANSACTION
  
  // Send final confirmation email
  SendEmail(request.user_email, 'Account Deletion Completed', ...)
END FOR
```

**Data Retention Rules**:
- Personal data: Delete immediately
- Booking history: Anonymize (retain dates, vehicle, location, pricing)
- Transaction records: Anonymize but retain for 7 years (legal requirement)
- Fraud prevention data: Retain hashed identifiers for 5-7 years
- Analytics data: Already anonymized, retain indefinitely

## Security Implementation

### Authentication & Authorization
- All endpoints require valid JWT token
- Verify userId in token matches path parameter
- Account deletion requires password re-verification
- Cancellation endpoint accepts token from email as alternative
- Implement CSRF protection for state-changing operations

### Rate Limiting
- Data export: 1 request per 30 days per user
- Account deletion: 1 request per 90 days per user (if cancelled)
- Download: 10 downloads per hour per user
- Implement using Redis or in-memory cache
- Return 429 Too Many Requests with Retry-After header

### Audit Logging
- Log all data export requests with IP and user agent
- Log all account deletion requests with IP and user agent
- Log all download events
- Log all cancellation events
- Log all deletion completions
- Store logs for 7 years for compliance

### Data Encryption
- Encrypt export files at rest using AES-256
- Use HTTPS for all API communications
- Use pre-signed URLs with short expiration for downloads
- Securely delete export files after expiration (overwrite before deletion)

## Technology Stack

- **Backend Framework**: .NET 8+ with C# and ASP.NET Core Web API
- **Database**: MySQL 8.0+ with InnoDB storage engine
- **Background Jobs**: Hangfire or Quartz.NET for scheduled jobs
- **File Storage**: AWS S3, Azure Blob Storage, or Google Cloud Storage
- **Email Service**: SendGrid, AWS SES, or Azure Communication Services
- **Caching**: Redis for rate limiting and session management
- **Encryption**: AES-256 for file encryption, bcrypt for password hashing

## Implementation Notes

### Performance Optimization
- Use background jobs for long-running operations
- Process export requests in batches during off-peak hours
- Use database indexes for fast queries
- Implement connection pooling for database access
- Use async/await for I/O operations
- Cache data retention policy (rarely changes)
- Monitor job performance and scale as needed

### Error Handling
- Implement retry logic for transient failures (3 retries with exponential backoff)
- Log all errors with context for debugging
- Send error notifications to operations team
- Update export request status to failed on permanent errors
- Provide user-friendly error messages
- Implement circuit breaker for external service calls

### Testing Strategy
- Unit tests for all service methods
- Integration tests for API endpoints
- End-to-end tests for complete workflows
- Load tests for export generation with large datasets
- Security tests for authentication and authorization
- Compliance tests for GDPR requirements

