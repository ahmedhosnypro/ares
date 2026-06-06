# Feature: SMS Notification Service

## Overview

The SMS Notification Service enables sending time-sensitive text messages for critical notifications including booking confirmations, pickup reminders, two-factor authentication codes, and emergency alerts. This service integrates with SMS gateway providers to ensure reliable, immediate delivery with high open rates across global mobile networks.

## Sprint Category

sprint-mvp

## Feature IDs

F-INT-NOTIF-002

## User Stories

As a customer, I want to receive SMS confirmations for my bookings, so that I have immediate confirmation without needing email or app access.

As a customer, I want to receive SMS reminders before my pickup time, so that I don't miss my reservation.

As a customer, I want to receive two-factor authentication codes via SMS, so that I can securely access my account.

As a platform administrator, I want to track SMS delivery status, so that I can ensure critical communications reach customers.

As an operations manager, I want to send emergency alerts via SMS, so that I can quickly communicate urgent information to customers.

## Frontend Specifications

### Pages

Not applicable - SMS notifications are backend-triggered and delivered externally.

### UI Components

**SMS Preference Settings**
- Toggle for SMS notifications
- Phone number verification status
- SMS notification type preferences
- Opt-in/opt-out management
- Quiet hours configuration

**Phone Number Verification**
- Phone number input with country code selector
- Send verification code button
- Verification code input field
- Resend code option
- Verification status indicator

### User Flows

1. User provides phone number during registration
2. System sends verification code via SMS
3. User enters code to verify phone number
4. User receives SMS notifications for bookings and reminders
5. User can opt-out via SMS reply or account settings

### Data Requirements

- User phone number with country code
- Phone verification status
- SMS delivery status and timestamps
- Opt-in/opt-out status
- SMS delivery receipts

## Backend Specifications

### API Endpoints

**POST /api/notifications/sms/send**
- Purpose: Send SMS message
- Authentication: Internal service authentication
- Request body: Phone number, message content, message type
- Response: SMS job ID, queued status

**POST /api/notifications/sms/verify**
- Purpose: Send phone verification code
- Authentication: JWT token
- Request body: Phone number
- Response: Verification ID, code sent status

**POST /api/notifications/sms/verify/confirm**
- Purpose: Confirm phone verification code
- Authentication: JWT token
- Request body: Verification ID, code
- Response: Verification success, phone verified status

**GET /api/notifications/sms/{smsId}/status**
- Purpose: Check SMS delivery status
- Authentication: JWT token (admin or user for own SMS)
- Response: Delivery status, timestamps, delivery receipt

**POST /api/notifications/sms/webhook**
- Purpose: Receive delivery receipts from SMS provider
- Authentication: Webhook signature verification
- Request body: Provider-specific webhook payload
- Response: 200 OK acknowledgment

**POST /api/notifications/sms/opt-out**
- Purpose: Process opt-out request
- Authentication: Phone number verification or JWT token
- Request body: Phone number, reason
- Response: Opt-out confirmation

**GET /api/notifications/sms/history**
- Purpose: Retrieve SMS history
- Authentication: JWT token (admin only)
- Query parameters: userId, phoneNumber, startDate, endDate, status
- Response: Paginated list of sent SMS with status

### Request Schemas

**Send SMS Request**
```
{
  "phoneNumber": "+12025551234",
  "message": "Your booking BK-12345 is confirmed. Pickup: Mar 1, 10:00 AM at Downtown Branch. Reply STOP to opt-out.",
  "messageType": "booking_confirmation",
  "priority": "high",
  "scheduledAt": null
}
```

**Phone Verification Request**
```
{
  "phoneNumber": "+12025551234",
  "channel": "sms"
}
```

**Verification Confirm Request**
```
{
  "verificationId": "ver_abc123",
  "code": "123456"
}
```

### Response Schemas

**Send SMS Response**
```
{
  "smsId": "sms_xyz789",
  "status": "queued",
  "queuedAt": "2026-02-24T14:30:00Z",
  "estimatedDelivery": "2026-02-24T14:30:03Z",
  "segmentCount": 1,
  "cost": 0.0075
}
```

