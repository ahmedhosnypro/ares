# Feature: Fraud Detection & 3D Secure Authentication

## Overview

This feature implements comprehensive payment fraud detection mechanisms and 3D Secure (3DS) authentication to protect the platform and customers from fraudulent transactions. The system integrates with payment gateway fraud detection services (Stripe Radar, PayPal Fraud Protection), implements multi-layered verification including CVV checks, Address Verification System (AVS), and 3D Secure authentication for high-value transactions. Advanced fraud detection uses velocity checks, device fingerprinting, geolocation analysis, and machine learning models to identify suspicious payment patterns and prevent chargebacks.

## Sprint Category

sprint-01

## Feature IDs

- F-COMP-PAY-006: Payment Fraud Detection Services
- F-COMP-PAY-007: 3D Secure Authentication
- F-COMP-PAY-008: Address Verification System (AVS)
- F-COMP-PAY-009: Velocity Checks & Rate Limiting
- F-COMP-PAY-010: Chargeback Prevention

## User Stories

### As a platform operator
I want to verify payment methods and detect fraud, so that I can prevent payment fraud, reduce chargebacks, and protect legitimate customers.

### As a user
I want my transactions to be secure with additional authentication when needed, so that my payment information is protected from fraudulent use.

### As a finance manager
I want to minimize chargebacks, so that I can reduce financial losses and maintain good standing with payment processors.

### As a fraud analyst
I want to detect suspicious payment patterns in real-time, so that I can prevent fraudulent transactions before they complete.

## Backend Specifications

### API Endpoints

#### Fraud Detection

**POST /api/v1/payments/fraud-check**
- Purpose: Perform fraud risk assessment before processing payment
- Authentication: Required (JWT)
- Request Body:
  ```
  {
    "bookingId": "string",
    "amount": "number",
    "currency": "string",
    "paymentMethodId": "string",
    "billingAddress": {
      "line1": "string",
      "city": "string",
      "state": "string",
      "postalCode": "string",
      "country": "string"
    },
    "deviceFingerprint": "string",
    "ipAddress": "string"
  }
  ```
- Response:
  ```
  {
    "riskScore": "number (0-100)",
    "riskLevel": "low|medium|high|critical",
    "requiresAdditionalVerification": "boolean",
    "requires3DS": "boolean",
    "fraudSignals": [
      {
        "type": "string",
        "severity": "low|medium|high",
        "description": "string"
      }
    ],
    "recommendation": "approve|review|decline"
  }
  ```
- Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized

**POST /api/v1/payments/3ds/initiate**
- Purpose: Initiate 3D Secure authentication flow
- Authentication: Required (JWT)
- Request Body:
  ```
  {
    "paymentMethodId": "string",
    "amount": "number",
    "currency": "string",
    "bookingId": "string",
    "returnUrl": "string"
  }
  ```
- Response:
  ```
  {
    "threeDSSessionId": "string",
    "authenticationUrl": "string",
    "status": "pending|authenticated|failed",
    "expiresAt": "ISO8601 datetime"
  }
  ```
- Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized

**POST /api/v1/payments/3ds/callback**
- Purpose: Handle 3DS authentication callback
- Authentication: Gateway signature verification
- Request Body:
  ```
  {
    "threeDSSessionId": "string",
    "authenticationStatus": "authenticated|failed|abandoned",
    "transactionId": "string",
    "eci": "string",
    "cavv": "string",
    "xid": "string"
  }
  ```
- Response: 200 OK
- Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized

