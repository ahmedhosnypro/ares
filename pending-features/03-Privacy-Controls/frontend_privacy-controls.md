# Feature: Privacy Controls

## Overview

Privacy Controls provides users with granular control over their personal data and privacy settings. Users can manage data visibility, control app permissions (location, camera, photo library), configure data sharing preferences, manage marketing communications, set cookie preferences, and exercise GDPR rights including data portability and right to erasure. This feature ensures transparency in data usage, builds user trust, and maintains compliance with privacy regulations including GDPR, CCPA, and other data protection laws.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

F-AM-017

## User Stories

**As a privacy-conscious user**, I want to control what personal information is visible to suppliers and other users, so that I can protect my privacy while using the platform.

**As a registered user**, I want to manage app permissions for location, camera, and photos, so that I only share data when necessary for the service.

**As a user concerned about data sharing**, I want to opt out of data sharing with third-party partners, so that my information stays within the platform.

**As a user who values privacy**, I want to opt out of marketing communications and control cookie settings, so that I'm not tracked unnecessarily.

**As an EU resident**, I want to exercise my GDPR rights to download my data and request account deletion, so that I maintain control over my personal information.

## Frontend Specifications

### Pages

#### Privacy & Data Page (`/account/privacy`)
- Profile visibility controls section
- App permissions management section
- Data sharing preferences section
- Marketing preferences section
- Cookie preferences section
- GDPR rights section (data export, account deletion)
- Privacy policy link
- Data protection officer contact information
- Save/Cancel buttons with unsaved changes warning
- Success/error notifications for preference updates


### UI Components

#### ProfileVisibilityControl Component
- Radio buttons or dropdown for visibility levels:
  - Public: Profile visible to all users and suppliers
  - Private: Profile visible only to confirmed booking parties
  - Friends: Profile visible to connected users only (if social features enabled)
- Explanation text for each visibility level
- Preview of what information is visible at each level
- Real-time update without page reload

#### PermissionControl Component
- Toggle switches for each permission type:
  - Location access (for nearby vehicle search, pickup/return verification)
  - Camera access (for document scanning, damage inspection)
  - Photo library access (for profile photo, document upload)
  - Microphone access (for voice search, customer support)
  - Notifications (for booking updates, reminders)
- Current permission status indicator (granted, denied, not requested)
- Explanation of why each permission is needed
- Link to device settings for system-level permission management
- Warning if denying permission will limit functionality

#### DataSharingControl Component
- Toggle switches for data sharing categories:
  - Analytics and performance data
  - Third-party marketing partners
  - Insurance providers (for claims processing)
  - Payment processors (required for transactions)
  - Mapping services (required for location features)
- Explanation of what data is shared with each category
- Required vs optional data sharing indicators
- Links to partner privacy policies

#### MarketingPreferencesControl Component
- Toggle switches for marketing channels:
  - Email marketing
  - SMS marketing
  - Push notification marketing
  - Phone call marketing
  - Postal mail marketing
- Separate controls for:
  - Platform promotions and offers
  - Partner promotions
  - Survey and feedback requests
  - Product updates and announcements
- "Unsubscribe from all marketing" quick action button
- Confirmation dialog for unsubscribe all action

#### CookiePreferencesControl Component
- Toggle switches for cookie categories:
  - Essential cookies (always enabled, cannot be disabled)
  - Functional cookies (remember preferences, language)
  - Analytics cookies (usage statistics, performance monitoring)
  - Marketing cookies (personalized ads, retargeting)
- Explanation of each cookie category
- List of specific cookies used in each category
- "Accept all" and "Reject all non-essential" quick action buttons
- Link to detailed cookie policy

#### GDPRRightsSection Component
- Data export request button with explanation
- Account deletion request button with warning
- Data portability information
- Right to erasure information
- Right to rectification link (edit profile)
- Right to restriction of processing information
- Right to object to processing information
- Data protection officer contact information
- Links to privacy policy and terms of service

### User Flows

