# Feature: Mapping API Key Management and Security

## Overview

Securely manage mapping service API keys with proper storage, rotation policies, usage monitoring, and access controls. The system stores API keys in environment variables, implements key rotation, monitors usage and costs, and restricts keys to specific domains and IP addresses. This ensures unauthorized usage is prevented, costs are controlled, and security best practices are followed.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-MAP-011

## User Stories

As a platform operator, I want secure management of mapping service API keys, so that unauthorized usage is prevented and costs are controlled.

As a security engineer, I want API key rotation policies, so that compromised keys can be replaced without service disruption.

As a finance manager, I want API usage monitoring and cost alerts, so that mapping service costs don't exceed budget.

## Frontend Specifications

### Pages

- Admin Dashboard with API Key Management Section
- API Usage Monitoring Dashboard
- Cost Analytics Page with Mapping Service Breakdown

### UI Components

**API Key Management Panel**:
- List of API keys with masked values
- Environment indicator (development, staging, production)
- Creation date and last rotation date
- Usage statistics (requests per day)
- Cost estimate
- Rotate key button
- Revoke key button
- Create new key button

**Usage Monitoring Dashboard**:
- Real-time request count
- Requests per minute chart
- Cost per day chart
- API endpoint breakdown (geocoding, directions, maps)
- Quota usage percentage
- Alert threshold indicators
- Export usage report button

**Cost Alert Configuration**:
- Daily budget threshold input
- Monthly budget threshold input
- Alert recipients (email addresses)
- Alert frequency (immediate, daily digest)
- Enable/disable alerts toggle
- Test alert button

### User Flows

**API Key Rotation**:
1. Admin opens API key management page
2. Reviews current keys and rotation dates
3. Clicks "Rotate Key" for production environment
4. System generates new API key
5. System displays new key (one-time view)
6. Admin copies new key to secure storage
7. Admin updates environment variables in deployment
8. System keeps old key active for 24-hour grace period
9. Admin verifies new key works correctly
10. System automatically revokes old key after grace period
11. System logs rotation event for audit

**Usage Monitoring**:
1. Admin opens usage monitoring dashboard
2. Views real-time request count and cost
3. Identifies high-usage endpoints
4. Reviews cost trends over time
5. Identifies optimization opportunities
6. Exports usage report for analysis
7. Adjusts caching strategy to reduce costs

**Cost Alert Response**:
1. System detects daily usage exceeds threshold
2. System sends alert email to configured recipients
3. Admin receives alert notification
4. Admin reviews usage dashboard
5. Identifies cause of high usage (traffic spike, API abuse)
6. Takes corrective action (increase caching, block abusive IPs)
7. Adjusts alert thresholds if needed

### Data Requirements

**From Backend APIs**:
- GET /api/admin/api-keys - Returns list of API keys (masked)
- POST /api/admin/api-keys/rotate - Rotates API key
- DELETE /api/admin/api-keys/:id - Revokes API key
- GET /api/admin/api-usage - Returns usage statistics
- POST /api/admin/api-alerts - Configures cost alerts

## Backend Specifications

### API Endpoints

**GET /api/admin/api-keys**
- Purpose: List all mapping API keys
- Response: Array of API keys with metadata (values masked)
- Authentication: JWT token required (admin role only)
- Caching: No caching (sensitive data)

**POST /api/admin/api-keys/rotate**
- Purpose: Rotate API key for specified environment
- Request Body: { environment: 'development' | 'staging' | 'production', gracePeriodHours: 24 }
- Response: { newKey (one-time view), oldKeyExpiresAt }
- Authentication: JWT token required (admin role only)
- Audit: Log rotation event with user ID and timestamp

**DELETE /api/admin/api-keys/:id**
- Purpose: Immediately revoke API key
- Response: Success confirmation
- Authentication: JWT token required (admin role only)
- Audit: Log revocation event

**GET /api/admin/api-usage**
- Purpose: Retrieve API usage statistics
- Query Parameters: startDate, endDate, environment, endpoint
- Response: Usage data with request counts and costs
- Authentication: JWT token required (admin or finance role)
- Caching: 5 minutes

**POST /api/admin/api-alerts**
- Purpose: Configure cost alert thresholds
- Request Body: { dailyThreshold, monthlyThreshold, recipients, enabled }
- Response: Updated alert configuration
- Authentication: JWT token required (admin role)