**GET /api/v1/admin/fraud/dashboard**
- Purpose: Retrieve fraud detection metrics and statistics
- Authentication: Required (JWT, Admin role)
- Query Parameters: startDate, endDate, riskLevel
- Response:
  ```
  {
    "totalTransactions": "number",
    "flaggedTransactions": "number",
    "blockedTransactions": "number",
    "chargebackRate": "number",
    "averageRiskScore": "number",
    "fraudSignalBreakdown": {
      "avsFailure": "number",
      "cvvFailure": "number",
      "velocityViolation": "number",
      "suspiciousLocation": "number",
      "deviceMismatch": "number"
    },
    "topFraudPatterns": [
      {
        "pattern": "string",
        "occurrences": "number",
        "severity": "string"
      }
    ]
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden

**POST /api/v1/admin/fraud/review/{transactionId}**
- Purpose: Manual review and decision on flagged transaction
- Authentication: Required (JWT, Admin role)
- Path Parameters: transactionId (string)
- Request Body:
  ```
  {
    "decision": "approve|decline",
    "reason": "string",
    "notes": "string"
  }
  ```
- Response: 200 OK
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found

#### Chargeback Management

**GET /api/v1/admin/chargebacks**
- Purpose: Retrieve chargeback records and status
- Authentication: Required (JWT, Admin role)
- Query Parameters: status, startDate, endDate, page, pageSize
- Response:
  ```
  {
    "chargebacks": [
      {
        "id": "string",
        "transactionId": "string",
        "bookingId": "string",
        "amount": "number",
        "currency": "string",
        "reason": "string",
        "status": "pending|won|lost|under_review",
        "receivedDate": "ISO8601 date",
        "responseDeadline": "ISO8601 date",
        "evidence": "object"
      }
    ],
    "pagination": {
      "page": "number",
      "pageSize": "number",
      "totalRecords": "number"
    },
    "chargebackRate": "number"
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden

**POST /api/v1/admin/chargebacks/{chargebackId}/respond**
- Purpose: Submit evidence for chargeback dispute
- Authentication: Required (JWT, Admin role)
- Path Parameters: chargebackId (string)
- Request Body:
  ```
  {
    "evidence": {
      "customerName": "string",
      "customerEmail": "string",
      "bookingConfirmation": "string",
      "serviceProvided": "boolean",
      "refundPolicy": "string",
      "communicationLogs": "array",
      "additionalDocuments": "array"
    },
    "notes": "string"
  }
  ```
- Response: 200 OK
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found

### Business Logic

#### Fraud Risk Assessment

1. **Multi-Signal Analysis**
   - CVV/CVC verification result
   - AVS (Address Verification System) match status
   - Device fingerprint analysis
   - IP geolocation and risk scoring
   - Velocity check results
   - User behavior patterns
   - Transaction amount relative to user history

2. **Risk Scoring Algorithm**
   - Base score: 0 (lowest risk) to 100 (highest risk)
   - CVV mismatch: +30 points
   - AVS failure: +25 points
   - High-risk country: +20 points
   - New device: +15 points
   - Velocity violation: +20 points
   - Unusual transaction amount: +15 points
   - VPN/Proxy detected: +25 points

3. **Risk Level Classification**
   - Low (0-25): Approve automatically
   - Medium (26-50): Require 3DS if amount > $500
   - High (51-75): Require 3DS and manual review
   - Critical (76-100): Decline automatically

4. **Fraud Detection Services Integration**
   - Stripe Radar: Machine learning-based fraud detection
   - PayPal Fraud Protection: Transaction risk analysis
   - Kount/Sift: Advanced fraud prevention (optional)
   - Real-time risk scoring and recommendations

#### 3D Secure Authentication Flow

1. **Trigger Conditions**
   - All transactions > $500 (configurable threshold)
   - Medium or high-risk transactions regardless of amount
   - First transaction for new payment method
   - Transactions from new device or location
   - Regulatory requirements (SCA in Europe)

2. **Authentication Process**
   - System initiates 3DS with payment gateway
   - User redirected to card issuer authentication page
   - User completes authentication (password, SMS OTP, biometric)
   - Gateway returns authentication result
   - System validates authentication before processing payment

3. **3DS 2.0 Features**
   - Frictionless authentication for low-risk transactions
   - Rich data sharing with issuers for better risk assessment
   - Mobile-optimized authentication experience
   - Biometric authentication support

4. **Liability Shift**
   - Successful 3DS authentication shifts liability to card issuer
   - Reduces chargeback risk for authenticated transactions
   - Provides evidence for chargeback disputes

#### Address Verification System (AVS)

1. **Verification Process**
   - Extract billing address from payment form
   - Send address to payment gateway for verification
   - Gateway compares with card issuer records
   - Return match status for street address and postal code

2. **AVS Response Codes**
   - Full match: Address and postal code match
   - Partial match: Either address or postal code matches
   - No match: Neither address nor postal code match
   - Not supported: Card issuer doesn't support AVS
   - Unavailable: AVS temporarily unavailable

3. **Risk Assessment**
   - Full match: Low risk, proceed
   - Partial match: Medium risk, require 3DS if amount > $500
   - No match: High risk, require 3DS and manual review
   - Not supported: Use other fraud signals for assessment

#### Velocity Checks

1. **Transaction Velocity**
   - Maximum 3 payment attempts per user per 15 minutes
   - Maximum 5 payment attempts per device per hour
   - Maximum 10 payment attempts per IP address per hour
   - Maximum $5,000 total transaction amount per user per day

2. **Account Velocity**
   - Maximum 3 new payment methods added per user per day
   - Maximum 5 bookings created per user per day
   - Maximum 2 accounts created per device per day

3. **Violation Handling**
   - Soft limit: Require additional verification (3DS, email confirmation)
   - Hard limit: Temporarily block further attempts (15-60 minutes)
   - Repeated violations: Flag account for manual review

#### Chargeback Prevention

1. **Proactive Measures**
   - Clear merchant descriptor on statements
   - Immediate booking confirmation emails
   - Detailed transaction receipts
   - Transparent refund and cancellation policies
   - Responsive customer support

2. **Chargeback Monitoring**
   - Track chargeback rate (target < 0.5%)
   - Analyze chargeback reasons and patterns
   - Identify high-risk customer segments
   - Implement preventive measures for common reasons

3. **Dispute Response**
   - Automated evidence collection
   - Comprehensive transaction documentation
   - Communication logs with customer
   - Proof of service delivery
   - Refund policy acknowledgment
   - Terms and conditions acceptance

### Authentication Requirements

- **User Authentication**: JWT token required for fraud check and 3DS initiation
- **Gateway Authentication**: Webhook signature verification for 3DS callbacks
- **Admin Authentication**: JWT + Admin role for fraud dashboard and chargeback management

### Authorization Rules

- Users can only initiate fraud checks for their own transactions
- Users can only complete 3DS authentication for their own payments
- Admins can view fraud dashboard and all flagged transactions
- Admins can manually review and approve/decline flagged transactions
- Admins can manage chargebacks and submit dispute evidence

### Rate Limiting

- Fraud check: 20 requests per minute per user
- 3DS initiation: 10 requests per minute per user
- Fraud dashboard: 60 requests per minute per admin
- Chargeback API: 30 requests per minute per admin

### Error Handling

- Fraud check failure: Return 500 with retry recommendation
- 3DS authentication timeout: Return 408 with new session URL
- AVS unavailable: Proceed with other fraud signals
- Gateway fraud service down: Use fallback rule-based detection
- Chargeback evidence upload failure: Return 500 with retry instructions

## Database Specifications

### Schema Changes

#### New Tables

**fraud_checks**
- Stores fraud risk assessments for all transactions
- Supports fraud pattern analysis and reporting
- Enables manual review workflow

**three_ds_sessions**
- Tracks 3D Secure authentication sessions
- Links authentication to transactions
- Stores authentication results for liability shift

**chargebacks**
- Records chargeback disputes and evidence
- Tracks chargeback resolution status
- Supports chargeback rate monitoring

**velocity_tracking**
- Monitors transaction and account velocity
- Detects velocity violations in real-time
- Supports rate limiting enforcement

### Table Definitions

#### fraud_checks

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| transaction_id | VARCHAR(36) | NULL, FOREIGN KEY | References transactions.id |
| booking_id | VARCHAR(36) | NULL, FOREIGN KEY | References bookings.id |
| user_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | References users.id |
| risk_score | DECIMAL(5,2) | NOT NULL | 0.00 to 100.00 |
| risk_level | ENUM('low', 'medium', 'high', 'critical') | NOT NULL | Risk classification |
| recommendation | ENUM('approve', 'review', 'decline') | NOT NULL | System recommendation |
| requires_3ds | BOOLEAN | DEFAULT FALSE | 3DS required flag |
| cvv_check | ENUM('pass', 'fail', 'unavailable', 'not_checked') | NULL | CVV verification result |
| avs_check | ENUM('full_match', 'partial_match', 'no_match', 'not_supported', 'unavailable') | NULL | AVS result |
| device_fingerprint | VARCHAR(255) | NULL | Device identifier |
| ip_address | VARCHAR(45) | NOT NULL | IPv4 or IPv6 |
| geolocation | JSON | NULL | Country, region, city |
| fraud_signals | JSON | NULL | Array of detected signals |
| gateway_fraud_score | DECIMAL(5,2) | NULL | Gateway's risk score |
| manual_review_status | ENUM('pending', 'approved', 'declined', 'not_required') | DEFAULT 'not_required' | Manual review status |
| reviewed_by | VARCHAR(36) | NULL, FOREIGN KEY | Admin user ID |
| reviewed_at | DATETIME | NULL | Review timestamp |
| review_notes | TEXT | NULL | Admin review notes |
| created_at | DATETIME | NOT NULL | Check timestamp |

**Indexes:**
- INDEX idx_transaction_id (transaction_id)
- INDEX idx_booking_id (booking_id)
- INDEX idx_user_id (user_id, created_at)
- INDEX idx_risk_level (risk_level, manual_review_status)
- INDEX idx_created_at (created_at DESC)

#### three_ds_sessions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| session_id | VARCHAR(255) | NOT NULL, UNIQUE | Gateway session ID |
| transaction_id | VARCHAR(36) | NULL, FOREIGN KEY | References transactions.id |
| booking_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | References bookings.id |
| user_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | References users.id |
| payment_method_id | VARCHAR(36) | NOT NULL | Payment method reference |
| amount | DECIMAL(10,2) | NOT NULL | Transaction amount |
| currency | CHAR(3) | NOT NULL | ISO 4217 currency code |
| status | ENUM('pending', 'authenticated', 'failed', 'abandoned', 'expired') | NOT NULL | Authentication status |
| authentication_url | VARCHAR(500) | NULL | Issuer authentication URL |
| return_url | VARCHAR(500) | NOT NULL | Platform return URL |
| eci | VARCHAR(10) | NULL | Electronic Commerce Indicator |
| cavv | VARCHAR(255) | NULL | Cardholder Authentication Verification Value |
| xid | VARCHAR(255) | NULL | Transaction identifier |
| ds_transaction_id | VARCHAR(255) | NULL | Directory server transaction ID |
| version | VARCHAR(10) | DEFAULT '2.0' | 3DS version (1.0 or 2.0) |
| initiated_at | DATETIME | NOT NULL | Session start |
| completed_at | DATETIME | NULL | Authentication completion |
| expires_at | DATETIME | NOT NULL | Session expiration |
| created_at | DATETIME | NOT NULL | Record creation |

**Indexes:**
- INDEX idx_session_id (session_id)
- INDEX idx_transaction_id (transaction_id)
- INDEX idx_booking_id (booking_id)
- INDEX idx_user_id (user_id, created_at)
- INDEX idx_status (status, expires_at)

#### chargebacks

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| chargeback_id | VARCHAR(255) | NOT NULL, UNIQUE | Gateway chargeback ID |
| transaction_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | References transactions.id |
| booking_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | References bookings.id |
| user_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | References users.id |
| amount | DECIMAL(10,2) | NOT NULL | Disputed amount |
| currency | CHAR(3) | NOT NULL | ISO 4217 currency code |
| reason_code | VARCHAR(50) | NOT NULL | Chargeback reason code |
| reason_description | TEXT | NULL | Reason description |
| status | ENUM('pending', 'under_review', 'won', 'lost', 'withdrawn') | NOT NULL | Dispute status |
| received_date | DATE | NOT NULL | Chargeback received date |
| response_deadline | DATE | NOT NULL | Evidence submission deadline |
| evidence_submitted | BOOLEAN | DEFAULT FALSE | Evidence submitted flag |
| evidence_submitted_at | DATETIME | NULL | Evidence submission time |
| evidence | JSON | NULL | Dispute evidence |
| resolution_date | DATE | NULL | Dispute resolution date |
| resolution_notes | TEXT | NULL | Resolution details |
| handled_by | VARCHAR(36) | NULL, FOREIGN KEY | Admin user ID |
| created_at | DATETIME | NOT NULL | Record creation |
| updated_at | DATETIME | NOT NULL | Last update |

**Indexes:**
- INDEX idx_chargeback_id (chargeback_id)
- INDEX idx_transaction_id (transaction_id)
- INDEX idx_booking_id (booking_id)
- INDEX idx_user_id (user_id)
- INDEX idx_status (status, response_deadline)
- INDEX idx_received_date (received_date DESC)

#### velocity_tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY AUTO_INCREMENT | Tracking ID |
| tracking_type | ENUM('payment_attempt', 'booking_creation', 'payment_method_add', 'account_creation') | NOT NULL | Event type |
| user_id | VARCHAR(36) | NULL, FOREIGN KEY | User ID (if applicable) |
| device_fingerprint | VARCHAR(255) | NULL | Device identifier |
| ip_address | VARCHAR(45) | NULL | IP address |
| amount | DECIMAL(10,2) | NULL | Transaction amount |
| success | BOOLEAN | NOT NULL | Event success status |
| timestamp | DATETIME(6) | NOT NULL | Event timestamp with microseconds |
| window_start | DATETIME | NOT NULL | Velocity window start |
| window_end | DATETIME | NOT NULL | Velocity window end |

**Indexes:**
- INDEX idx_user_velocity (user_id, tracking_type, timestamp)
- INDEX idx_device_velocity (device_fingerprint, tracking_type, timestamp)
- INDEX idx_ip_velocity (ip_address, tracking_type, timestamp)
- INDEX idx_window (window_start, window_end, tracking_type)
- INDEX idx_timestamp (timestamp DESC)

### Relationships

- fraud_checks.transaction_id → transactions.id (Many-to-One)
- fraud_checks.booking_id → bookings.id (Many-to-One)
- fraud_checks.user_id → users.id (Many-to-One)
- fraud_checks.reviewed_by → users.id (Many-to-One)
- three_ds_sessions.transaction_id → transactions.id (One-to-One)
- three_ds_sessions.booking_id → bookings.id (Many-to-One)
- three_ds_sessions.user_id → users.id (Many-to-One)
- chargebacks.transaction_id → transactions.id (One-to-One)
- chargebacks.booking_id → bookings.id (Many-to-One)
- chargebacks.user_id → users.id (Many-to-One)
- chargebacks.handled_by → users.id (Many-to-One)
- velocity_tracking.user_id → users.id (Many-to-One, nullable)

### Data Retention

- **fraud_checks**: Retained for 3 years for fraud pattern analysis
- **three_ds_sessions**: Retained for 2 years for dispute evidence
- **chargebacks**: Retained for 7 years for legal compliance
- **velocity_tracking**: Retained for 90 days (rolling window)

## Technology Stack

- **Backend**: .NET 8+ with C#, ASP.NET Core Web API
- **Database**: MySQL 8.0+ with InnoDB storage engine
- **Payment Gateways**: Stripe (with Radar), PayPal (with Fraud Protection)
- **Fraud Detection**: Stripe Radar, PayPal Fraud Protection, optional Kount/Sift
- **Device Fingerprinting**: FingerprintJS, DeviceAtlas, or similar
- **Geolocation**: MaxMind GeoIP2, IP2Location, or similar

## Implementation Notes

### Fraud Detection Best Practices

1. **Multi-Layered Approach**: Combine multiple fraud signals for accurate detection
2. **Machine Learning**: Leverage gateway ML models trained on billions of transactions
3. **Real-Time Analysis**: Perform fraud checks before payment processing
4. **Adaptive Thresholds**: Adjust risk thresholds based on chargeback rates
5. **False Positive Minimization**: Balance security with user experience

### 3D Secure Implementation

1. **Use 3DS 2.0**: Provides better user experience than 3DS 1.0
2. **Frictionless Flow**: Enable frictionless authentication for low-risk transactions
3. **Mobile Optimization**: Ensure smooth authentication on mobile devices
4. **Fallback Handling**: Handle cases where 3DS is not supported
5. **Liability Shift**: Document authentication for chargeback protection

### Chargeback Management

1. **Proactive Prevention**: Focus on preventing chargebacks before they occur
2. **Quick Response**: Respond to disputes within deadline (typically 7-14 days)
3. **Comprehensive Evidence**: Collect and submit all relevant documentation
4. **Pattern Analysis**: Identify and address common chargeback reasons
5. **Rate Monitoring**: Track chargeback rate and take action if approaching thresholds

### Testing Considerations

- Test fraud detection with various risk scenarios
- Verify 3DS authentication flow end-to-end
- Test AVS with different address combinations
- Validate velocity check enforcement
- Simulate chargeback dispute workflow
- Test manual review process
- Verify fraud dashboard metrics accuracy

## Acceptance Criteria

### F-COMP-PAY-006: Payment Fraud Detection Services

1. System SHALL integrate with payment gateway fraud detection services (Stripe Radar, PayPal Fraud Protection)
2. System SHALL perform fraud risk assessment before processing each payment
3. System SHALL calculate risk score based on multiple fraud signals
4. System SHALL classify transactions into risk levels (low, medium, high, critical)
5. System SHALL provide recommendation (approve, review, decline) for each transaction
6. System SHALL flag high-risk transactions for manual review
7. System SHALL maintain audit trail of all fraud checks and decisions

### F-COMP-PAY-007: 3D Secure Authentication

1. System SHALL implement 3D Secure (3DS) authentication for card transactions
2. System SHALL require 3DS for all transactions above $500
3. System SHALL require 3DS for medium and high-risk transactions regardless of amount
4. System SHALL support 3DS 2.0 with frictionless authentication
5. System SHALL redirect users to card issuer authentication page
6. System SHALL validate authentication result before processing payment
7. System SHALL store authentication data (ECI, CAVV, XID) for liability shift
8. System SHALL handle 3DS authentication failures gracefully

### F-COMP-PAY-008: Address Verification System (AVS)

1. System SHALL perform Address Verification System (AVS) checks for card payments
2. System SHALL verify billing address matches card issuer records
3. System SHALL flag transactions with AVS mismatches for additional verification
4. System SHALL use AVS results as input to fraud risk scoring
5. System SHALL handle cases where AVS is not supported by card issuer
6. System SHALL require 3DS for transactions with AVS failures

### F-COMP-PAY-009: Velocity Checks & Rate Limiting

1. System SHALL implement velocity checks limiting number of payment attempts per user/device/IP
2. System SHALL limit payment attempts to 3 per user per 15 minutes
3. System SHALL limit payment attempts to 5 per device per hour
4. System SHALL limit payment attempts to 10 per IP address per hour
5. System SHALL limit total transaction amount to $5,000 per user per day
6. System SHALL temporarily block further attempts when velocity limits are exceeded
7. System SHALL require additional verification for velocity violations

### F-COMP-PAY-010: Chargeback Prevention

1. System SHALL provide clear, recognizable merchant descriptors on credit card statements
2. System SHALL send booking confirmations and receipts immediately after transactions
3. System SHALL maintain comprehensive documentation of transactions for chargeback disputes
4. System SHALL respond promptly to customer disputes before they escalate to chargebacks
5. System SHALL track chargeback rate and maintain below 0.5%
6. System SHALL collect evidence automatically for chargeback disputes
7. System SHALL provide admin interface for managing chargebacks and submitting evidence

## Related Features

- F-COMP-PAY-001: PCI Compliance (Payment security foundation)
- F-SEC-FRAUD-001: Fraud Detection Framework (General fraud prevention)
- F-PB-001: Payment Methods (Payment processing integration)
- F-COMP-PAY-011: Security Monitoring (Ongoing fraud monitoring)
- F-INT-PAY-001: Payment Gateway Integration (Gateway connectivity)

## References

- Stripe Radar Documentation: https://stripe.com/docs/radar
- PayPal Fraud Protection: https://www.paypal.com/us/business/fraud-protection
- EMVCo 3D Secure Specification: https://www.emvco.com/emv-technologies/3d-secure/
- PCI DSS Fraud Prevention Best Practices
- Chargeback Management Guidelines