#### Update Privacy Settings Flow
1. User navigates to Privacy & Data page
2. System displays current privacy settings grouped by category
3. User adjusts profile visibility level
4. User toggles app permissions (system permissions require device settings)
5. User configures data sharing preferences
6. User updates marketing preferences
7. User sets cookie preferences
8. User clicks Save button
9. System validates preferences
10. System updates preferences in database
11. System displays success message
12. System applies new privacy settings immediately
13. System sends confirmation email of privacy changes


#### Request Data Export Flow (GDPR)
1. User navigates to Privacy & Data page
2. User clicks "Export My Data" button in GDPR Rights section
3. System displays confirmation dialog explaining:
   - What data will be included in export
   - Export will be ready within 30 days
   - User will receive email when export is ready
   - Export file will expire after 30 days
4. User confirms export request
5. System creates data export request record
6. System queues background job for data export generation
7. System displays success message with request ID
8. System sends confirmation email
9. Background job collects all user data (profile, bookings, payments, communications)
10. Background job generates export file (JSON or CSV format)
11. Background job uploads export file to secure storage
12. System sends email notification with download link
13. User downloads export file within 30-day expiration period

#### Request Account Deletion Flow (GDPR Right to Erasure)
1. User navigates to Privacy & Data page
2. User clicks "Delete My Account" button in GDPR Rights section
3. System displays warning dialog explaining:
   - Account deletion is permanent and cannot be undone
   - Active bookings must be completed or cancelled first
   - Outstanding payments must be settled
   - Some data may be retained for legal/accounting purposes (7 years)
   - 30-day grace period before permanent deletion
4. User confirms understanding and enters password for verification
5. System validates no active bookings or outstanding payments
6. If validation fails: System displays error with details and required actions
7. If validation passes: System creates account deletion request
8. System sets account status to "pending deletion"
9. System sends confirmation email with cancellation link
10. System displays success message with grace period information
11. User has 30 days to cancel deletion request
12. After 30 days: Background job permanently deletes account and personal data
13. System retains only legally required data (transaction records, tax documents)
14. System sends final confirmation email of account deletion

#### Manage App Permissions Flow
1. User navigates to Privacy & Data page
2. User views current permission status for each permission type
3. User toggles permission switch (e.g., location access)
4. If enabling permission:
   - System requests permission from device OS
   - User grants or denies permission in system dialog
   - System updates permission status display
5. If disabling permission:
   - System displays warning about limited functionality
   - User confirms disabling permission
   - System directs user to device settings to revoke permission
   - System updates permission status display
6. System saves permission preferences
7. System applies permission changes immediately to app functionality

### Data Requirements

#### Privacy Settings Data from Backend
- User ID
- Profile visibility level (public, private, friends)
- App permissions status:
  - location (granted, denied, not_requested)
  - camera (granted, denied, not_requested)
  - photos (granted, denied, not_requested)
  - microphone (granted, denied, not_requested)
  - notifications (granted, denied, not_requested)
- Data sharing preferences:
  - analytics_data (boolean)
  - marketing_partners (boolean)
  - insurance_providers (boolean)
  - payment_processors (boolean, always true)
  - mapping_services (boolean, always true)
- Marketing preferences:
  - email_marketing (boolean)
  - sms_marketing (boolean)
  - push_marketing (boolean)
  - phone_marketing (boolean)
  - postal_marketing (boolean)
  - platform_promotions (boolean)
  - partner_promotions (boolean)
  - surveys (boolean)
  - product_updates (boolean)
- Cookie preferences:
  - functional_cookies (boolean)
  - analytics_cookies (boolean)
  - marketing_cookies (boolean)
- GDPR rights status:
  - data_export_requests (array of request objects)
  - account_deletion_request (object or null)
- Last updated timestamp

#### Data Export Request Data
- Request ID
- User ID
- Request status (pending, processing, completed, failed)
- Requested timestamp
- Completed timestamp
- Export file URL (when ready)
- Expiration timestamp

#### Account Deletion Request Data
- Request ID
- User ID
- Request status (pending, cancelled, completed)
- Requested timestamp
- Grace period end timestamp
- Cancellation link token
- Deletion reason (optional)