**GET /api/admin/api-costs**
- Purpose: Retrieve detailed cost breakdown
- Query Parameters: startDate, endDate, groupBy (day | week | month)
- Response: Cost data by endpoint and time period
- Authentication: JWT token required (admin or finance role)
- Caching: 1 hour

### Request Schemas

**Key Rotation Request**:
- environment: enum (required)
- gracePeriodHours: number (default 24, max 168)
- reason: string (optional, for audit trail)

**Usage Query Request**:
- startDate: string (ISO 8601, required)
- endDate: string (ISO 8601, required)
- environment: string (optional, filter by environment)
- endpoint: string (optional, filter by API endpoint)
- groupBy: 'hour' | 'day' | 'week' (default 'day')

**Alert Configuration Request**:
- dailyThreshold: number (USD)
- monthlyThreshold: number (USD)
- recipients: array of email addresses
- enabled: boolean

### Response Schemas

**API Keys Response**:
- keys: Array with { id, environment, keyPrefix (first 8 chars), createdAt, lastRotatedAt, expiresAt, usageCount, status }

**Key Rotation Response**:
- newKey: string (full API key, shown once)
- keyPrefix: string (first 8 chars for identification)
- oldKeyExpiresAt: string (ISO 8601)
- rotationId: string (for tracking)

**Usage Statistics Response**:
- totalRequests: number
- requestsByEndpoint: { geocoding, directions, maps, places, distanceMatrix }
- requestsByDay: Array of { date, count, cost }
- totalCost: number (USD)
- averageCostPerRequest: number
- quotaUsage: { used, limit, percentage }

**Cost Breakdown Response**:
- costs: Array of { date, endpoint, requests, cost }
- totalCost: number
- costTrend: 'increasing' | 'stable' | 'decreasing'
- projectedMonthlyCost: number

### Business Logic

**API Key Storage**:
- Store keys in environment variables, never in code or database
- Use separate keys for each environment (dev, staging, prod)
- Encrypt keys at rest in configuration management systems
- Use key management services (AWS Secrets Manager, Azure Key Vault)
- Implement key versioning for rollback capability

**Key Rotation Policy**:
- Rotate keys annually at minimum
- Rotate immediately if compromise suspected
- Implement grace period (24 hours) for zero-downtime rotation
- Keep old key active during grace period
- Automatically revoke old key after grace period
- Log all rotation events for audit

**Usage Monitoring**:
- Track all mapping API requests with endpoint and timestamp
- Calculate costs based on provider pricing
- Aggregate usage by hour, day, week, month
- Identify high-cost endpoints and features
- Monitor quota usage and alert before limits reached
- Generate usage reports for finance team

**Cost Control**:
- Set daily and monthly budget thresholds
- Send alerts when thresholds exceeded
- Implement automatic throttling if budget exceeded (optional)
- Provide cost optimization recommendations
- Track cost per feature for ROI analysis

**Access Restrictions**:
- Restrict API keys to specific domains (whitelist)
- Restrict API keys to specific IP addresses (for server-side calls)
- Implement referrer restrictions for browser-based calls
- Use separate keys for different features (geocoding, maps, directions)
- Revoke keys immediately if abuse detected

**Rate Limiting**:
- Implement application-level rate limiting
- Limit requests per user per minute
- Limit requests per IP address per minute
- Implement exponential backoff for retries
- Queue requests during high traffic to prevent quota exhaustion

### Authentication Requirements

- API key management: JWT token required (admin role only)
- Key rotation: JWT token required (admin role only)
- Usage viewing: JWT token required (admin or finance role)
- Alert configuration: JWT token required (admin role)

## Database Specifications

### Schema Changes

Add API key management and usage tracking tables.

### Table Definitions

**APIKeys Table** (new):
- id: INT PRIMARY KEY AUTO_INCREMENT
- key_id: VARCHAR(100) UNIQUE NOT NULL - Identifier (not the actual key)
- environment: ENUM('development', 'staging', 'production') NOT NULL
- provider: VARCHAR(50) NOT NULL - google_maps, mapbox, etc.
- key_prefix: VARCHAR(20) - First 8 characters for identification
- status: ENUM('active', 'rotating', 'revoked') DEFAULT 'active'
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
- last_rotated_at: DATETIME
- expires_at: DATETIME - For automatic expiration
- revoked_at: DATETIME
- revoked_by: INT - User ID who revoked
- revocation_reason: TEXT