**SMS Status Response**
```
{
  "smsId": "sms_xyz789",
  "status": "delivered",
  "phoneNumber": "+12025551234",
  "message": "Your booking BK-12345 is confirmed...",
  "sentAt": "2026-02-24T14:30:01Z",
  "deliveredAt": "2026-02-24T14:30:03Z",
  "segmentCount": 1,
  "cost": 0.0075,
  "errorCode": null,
  "errorMessage": null
}
```

**Verification Response**
```
{
  "verificationId": "ver_abc123",
  "status": "pending",
  "phoneNumber": "+12025551234",
  "expiresAt": "2026-02-24T14:40:00Z",
  "attemptsRemaining": 3
}
```

### Business Logic

**SMS Provider Integration**
- Integrate with Twilio, Vonage, AWS SNS, or MessageBird
- Configure API credentials and sender phone numbers
- Implement provider-specific API clients
- Handle provider error codes and retry logic
- Support international SMS with proper country codes

**Message Formatting**
- Keep messages concise (160 characters ideal, 1 segment)
- Include sender identification
- Add booking reference numbers for context
- Include opt-out instructions (STOP, UNSUBSCRIBE)
- Support Unicode for international characters

**Phone Number Verification**
- Generate 6-digit verification codes
- Store codes with expiration (10 minutes)
- Limit verification attempts (3 attempts)
- Rate limit verification requests per phone number
- Support resend with cooldown period

**Delivery Tracking**
- Store SMS metadata in database
- Process delivery receipts from provider
- Update delivery status in real-time
- Track delivery failures and error codes
- Monitor delivery rates by country/carrier

**Opt-Out Management**
- Process STOP, UNSUBSCRIBE keywords from replies
- Maintain opt-out list per phone number
- Honor opt-out requests immediately
- Provide opt-in mechanism for re-subscription
- Comply with TCPA regulations

**Queue Management**
- Use message queue for asynchronous SMS sending
- Implement retry logic for failed deliveries
- Priority queue for critical messages (2FA, emergencies)
- Rate limiting to comply with provider limits
- Cost optimization by batching where possible

**Two-Factor Authentication**
- Generate secure random codes
- Store codes with short expiration (5-10 minutes)
- Limit code generation rate per user
- Invalidate codes after successful use
- Support backup authentication methods

### Authentication Requirements

- Internal service authentication for SMS sending
- JWT token authentication for verification and status queries
- Webhook signature verification for provider callbacks
- Admin role required for viewing all SMS history
- Phone number ownership verification for opt-out

## Database Specifications

### Schema Changes

Create new tables for SMS tracking, verification, and opt-out management.

### Table Definitions

**SmsNotifications**
- SmsId (VARCHAR(50), PRIMARY KEY): Unique SMS identifier
- UserId (VARCHAR(50), FOREIGN KEY, NULL): Recipient user ID
- PhoneNumber (VARCHAR(20), NOT NULL): Recipient phone number with country code
- Message (TEXT, NOT NULL): SMS message content
- MessageType (ENUM: booking_confirmation, pickup_reminder, 2fa, emergency, marketing, general): Message category
- Status (ENUM: queued, sent, delivered, failed, undelivered): Delivery status
- Priority (ENUM: low, normal, high, critical): Message priority
- ScheduledAt (DATETIME, NULL): Scheduled send time
- QueuedAt (DATETIME, NOT NULL): Time added to queue
- SentAt (DATETIME, NULL): Time sent to provider
- DeliveredAt (DATETIME, NULL): Time delivered to device
- FailedAt (DATETIME, NULL): Failure timestamp
- ErrorCode (VARCHAR(50), NULL): Provider error code
- ErrorMessage (TEXT, NULL): Error description
- ProviderMessageId (VARCHAR(255), NULL): Provider's message ID
- SegmentCount (INT, DEFAULT 1): Number of SMS segments
- Cost (DECIMAL(10, 4), NULL): Cost per message
- CreatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- UpdatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

**PhoneVerifications**
- VerificationId (VARCHAR(50), PRIMARY KEY): Unique verification identifier
- UserId (VARCHAR(50), FOREIGN KEY): User requesting verification
- PhoneNumber (VARCHAR(20), NOT NULL): Phone number to verify
- VerificationCode (VARCHAR(10), NOT NULL): Verification code
- Status (ENUM: pending, verified, expired, failed): Verification status
- AttemptsRemaining (INT, DEFAULT 3): Remaining verification attempts
- SentAt (DATETIME, NOT NULL): Code sent timestamp
- VerifiedAt (DATETIME, NULL): Successful verification timestamp
- ExpiresAt (DATETIME, NOT NULL): Code expiration time
- CreatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)