## Backend Specifications

### API Endpoints

#### GET /api/users/{userId}/privacy-settings
**Purpose**: Retrieve user's privacy settings and preferences

**Authentication**: Required (JWT token)

**Authorization**: User can only access their own privacy settings

**Request Parameters**:
- `userId` (path parameter): User ID

**Response Schema** (200 OK):
```json
{
  "userId": "string (UUID)",
  "profileVisibility": "string (public|private|friends)",
  "appPermissions": {
    "location": "string (granted|denied|not_requested)",
    "camera": "string (granted|denied|not_requested)",
    "photos": "string (granted|denied|not_requested)",
    "microphone": "string (granted|denied|not_requested)",
    "notifications": "string (granted|denied|not_requested)"
  },
  "dataSharing": {
    "analyticsData": "boolean",
    "marketingPartners": "boolean",
    "insuranceProviders": "boolean",
    "paymentProcessors": "boolean (always true)",
    "mappingServices": "boolean (always true)"
  },
  "marketingPreferences": {
    "emailMarketing": "boolean",
    "smsMarketing": "boolean",
    "pushMarketing": "boolean",
    "phoneMarketing": "boolean",
    "postalMarketing": "boolean",
    "platformPromotions": "boolean",
    "partnerPromotions": "boolean",
    "surveys": "boolean",
    "productUpdates": "boolean"
  },
  "cookiePreferences": {
    "functionalCookies": "boolean",
    "analyticsCookies": "boolean",
    "marketingCookies": "boolean"
  },
  "updatedAt": "string (ISO timestamp)"
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing authentication token
- 403 Forbidden: User attempting to access another user's privacy settings
- 404 Not Found: User privacy settings not found

#### PUT /api/users/{userId}/privacy-settings
**Purpose**: Update user's privacy settings and preferences

**Authentication**: Required (JWT token)

**Authorization**: User can only update their own privacy settings

**Request Parameters**:
- `userId` (path parameter): User ID

**Request Body**:
```json
{
  "profileVisibility": "string (public|private|friends, optional)",
  "appPermissions": {
    "location": "string (granted|denied, optional)",
    "camera": "string (granted|denied, optional)",
    "photos": "string (granted|denied, optional)",
    "microphone": "string (granted|denied, optional)",
    "notifications": "string (granted|denied, optional)"
  },
  "dataSharing": {
    "analyticsData": "boolean (optional)",
    "marketingPartners": "boolean (optional)",
    "insuranceProviders": "boolean (optional)"
  },
  "marketingPreferences": {
    "emailMarketing": "boolean (optional)",
    "smsMarketing": "boolean (optional)",
    "pushMarketing": "boolean (optional)",
    "phoneMarketing": "boolean (optional)",
    "postalMarketing": "boolean (optional)",
    "platformPromotions": "boolean (optional)",
    "partnerPromotions": "boolean (optional)",
    "surveys": "boolean (optional)",
    "productUpdates": "boolean (optional)"
  },
  "cookiePreferences": {
    "functionalCookies": "boolean (optional)",
    "analyticsCookies": "boolean (optional)",
    "marketingCookies": "boolean (optional)"
  }
}
```

**Response Schema** (200 OK):
```json
{
  "success": true,
  "message": "Privacy settings updated successfully",
  "settings": { /* Updated privacy settings object */ }
}
```

**Error Responses**:
- 400 Bad Request: Invalid data format or validation errors
- 401 Unauthorized: Invalid or missing authentication token
- 403 Forbidden: User attempting to update another user's privacy settings

#### POST /api/users/{userId}/data-export
**Purpose**: Request GDPR-compliant data export

**Authentication**: Required (JWT token)

**Authorization**: User can only request their own data export

**Request Parameters**:
- `userId` (path parameter): User ID

**Response Schema** (202 Accepted):
```json
{
  "success": true,
  "message": "Data export request received. You will receive an email when your export is ready (within 30 days).",
  "requestId": "string (UUID)",
  "estimatedCompletionDate": "string (ISO date)"
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing authentication token
- 429 Too Many Requests: User has exceeded data export request limit (1 per 30 days)

#### GET /api/users/{userId}/data-export/{requestId}
**Purpose**: Check status of data export request

**Authentication**: Required (JWT token)

**Authorization**: User can only check their own data export requests

**Request Parameters**:
- `userId` (path parameter): User ID
- `requestId` (path parameter): Data export request ID

**Response Schema** (200 OK):
```json
{
  "requestId": "string (UUID)",
  "status": "string (pending|processing|completed|failed)",
  "requestedAt": "string (ISO timestamp)",
  "completedAt": "string (ISO timestamp, nullable)",
  "downloadUrl": "string (URL, nullable)",
  "expiresAt": "string (ISO timestamp, nullable)"
}
```


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
  "reason": "string (optional)",
  "feedback": "string (optional)"
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
- 400 Bad Request: Active bookings or outstanding payments exist
- 401 Unauthorized: Invalid or missing authentication token, or incorrect password
- 409 Conflict: Account deletion request already pending

#### DELETE /api/users/{userId}/account-deletion/{requestId}
**Purpose**: Cancel pending account deletion request

**Authentication**: Required (JWT token or cancellation token from email)

**Authorization**: User can only cancel their own account deletion request

**Request Parameters**:
- `userId` (path parameter): User ID
- `requestId` (path parameter): Account deletion request ID

**Response Schema** (200 OK):
```json
{
  "success": true,
  "message": "Account deletion request cancelled successfully. Your account remains active."
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing authentication token
- 404 Not Found: Account deletion request not found or already processed

### Business Logic

#### Profile Visibility Enforcement
- Public: Profile information visible to all users and suppliers
  - Visible: Name, profile photo, verification badges, reviews received
  - Hidden: Email, phone, address, date of birth, emergency contact
- Private: Profile information visible only to confirmed booking parties
  - Visible to booking parties: Name, phone (for coordination), verification badges
  - Hidden from others: All profile information
- Friends: Profile information visible to connected users (if social features enabled)
  - Visible to friends: Name, profile photo, bio, verification badges, reviews
  - Hidden from others: All profile information

#### Data Sharing Enforcement
- Analytics data: If disabled, exclude user from analytics aggregation
- Marketing partners: If disabled, do not share email/phone with partners
- Insurance providers: If disabled, only share data when required for active claims
- Payment processors: Always enabled (required for transactions)
- Mapping services: Always enabled (required for location features)

#### Marketing Preferences Enforcement
- Respect all marketing opt-outs immediately
- Maintain separate opt-out lists for each channel
- Include unsubscribe link in all marketing communications
- Honor unsubscribe requests within 24 hours
- Log all marketing preference changes for compliance audit

#### Cookie Preferences Enforcement
- Essential cookies: Always enabled (authentication, security, session management)
- Functional cookies: If disabled, do not store non-essential preferences
- Analytics cookies: If disabled, do not track user behavior or page views
- Marketing cookies: If disabled, do not serve personalized ads or retargeting

#### Data Export Generation (GDPR)
- Collect all user data from all systems:
  - Profile information (name, email, phone, address, preferences)
  - Booking history (all bookings with details)
  - Payment history (all transactions and invoices)
  - Communication history (emails, SMS, push notifications sent)
  - Support tickets and chat transcripts
  - Login history and device information
  - Verification documents (driver license, ID scans)
- Generate machine-readable file (JSON or CSV format)
- Include metadata: export date, data categories, retention policies
- Upload to secure storage with 30-day expiration
- Send email notification with secure download link
- Log export request for compliance audit

#### Account Deletion Processing (GDPR Right to Erasure)
- Validate no active bookings or outstanding payments
- Create account deletion request with 30-day grace period
- Set account status to "pending deletion"
- Send confirmation email with cancellation link
- During grace period: User can cancel deletion request
- After grace period: Background job executes deletion:
  - Delete personal data: name, email, phone, address, profile photo, bio
  - Delete preferences: notification settings, privacy settings, saved locations
  - Delete verification documents: driver license scans, ID photos
  - Anonymize booking history: Replace name with "Deleted User", remove contact info
  - Retain transaction records: Required for accounting and tax compliance (7 years)
  - Retain fraud prevention data: Required for security (as legally permitted)
- Send final confirmation email of account deletion
- Log deletion for compliance audit

### Authentication Requirements

- All privacy settings endpoints require valid JWT authentication token
- Token must contain userId claim matching the requested settings
- Session must be active and not expired
- Account deletion requires password re-verification for security
- Rate limiting: 50 requests per minute per user for privacy settings endpoints
- Rate limiting: 1 data export request per 30 days per user
- Rate limiting: 1 account deletion request per 90 days per user (if cancelled)


## Database Specifications

### Schema Changes

#### PrivacySettings Table (New)
```sql
CREATE TABLE PrivacySettings (
  setting_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  profile_visibility ENUM('public', 'private', 'friends') DEFAULT 'public',
  location_permission ENUM('granted', 'denied', 'not_requested') DEFAULT 'not_requested',
  camera_permission ENUM('granted', 'denied', 'not_requested') DEFAULT 'not_requested',
  photos_permission ENUM('granted', 'denied', 'not_requested') DEFAULT 'not_requested',
  microphone_permission ENUM('granted', 'denied', 'not_requested') DEFAULT 'not_requested',
  notifications_permission ENUM('granted', 'denied', 'not_requested') DEFAULT 'not_requested',
  analytics_data_sharing BOOLEAN DEFAULT TRUE,
  marketing_partners_sharing BOOLEAN DEFAULT FALSE,
  insurance_providers_sharing BOOLEAN DEFAULT TRUE,
  payment_processors_sharing BOOLEAN DEFAULT TRUE,
  mapping_services_sharing BOOLEAN DEFAULT TRUE,
  email_marketing BOOLEAN DEFAULT TRUE,
  sms_marketing BOOLEAN DEFAULT FALSE,
  push_marketing BOOLEAN DEFAULT TRUE,
  phone_marketing BOOLEAN DEFAULT FALSE,
  postal_marketing BOOLEAN DEFAULT FALSE,
  platform_promotions BOOLEAN DEFAULT TRUE,
  partner_promotions BOOLEAN DEFAULT FALSE,
  surveys BOOLEAN DEFAULT TRUE,
  product_updates BOOLEAN DEFAULT TRUE,
  functional_cookies BOOLEAN DEFAULT TRUE,
  analytics_cookies BOOLEAN DEFAULT TRUE,
  marketing_cookies BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  INDEX idx_user_privacy_settings (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### DataExportRequests Table (New)
```sql
CREATE TABLE DataExportRequests (
  request_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  request_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  export_file_url VARCHAR(500),
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  error_message TEXT,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  INDEX idx_user_export_requests (user_id),
  INDEX idx_request_status (request_status),
  INDEX idx_requested_at (requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### AccountDeletionRequests Table (New)
```sql
CREATE TABLE AccountDeletionRequests (
  request_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  request_status ENUM('pending', 'cancelled', 'completed') DEFAULT 'pending',
  deletion_reason VARCHAR(255),
  feedback TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grace_period_ends_at TIMESTAMP NOT NULL,
  cancellation_token VARCHAR(255) UNIQUE,
  cancelled_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  INDEX idx_user_deletion_requests (user_id),
  INDEX idx_request_status (request_status),
  INDEX idx_grace_period_ends_at (grace_period_ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### PrivacySettingsAuditLog Table (New)
```sql
CREATE TABLE PrivacySettingsAuditLog (
  log_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  setting_changed VARCHAR(100) NOT NULL,
  old_value VARCHAR(255),
  new_value VARCHAR(255),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  INDEX idx_user_privacy_audit (user_id),
  INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- Users (1) → PrivacySettings (1): One user has one privacy settings record
- Users (1) → DataExportRequests (Many): One user can make multiple data export requests
- Users (1) → AccountDeletionRequests (Many): One user can make multiple account deletion requests (if cancelled)
- Users (1) → PrivacySettingsAuditLog (Many): One user can have many privacy settings audit log entries

### Indexes

**Performance Optimization Indexes**:
- `idx_user_privacy_settings (user_id)`: Fast lookup of user privacy settings
- `idx_user_export_requests (user_id)`: Fast lookup of user data export requests
- `idx_request_status (request_status)`: Monitor pending export requests
- `idx_requested_at (requested_at)`: Time-based queries for export requests
- `idx_user_deletion_requests (user_id)`: Fast lookup of user account deletion requests
- `idx_grace_period_ends_at (grace_period_ends_at)`: Identify deletion requests ready for processing
- `idx_user_privacy_audit (user_id)`: Fast lookup of user privacy audit log
- `idx_changed_at (changed_at)`: Time-based queries for audit log

## Technology Stack

- **Backend**: .NET 8+ with C# and ASP.NET Core Web API
- **Database**: MySQL 8.0+ with InnoDB storage engine
- **Frontend**: Next.js 14+ with React 18+ and TypeScript
- **Authentication**: JWT tokens with .NET Identity
- **File Storage**: AWS S3, Azure Blob Storage, or similar for data export files
- **Email Service**: SendGrid, AWS SES, or similar for notification emails
- **Background Jobs**: Hangfire, Quartz.NET, or similar for data export and account deletion processing

## Implementation Notes

### Default Privacy Settings
- Set sensible defaults that balance privacy and functionality
- Profile visibility: Public (to enable supplier discovery)
- Data sharing: Analytics enabled, marketing partners disabled
- Marketing preferences: Platform promotions enabled, partner promotions disabled
- Cookie preferences: All enabled (user can opt out)
- Provide clear explanations for each default setting

### GDPR Compliance
- Implement data export within 30 days as required by GDPR Article 20
- Implement account deletion (right to erasure) as required by GDPR Article 17
- Maintain audit log of all privacy setting changes for compliance
- Retain only legally required data after account deletion
- Provide clear privacy policy explaining data usage
- Obtain explicit consent for non-essential data processing
- Honor data subject rights: access, rectification, erasure, restriction, portability, objection

### Data Retention Policy
- Active accounts: Retain all data indefinitely
- Inactive accounts (no login for 3 years): Send reminder email, then delete after 6 months
- Deleted accounts: Retain transaction records for 7 years (accounting/tax compliance)
- Deleted accounts: Retain fraud prevention data as legally permitted
- Data export files: Expire after 30 days
- Audit logs: Retain for 7 years for compliance

### Security Considerations
- Encrypt sensitive privacy settings at rest
- Use HTTPS for all privacy-related communications
- Implement CSRF protection for privacy settings forms
- Require password re-verification for account deletion
- Rate limit data export and account deletion requests to prevent abuse
- Log all privacy setting changes with IP address and user agent
- Monitor for suspicious privacy setting changes (e.g., mass opt-outs)

### User Experience Best Practices
- Provide clear explanations for each privacy setting
- Use plain language, avoid legal jargon
- Show impact of privacy settings on functionality (e.g., "Disabling location will prevent nearby vehicle search")
- Provide granular controls, not just "all or nothing"
- Make it easy to opt out of marketing (one-click unsubscribe)
- Respect user choices immediately, no delays
- Send confirmation emails for significant privacy changes
- Provide transparency reports showing data usage

### Mobile Considerations
- Request app permissions at appropriate time (when feature is used, not on app launch)
- Explain why each permission is needed before requesting
- Provide in-app settings to manage permissions
- Direct users to device settings for system-level permission management
- Handle permission denial gracefully with alternative functionality
- Respect device-level privacy settings (e.g., "Limit Ad Tracking" on iOS)

### Performance Optimization
- Cache privacy settings in Redis for fast lookup
- Invalidate cache on privacy settings updates
- Use database indexes for fast queries
- Batch data export generation for efficiency
- Use background jobs for long-running operations (data export, account deletion)
- Monitor data export and account deletion job performance
