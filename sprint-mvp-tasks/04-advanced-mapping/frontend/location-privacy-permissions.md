# Feature: Location Privacy and Permissions

## Overview

Provide customers with control over their location data through transparent permission requests, clear usage explanations, and privacy controls. The system requests location permission with clear value proposition, respects permission denial without degrading core functionality, minimizes location data retention, and complies with GDPR and CCPA requirements. Privacy-first approach builds trust while enabling location-based features.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-MAP-013

## User Stories

As a customer, I want control over my location data, so that my privacy is respected and I understand how my location is used.

As a privacy-conscious user, I want to use the platform without sharing my location, so that I can maintain my privacy while still accessing core features.

As a platform operator, I want to comply with location data regulations, so that the platform meets GDPR and CCPA requirements.

## Frontend Specifications

### Pages

- Location Permission Request Modal
- Privacy Settings Page with Location Controls
- Privacy Policy Page with Location Data Section
- User Profile with Location History

### UI Components

**Location Permission Modal**:
- Clear headline explaining why location is needed
- Benefits list (find nearby vehicles, faster search, personalized recommendations)
- Visual illustration showing location usage
- "Allow" button (primary action)
- "Not now" button (secondary action)
- "Learn more" link to privacy policy
- Never show again checkbox (for "Not now")

**Location Privacy Controls**:
- Location permission status indicator (granted, denied, not requested)
- Toggle to enable/disable location services
- "Request permission again" button if denied
- Location accuracy selector (precise, approximate, off)
- Location history toggle (save location history or not)
- Delete location history button
- Download location data button (GDPR compliance)

**Location Usage Transparency**:
- List of features using location data
- Purpose explanation for each feature
- Data retention period for each purpose
- Third-party sharing disclosure (none for location data)
- Opt-out options for each feature

**Location History Viewer**:
- Timeline of location data points
- Map showing historical locations
- Date range filter
- Delete individual entries button
- Delete all history button
- Export history button (JSON, CSV)

**Privacy Banner**:
- Appears on first visit
- Explains location data usage
- Link to privacy policy
- Accept button
- Customize settings button

### User Flows

