# Feature: Privacy Controls (Backend)

## Overview

Backend implementation for Privacy Controls providing API endpoints, business logic, and data management for user privacy settings including profile visibility, app permissions, data sharing preferences, marketing preferences, cookie settings, and GDPR rights (data export and account deletion).

## Sprint Category

sprint-01

## Feature ID

F-AM-017

## API Endpoints

### GET /api/users/{userId}/privacy-settings
Retrieve user's complete privacy settings including visibility, permissions, data sharing, marketing, and cookie preferences.

### PUT /api/users/{userId}/privacy-settings
Update user's privacy settings with validation and immediate enforcement.

### POST /api/users/{userId}/data-export
Request GDPR-compliant data export with all user data in machine-readable format.

### GET /api/users/{userId}/data-export/{requestId}
Check status of data export request and retrieve download URL when ready.

### POST /api/users/{userId}/account-deletion
Request account deletion with 30-day grace period (GDPR Right to Erasure).

### DELETE /api/users/{userId}/account-deletion/{requestId}
Cancel pending account deletion request during grace period.

## Business Logic

### Profile Visibility Enforcement
- Public: Profile visible to all users and suppliers (name, photo, verification badges, reviews)
- Private: Profile visible only to confirmed booking parties (name, phone for coordination)
- Friends: Profile visible to connected users (if social features enabled)
- Apply visibility rules to all profile API responses
- Filter profile data based on requesting user's relationship to profile owner

### Data Sharing Enforcement
- Analytics data: Exclude user from analytics aggregation if disabled
- Marketing partners: Do not share email/phone with partners if disabled
- Insurance providers: Only share data when required for active claims if disabled
- Payment processors: Always enabled (required for transactions)
- Mapping services: Always enabled (required for location features)
- Log all data sharing events for compliance audit

### Marketing Preferences Enforcement
- Respect all marketing opt-outs immediately
- Maintain separate opt-out lists for each channel (email, SMS, push, phone, postal)
- Include unsubscribe link in all marketing communications
- Honor unsubscribe requests within 24 hours
- Sync opt-outs with email service provider (SendGrid, AWS SES)
- Log all marketing preference changes for compliance audit

### Cookie Preferences Enforcement
- Essential cookies: Always enabled (authentication, security, session)
- Functional cookies: Do not store non-essential preferences if disabled
- Analytics cookies: Do not track user behavior or page views if disabled
- Marketing cookies: Do not serve personalized ads or retargeting if disabled
- Set cookie consent flags in user session
- Respect cookie preferences across all platform domains

### Data Export Generation (GDPR Article 20)
- Queue background job for data export generation
- Collect all user data from all systems:
  - Profile information (name, email, phone, address, preferences)
  - Booking history (all bookings with details, dates, vehicles, locations)
  - Payment history (all transactions, invoices, refunds)
  - Communication history (emails, SMS, push notifications sent)
  - Support tickets and chat transcripts
  - Login history and device information
  - Verification documents (driver license, ID scans)
  - Privacy settings and audit log
- Generate machine-readable file (JSON or CSV format)
- Include metadata: export date, data categories, retention policies
- Upload to secure storage (S3, Azure Blob) with 30-day expiration
- Generate secure download link with token authentication
- Send email notification with download link
- Log export request for compliance audit
- Limit to 1 export request per 30 days per user

### Account Deletion Processing (GDPR Article 17)
- Validate no active bookings or outstanding payments
- Require password re-verification for security
- Create account deletion request with 30-day grace period
- Generate unique cancellation token for grace period cancellation
- Set account status to "pending deletion"
- Send confirmation email with cancellation link
- During grace period: User can cancel deletion request via email link or account settings
- After grace period: Background job executes deletion:
  - Delete personal data: name, email, phone, address, profile photo, bio, preferences
  - Delete verification documents: driver license scans, ID photos
  - Anonymize booking history: Replace name with "Deleted User [ID]", remove contact info
  - Retain transaction records: Required for accounting and tax compliance (7 years)
  - Retain fraud prevention data: Required for security (as legally permitted)
  - Delete user account and authentication credentials
- Send final confirmation email of account deletion
- Log deletion for compliance audit
- Limit to 1 deletion request per 90 days per user (if cancelled)

## Technology Stack

- **Backend Framework**: .NET 8+ with C# and ASP.NET Core Web API
- **Database**: MySQL 8.0+ with InnoDB storage engine
- **Authentication**: JWT tokens with .NET Identity
- **File Storage**: AWS S3, Azure Blob Storage for data export files
- **Email Service**: SendGrid, AWS SES for notification emails
- **Background Jobs**: Hangfire, Quartz.NET for data export and account deletion processing
- **Caching**: Redis for privacy settings caching