**APIUsageLog Table** (new):
- id: BIGINT PRIMARY KEY AUTO_INCREMENT
- key_id: VARCHAR(100) NOT NULL
- endpoint: VARCHAR(100) NOT NULL - geocoding, directions, maps, etc.
- request_count: INT DEFAULT 1
- cost_usd: DECIMAL(10, 4) - Estimated cost
- timestamp: DATETIME DEFAULT CURRENT_TIMESTAMP
- hour: INT - 0-23 for hourly aggregation
- date: DATE - For daily aggregation

**APIAlertConfiguration Table** (new):
- id: INT PRIMARY KEY AUTO_INCREMENT
- daily_threshold_usd: DECIMAL(10, 2)
- monthly_threshold_usd: DECIMAL(10, 2)
- recipients: JSON - Array of email addresses
- enabled: BOOLEAN DEFAULT TRUE
- last_alert_sent: DATETIME
- created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
- updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

**APIKeyRotationHistory Table** (new):
- id: INT PRIMARY KEY AUTO_INCREMENT
- key_id: VARCHAR(100) NOT NULL
- rotated_by: INT NOT NULL - User ID
- old_key_prefix: VARCHAR(20)
- new_key_prefix: VARCHAR(20)
- grace_period_hours: INT
- rotation_reason: TEXT
- rotated_at: DATETIME DEFAULT CURRENT_TIMESTAMP

### Relationships

- APIKeys.revoked_by → Users.id (foreign key)
- APIKeyRotationHistory.key_id → APIKeys.key_id (foreign key)
- APIKeyRotationHistory.rotated_by → Users.id (foreign key)

### Indexes

- CREATE INDEX idx_api_keys_environment ON APIKeys(environment, status)
- CREATE INDEX idx_api_keys_status ON APIKeys(status, expires_at)
- CREATE INDEX idx_api_usage_log_timestamp ON APIUsageLog(timestamp DESC)
- CREATE INDEX idx_api_usage_log_date ON APIUsageLog(date, endpoint)
- CREATE INDEX idx_api_usage_log_key ON APIUsageLog(key_id, date)
- CREATE INDEX idx_api_rotation_history_key ON APIKeyRotationHistory(key_id, rotated_at DESC)

## Technology Stack

- Backend: .NET 8+ with C#, ASP.NET Core Web API
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript, React 18+
- Key Management: Azure Key Vault, AWS Secrets Manager, or HashiCorp Vault
- Monitoring: Application Insights, CloudWatch, or custom logging
- Alerting: Email service (SendGrid, AWS SES)

## Implementation Notes

- Store API keys in environment variables using .env files (never commit to git)
- Use Azure Key Vault or AWS Secrets Manager for production key storage
- Implement key rotation with zero-downtime (grace period approach)
- Keep old key active for 24 hours during rotation
- Automatically revoke old key after grace period
- Log all API key operations (creation, rotation, revocation) for audit
- Implement usage tracking middleware to log all mapping API calls
- Aggregate usage data hourly to reduce database writes
- Calculate costs based on provider pricing (Google Maps pricing tiers)
- Send daily usage summary to operations team
- Send alerts when daily or monthly thresholds exceeded
- Implement automatic throttling if budget exceeded (optional, with override)
- Restrict API keys to specific domains using Google Cloud Console
- Restrict API keys to specific IP addresses for server-side calls
- Use separate API keys for different features (geocoding, maps, directions)
- Monitor for unusual usage patterns (potential abuse or compromise)
- Implement rate limiting at application level (before hitting provider limits)
- Use exponential backoff for API retries
- Implement circuit breaker pattern for API failures
- Provide API key compromise response procedures
- Test key rotation process in staging environment
- Document key rotation procedures for operations team
- Implement key expiration (force rotation after 1 year)
- Use least privilege principle (restrict key permissions to needed APIs only)
- Monitor API key usage from Google Cloud Console
- Set up billing alerts in Google Cloud Console
- Review API usage monthly for optimization opportunities
- Consider using API key per environment for better tracking
- Implement API key health checks (verify key is valid and not rate-limited)
- Provide dashboard showing API key status and health
- Test API key restrictions (domain, IP) to ensure they work correctly
- Implement emergency key revocation procedure
- Have backup API keys ready for failover
- Document API key management procedures in runbook