**First-Time Location Permission Request**:
1. Customer opens vehicle search page
2. System checks if location permission previously requested
3. If not requested, wait for user interaction (don't request immediately)
4. Customer clicks "Find vehicles near me" button
5. System displays location permission modal
6. Modal explains benefits and usage
7. Customer clicks "Allow"
8. Browser shows native permission prompt
9. Customer grants permission in browser
10. System detects location
11. Updates search results with nearby vehicles
12. Stores permission status (don't ask again)

**Permission Denial Handling**:
1. Customer clicks "Not now" or denies browser permission
2. System stores denial status
3. System continues with manual location entry
4. Search functionality remains fully available
5. System doesn't show permission modal again (unless customer requests)
6. Customer can manually enter location or use default city

**Location History Management**:
1. Customer opens privacy settings
2. Navigates to location controls section
3. Views location history toggle (currently off)
4. Reads explanation of location history feature
5. Decides to enable location history
6. Toggles switch to on
7. System starts saving location data
8. Customer can view, export, or delete history anytime

**GDPR Data Export**:
1. Customer requests data export (GDPR right)
2. System includes location history in export
3. Export contains: timestamps, coordinates, accuracy, purpose
4. Export format: JSON (machine-readable)
5. Customer downloads export file
6. System logs export request for compliance

**Location Data Deletion**:
1. Customer opens location privacy controls
2. Clicks "Delete location history"
3. System shows confirmation dialog
4. Customer confirms deletion
5. System permanently deletes all location data
6. System logs deletion for compliance
7. Confirmation message displayed

### Data Requirements

**From Backend APIs**:
- GET /api/privacy/location-status - Returns location permission and usage status
- POST /api/privacy/location-consent - Updates location consent preferences
- GET /api/privacy/location-history - Returns user's location history
- DELETE /api/privacy/location-history - Deletes location history
- GET /api/privacy/location-export - Exports location data (GDPR)

**Location Privacy Data Structure**:
```
{
  permissionStatus: 'granted' | 'denied' | 'not_requested',
  consentGiven: boolean,
  historyEnabled: boolean,
  dataRetentionDays: number,
  lastLocationUpdate: string,
  locationCount: number,
  features: [
    {
      name: string,
      usesLocation: boolean,
      purpose: string,
      canOptOut: boolean
    }
  ]
}
```

## Backend Specifications

### API Endpoints

**GET /api/privacy/location-status**
- Purpose: Get user's location permission and consent status
- Response: Location privacy settings and usage information
- Authentication: JWT token required
- Caching: No caching (user-specific, real-time)

**POST /api/privacy/location-consent**
- Purpose: Update location consent preferences
- Request Body: { consentGiven, historyEnabled, dataRetentionDays }
- Response: Updated privacy settings
- Authentication: JWT token required
- Audit: Log consent changes

**GET /api/privacy/location-history**
- Purpose: Retrieve user's location history
- Query Parameters: startDate, endDate, limit
- Response: Array of location data points
- Authentication: JWT token required (user ownership verification)
- Caching: No caching

**DELETE /api/privacy/location-history**
- Purpose: Delete user's location history
- Request Body: { confirmDeletion: boolean }
- Response: { deleted: number, success: boolean }
- Authentication: JWT token required (user ownership verification)
- Audit: Log deletion for compliance

**GET /api/privacy/location-export**
- Purpose: Export location data for GDPR compliance
- Response: JSON file with all location data
- Authentication: JWT token required (user ownership verification)
- Audit: Log export request

### Request Schemas

**Consent Update Request**:
- consentGiven: boolean (required)
- historyEnabled: boolean (required)
- dataRetentionDays: number (optional, default 30, max 365)
- marketingConsent: boolean (optional, for location-based marketing)

**Location History Query**:
- startDate: string (ISO 8601, optional)
- endDate: string (ISO 8601, optional)
- limit: number (optional, default 100, max 1000)

### Response Schemas

**Location Status Response**:
- permissionStatus: string
- consentGiven: boolean
- historyEnabled: boolean
- dataRetentionDays: number
- locationCount: number
- lastUpdate: string (ISO 8601)
- features: Array of feature objects using location

**Location History Response**:
- history: Array of { latitude, longitude, accuracy, source, timestamp, purpose }
- totalCount: number
- retentionExpiresAt: string (ISO 8601)

**Location Export Response**:
- data: Complete location history with all fields
- exportedAt: string (ISO 8601)
- format: 'json'
- recordCount: number

### Business Logic

**Permission Request Timing**:
- Request permission only when needed (just-in-time)
- Provide value before requesting (show benefits)
- Don't request on page load (wait for user interaction)
- Respect previous denial (don't ask repeatedly)
- Allow user to grant permission later from settings

**Data Retention Policy**:
- Default retention: 30 days for location history
- Session-only retention if history disabled (delete on logout)
- Automatic deletion after retention period expires
- User can configure retention period (0-365 days)
- Zero retention option (don't save any location data)

**Anonymization for Analytics**:
- Round coordinates to 0.01 degree precision (approximately 1km)
- Remove user identifiers from analytics data
- Aggregate location data before analysis
- Use k-anonymity (minimum 5 users per location cluster)
- Don't link location data to individual users in analytics

**Consent Management**:
- Explicit consent required for location history
- Separate consent for location-based marketing
- Consent can be withdrawn at any time
- Withdrawal triggers immediate data deletion
- Log all consent changes for compliance

**GDPR Compliance**:
- Right to access: Provide location data export
- Right to erasure: Delete location data on request
- Right to portability: Export in machine-readable format (JSON)
- Right to object: Allow opt-out of location-based processing
- Data minimization: Collect only necessary location data
- Purpose limitation: Use location only for stated purposes

**CCPA Compliance**:
- Disclose location data collection in privacy policy
- Provide opt-out mechanism for location data sale (not applicable - we don't sell)
- Allow deletion of location data
- Provide access to collected location data

### Authentication Requirements

- Location status: JWT token required
- Consent management: JWT token required
- Location history: JWT token required (user ownership verification)
- Location export: JWT token required (user ownership verification)
- Location deletion: JWT token required (user ownership verification)

## Database Specifications

### Schema Changes

Location history table already defined in geolocation-services feature. Add consent tracking.

### Table Definitions

**LocationConsentLog Table** (new):
- id: INT PRIMARY KEY AUTO_INCREMENT
- user_id: INT NOT NULL
- consent_type: ENUM('location_services', 'location_history', 'location_marketing') NOT NULL
- consent_given: BOOLEAN NOT NULL
- consent_method: VARCHAR(50) - modal, settings_page, etc.
- ip_address: VARCHAR(45)
- user_agent: TEXT
- timestamp: DATETIME DEFAULT CURRENT_TIMESTAMP

**LocationDataRetention Table** (new):
- id: INT PRIMARY KEY AUTO_INCREMENT
- user_id: INT NOT NULL
- retention_days: INT NOT NULL DEFAULT 30
- history_enabled: BOOLEAN DEFAULT FALSE
- marketing_consent: BOOLEAN DEFAULT FALSE
- updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

### Relationships

- LocationConsentLog.user_id → Users.id (foreign key, CASCADE on delete)
- LocationDataRetention.user_id → Users.id (foreign key, CASCADE on delete)

### Indexes

- CREATE INDEX idx_location_consent_user ON LocationConsentLog(user_id, timestamp DESC)
- CREATE INDEX idx_location_consent_type ON LocationConsentLog(consent_type, consent_given, timestamp DESC)
- CREATE UNIQUE INDEX idx_location_retention_user ON LocationDataRetention(user_id)

## Technology Stack

- Backend: .NET 8+ with C#, ASP.NET Core Web API
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript, React 18+
- Compliance: GDPR and CCPA compliance frameworks
- Consent Management: Custom implementation or OneTrust

## Implementation Notes

- Request location permission with clear explanation and benefits
- Use just-in-time permission requests (when feature needed, not on page load)
- Respect permission denial without degrading core functionality
- Provide manual location entry as fallback
- Implement location permission status detection
- Allow users to change permission from settings page
- Provide clear instructions for granting permission in browser settings
- Minimize location data retention (session-only by default)
- Implement automatic data deletion after retention period
- Use background job to clean up expired location data (run daily)
- Anonymize location data for analytics (round to 0.01 degree)
- Don't link anonymized data to individual users
- Implement consent logging for compliance
- Log all consent changes with timestamp and method
- Provide location data export in JSON format
- Include all location data in GDPR export
- Implement immediate deletion on user request
- Verify user ownership before deletion
- Don't share location data with third parties without explicit consent
- Disclose location data usage in privacy policy
- Provide transparency about location data collection and use
- Implement location permission revocation handling
- Clear cached location data on permission revocation
- Test permission flows across different browsers
- Ensure permission modal is accessible
- Provide keyboard navigation for permission controls
- Test GDPR export and deletion functionality
- Monitor consent rates and optimize permission request UX
- A/B test different permission request messaging
- Provide clear value proposition before requesting permission
- Consider progressive permission (start with approximate, upgrade to precise)
- Implement location accuracy selector (precise vs approximate)
- Allow users to use platform without location services
- Ensure all features have non-location fallbacks
- Document location data handling in privacy policy
- Train support team on location privacy questions
- Implement privacy-by-design principles
- Regular privacy audits for location data handling