**SmsOptOuts**
- OptOutId (INT, AUTO_INCREMENT, PRIMARY KEY)
- PhoneNumber (VARCHAR(20), UNIQUE, NOT NULL): Opted-out phone number
- Reason (ENUM: user_request, keyword_stop, compliance, manual): Opt-out reason
- OptedOutAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- OptedInAt (DATETIME, NULL): Re-subscription timestamp
- IsActive (BOOLEAN, DEFAULT TRUE): Current opt-out status

**SmsDeliveryReceipts**
- ReceiptId (INT, AUTO_INCREMENT, PRIMARY KEY)
- SmsId (VARCHAR(50), FOREIGN KEY): Reference to SmsNotifications
- EventType (ENUM: queued, sent, delivered, failed, undelivered): Delivery event
- EventData (JSON, NULL): Additional event metadata
- Timestamp (DATETIME, NOT NULL): Event occurrence time
- CreatedAt (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### Relationships

- SmsNotifications.UserId → Users.UserId (many-to-one, nullable)
- PhoneVerifications.UserId → Users.UserId (many-to-one)
- SmsDeliveryReceipts.SmsId → SmsNotifications.SmsId (many-to-one)

### Indexes

- SmsNotifications: Index on (UserId, CreatedAt) for user history
- SmsNotifications: Index on (PhoneNumber, CreatedAt) for phone history
- SmsNotifications: Index on (Status, QueuedAt) for queue processing
- SmsNotifications: Index on (ProviderMessageId) for webhook lookups
- PhoneVerifications: Index on (PhoneNumber, Status, ExpiresAt) for verification lookups
- SmsOptOuts: Unique index on (PhoneNumber) for fast opt-out checks
- SmsDeliveryReceipts: Index on (SmsId, Timestamp) for receipt history

## Technology Stack

- Backend: .NET 8+ with C#, ASP.NET Core Web API
- Database: MySQL 8.0+
- SMS Provider: Twilio, Vonage (Nexmo), AWS SNS, or MessageBird
- Message Queue: RabbitMQ or Azure Service Bus for async processing
- Security: Secure random number generation for verification codes

## Implementation Notes

**Provider Selection Criteria**
- Global coverage and carrier relationships
- Delivery rates by country/region
- API reliability and documentation
- Pricing structure (per-message cost)
- Two-way messaging support
- Delivery receipt reliability
- Number verification capabilities

**SMS Best Practices**
- Obtain explicit opt-in consent before sending
- Include clear sender identification
- Provide opt-out instructions in every message
- Keep messages concise and actionable
- Avoid sending during quiet hours (10 PM - 8 AM local time)
- Monitor delivery rates by carrier and country
- Test messages across different carriers

**Compliance Requirements**
- TCPA compliance (US): Prior express consent required
- GDPR compliance (EU): Consent and data protection
- CASL compliance (Canada): Anti-spam requirements
- Maintain opt-in consent records
- Honor opt-out requests immediately
- Include physical address for marketing messages
- Respect quiet hours and frequency limits

**Security Considerations**
- Use secure random number generation for 2FA codes
- Implement rate limiting to prevent abuse
- Validate phone numbers before sending
- Encrypt verification codes in database
- Monitor for suspicious patterns (mass sending, rapid verification attempts)
- Implement CAPTCHA for verification requests

**Cost Optimization**
- Monitor SMS costs by message type and destination
- Optimize message length to minimize segments
- Use local sender numbers where possible
- Batch non-urgent messages
- Implement cost alerts and budgets
- Consider alternative channels for non-critical messages

**Performance Considerations**
- Use message queue to prevent blocking
- Implement exponential backoff for retries
- Cache opt-out list for fast lookups
- Use connection pooling for provider API
- Monitor queue depth and processing lag

**Monitoring and Alerts**
- Track delivery rate, failure rate by country/carrier
- Alert on sudden drops in delivery rate
- Monitor provider API response times
- Track verification success rates
- Dashboard for SMS performance metrics
- Cost tracking and budget alerts

## Source Documentation

- docs/05-features/integration/notification-services.md
