# Feature: PCI Compliance & Tokenization

## Overview

This feature implements comprehensive Payment Card Industry Data Security Standard (PCI DSS) compliance controls and tokenization mechanisms to securely process payment card transactions while minimizing compliance scope. The system ensures that cardholder data is protected through strategic architecture decisions, including the use of payment gateway tokenization, hosted payment pages, and strong encryption, eliminating the need to store sensitive payment information on platform servers.

## Sprint Category

sprint-mvp

## Feature IDs

- F-COMP-PAY-001: PCI-DSS Compliance Framework
- F-COMP-PAY-002: Payment Tokenization
- F-COMP-PAY-003: Secure Payment Forms
- F-COMP-PAY-004: Payment Data Encryption
- F-COMP-PAY-005: Payment Access Controls

## User Stories

### As a platform operator
I want to maintain PCI DSS compliance with minimal scope, so that customer payment information is protected, regulatory requirements are met, and costly penalties are avoided.

### As a user
I want my payment information to be encrypted and protected, so that my financial data cannot be stolen or misused.

### As a developer
I want to use tokenization to avoid storing actual card numbers, so that I can reduce PCI compliance scope and security risks.

### As a security officer
I want to restrict access to payment systems based on business need-to-know, so that exposure to sensitive payment information is minimized.

## Backend Specifications

### API Endpoints

#### Payment Token Management

**POST /api/v1/payments/tokenize**
- Purpose: Initiate tokenization process with payment gateway
- Authentication: Required (JWT)
- Request Body:
  ```
  {
    "paymentGateway": "stripe|paypal",
    "returnUrl": "string",
    "bookingId": "string"
  }
  ```
- Response:
  ```
  {
    "sessionId": "string",
    "hostedPageUrl": "string",
    "expiresAt": "ISO8601 datetime"
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 400 Bad Request

**POST /api/v1/payments/tokens/callback**
- Purpose: Receive tokenization callback from payment gateway
- Authentication: Gateway signature verification
- Request Body:
  ```
  {
    "token": "string",
    "last4": "string",
    "cardBrand": "string",
    "expiryMonth": "number",
    "expiryYear": "number",
    "customerId": "string",
    "bookingId": "string"
  }
  ```
- Response: 200 OK
- Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized

**GET /api/v1/payments/tokens**
- Purpose: Retrieve user's saved payment tokens
- Authentication: Required (JWT)
- Query Parameters: userId (string)
- Response:
  ```
  {
    "tokens": [
      {
        "tokenId": "string",
        "last4": "string",
        "cardBrand": "string",
        "expiryMonth": "number",
        "expiryYear": "number",
        "isDefault": "boolean",
        "createdAt": "ISO8601 datetime"
      }
    ]
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden

**DELETE /api/v1/payments/tokens/{tokenId}**
- Purpose: Revoke payment token
- Authentication: Required (JWT)
- Path Parameters: tokenId (string)
- Response: 204 No Content
- Status Codes: 204 No Content, 401 Unauthorized, 403 Forbidden, 404 Not Found

#### PCI Compliance Monitoring

**GET /api/v1/admin/compliance/pci/status**
- Purpose: Retrieve PCI compliance status and metrics
- Authentication: Required (JWT, Admin role)
- Response:
  ```
  {
    "complianceLevel": "SAQ-A|SAQ-A-EP|SAQ-D",
    "lastAssessmentDate": "ISO8601 date",
    "nextAssessmentDue": "ISO8601 date",
    "vulnerabilityScanStatus": "passing|failing",
    "lastScanDate": "ISO8601 date",
    "openVulnerabilities": "number",
    "criticalVulnerabilities": "number",
    "certificateExpiry": "ISO8601 date"
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden

**GET /api/v1/admin/compliance/pci/audit-logs**
- Purpose: Retrieve payment system access audit logs
- Authentication: Required (JWT, Admin role)
- Query Parameters: startDate, endDate, userId, action
- Response:
  ```
  {
    "logs": [
      {
        "timestamp": "ISO8601 datetime",
        "userId": "string",
        "action": "string",
        "resource": "string",
        "ipAddress": "string",
        "success": "boolean",
        "details": "string"
      }
    ],
    "pagination": {
      "page": "number",
      "pageSize": "number",
      "totalRecords": "number"
    }
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden

### Business Logic

#### Tokenization Flow

1. **Payment Initiation**
   - User initiates payment during booking checkout
   - System generates unique session ID for payment gateway
   - System redirects user to hosted payment page (Stripe Checkout, PayPal)
   - No cardholder data touches platform servers

2. **Token Creation**
   - User enters payment information on hosted page
   - Payment gateway validates card and creates token
   - Gateway sends callback to platform with token
   - Platform verifies callback signature for authenticity

3. **Token Storage**
   - Platform stores token ID, last 4 digits, card brand, expiry
   - Never stores full PAN, CVV, or magnetic stripe data
   - Associates token with user account for future use
   - Encrypts token at rest using AES-256

4. **Token Usage**
   - For subsequent transactions, platform sends token to gateway
   - Gateway processes payment using stored card details
   - Platform receives transaction result without accessing card data

#### PCI Compliance Controls

1. **Network Segmentation**
   - Payment processing systems isolated from other network segments
   - Firewall rules restrict traffic to payment gateway APIs only
   - No direct database access from public internet
   - VPN required for administrative access

2. **Access Control**
   - Role-based access control (RBAC) for payment systems
   - Multi-factor authentication required for admin access
   - Unique user IDs for all personnel with system access
   - Access rights reviewed quarterly

3. **Encryption Standards**
   - TLS 1.2+ for all data in transit
   - AES-256 encryption for data at rest
   - Encryption keys stored in AWS KMS / Azure Key Vault
   - Annual key rotation

4. **Vulnerability Management**
   - Quarterly vulnerability scans by Approved Scanning Vendor (ASV)
   - Critical patches applied within 30 days
   - Annual penetration testing
   - Continuous security monitoring

5. **Audit Logging**
   - All access to payment systems logged
   - Logs include user ID, timestamp, action, resource, IP address
   - Logs retained for 1 year (3 months immediately available)
   - Daily log review for suspicious activity
   - Logs secured against tampering

#### Secure Payment Form Implementation

1. **Client-Side Encryption**
   - Payment forms use payment gateway's JavaScript SDK
   - Card data encrypted in browser before transmission
   - Encrypted data sent directly to gateway, bypassing platform servers
   - Platform receives only token, never plaintext card data

2. **Form Validation**
   - Client-side validation for card number format (Luhn algorithm)
   - Expiry date validation (not expired, not too far future)
   - CVV format validation (3-4 digits)
   - Real-time feedback to user on validation errors

3. **PCI-Compliant Hosting**
   - Payment forms hosted on payment gateway's PCI-compliant infrastructure
   - Seamless branding to maintain user experience
   - HTTPS enforced with TLS 1.2+
   - Certificate pinning on mobile apps

### Authentication Requirements

- **User Authentication**: JWT token required for initiating payment tokenization
- **Gateway Authentication**: Webhook signature verification for callbacks
- **Admin Authentication**: JWT + Admin role + MFA for compliance monitoring
- **API Key Authentication**: For B2B integrations accessing payment APIs

### Authorization Rules

- Users can only tokenize payments for their own bookings
- Users can only view and delete their own payment tokens
- Admins can view compliance status and audit logs
- Admins cannot view user payment tokens or card details
- Suppliers cannot access payment system directly

### Rate Limiting

- Payment tokenization: 10 requests per minute per user
- Token retrieval: 30 requests per minute per user
- Compliance monitoring: 60 requests per minute per admin
- Audit log retrieval: 30 requests per minute per admin

### Error Handling

- Invalid payment gateway: Return 400 with supported gateways
- Expired tokenization session: Return 410 Gone with new session URL
- Invalid callback signature: Return 401 and log security event
- Token not found: Return 404 with helpful message
- Unauthorized token access: Return 403 and log security event

## Database Specifications

### Schema Changes

#### New Tables

**payment_tokens**
- Stores tokenized payment method references
- Links tokens to users for repeat transactions
- Tracks token lifecycle and expiration

**payment_audit_logs**
- Comprehensive audit trail for payment system access
- Supports PCI DSS compliance reporting
- Immutable log entries with cryptographic integrity

**pci_compliance_assessments**
- Tracks PCI DSS self-assessment questionnaires
- Records vulnerability scan results
- Maintains compliance documentation

### Table Definitions

#### payment_tokens

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | References users.id |
| gateway | ENUM('stripe', 'paypal') | NOT NULL | Payment gateway |
| gateway_token_id | VARCHAR(255) | NOT NULL | Gateway's token ID |
| last_four | CHAR(4) | NOT NULL | Last 4 digits of card |
| card_brand | VARCHAR(50) | NOT NULL | Visa, Mastercard, etc. |
| expiry_month | TINYINT | NOT NULL | 1-12 |
| expiry_year | SMALLINT | NOT NULL | YYYY format |
| is_default | BOOLEAN | DEFAULT FALSE | Default payment method |
| is_active | BOOLEAN | DEFAULT TRUE | Token validity status |
| created_at | DATETIME | NOT NULL | Token creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |
| expires_at | DATETIME | NULL | Token expiration |
| encrypted_metadata | TEXT | NULL | AES-256 encrypted additional data |

**Indexes:**
- INDEX idx_user_id (user_id)
- INDEX idx_gateway_token (gateway, gateway_token_id)
- INDEX idx_expiry (expiry_year, expiry_month)
- INDEX idx_active (is_active, user_id)

#### payment_audit_logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY AUTO_INCREMENT | Log entry ID |
| timestamp | DATETIME(6) | NOT NULL | Event timestamp with microseconds |
| user_id | VARCHAR(36) | NULL | User performing action |
| action | VARCHAR(100) | NOT NULL | Action performed |
| resource | VARCHAR(255) | NOT NULL | Resource accessed |
| resource_id | VARCHAR(36) | NULL | Specific resource ID |
| ip_address | VARCHAR(45) | NOT NULL | IPv4 or IPv6 address |
| user_agent | TEXT | NULL | Browser/client user agent |
| success | BOOLEAN | NOT NULL | Action success status |
| failure_reason | TEXT | NULL | Reason for failure |
| request_id | VARCHAR(36) | NOT NULL | Correlation ID |
| session_id | VARCHAR(255) | NULL | User session ID |
| details | JSON | NULL | Additional event details |
| integrity_hash | VARCHAR(64) | NOT NULL | SHA-256 hash for tamper detection |

**Indexes:**
- INDEX idx_timestamp (timestamp)
- INDEX idx_user_id (user_id, timestamp)
- INDEX idx_action (action, timestamp)
- INDEX idx_resource (resource, resource_id)
- INDEX idx_request_id (request_id)

#### pci_compliance_assessments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| assessment_type | ENUM('SAQ-A', 'SAQ-A-EP', 'SAQ-D', 'VULNERABILITY_SCAN', 'PENETRATION_TEST') | NOT NULL | Assessment type |
| assessment_date | DATE | NOT NULL | Date of assessment |
| status | ENUM('passing', 'failing', 'in_progress', 'not_started') | NOT NULL | Assessment status |
| assessor | VARCHAR(255) | NULL | ASV or QSA name |
| findings_count | INT | DEFAULT 0 | Number of findings |
| critical_findings | INT | DEFAULT 0 | Critical vulnerabilities |
| high_findings | INT | DEFAULT 0 | High severity findings |
| medium_findings | INT | DEFAULT 0 | Medium severity findings |
| low_findings | INT | DEFAULT 0 | Low severity findings |
| remediation_deadline | DATE | NULL | Deadline for remediation |
| attestation_submitted | BOOLEAN | DEFAULT FALSE | AOC submitted |
| report_url | VARCHAR(500) | NULL | Link to assessment report |
| notes | TEXT | NULL | Additional notes |
| created_at | DATETIME | NOT NULL | Record creation |
| updated_at | DATETIME | NOT NULL | Last update |

**Indexes:**
- INDEX idx_assessment_date (assessment_date DESC)
- INDEX idx_status (status, assessment_type)
- INDEX idx_remediation (remediation_deadline, status)

### Relationships

- payment_tokens.user_id → users.id (Many-to-One)
- payment_audit_logs.user_id → users.id (Many-to-One, nullable)
- Bookings reference payment_tokens.id for payment method

### Data Retention

- **payment_tokens**: Retained while active; deleted 90 days after expiration or user deletion
- **payment_audit_logs**: Retained for 1 year minimum (PCI requirement), 3 years recommended
- **pci_compliance_assessments**: Retained for 3 years (compliance documentation)

### Encryption

- **payment_tokens.encrypted_metadata**: AES-256-GCM encryption using AWS KMS
- **payment_tokens.gateway_token_id**: Encrypted at rest using database-level encryption
- **payment_audit_logs.details**: Sensitive fields redacted or encrypted

## Technology Stack

- **Backend**: .NET 8+ with C#, ASP.NET Core Web API
- **Database**: MySQL 8.0+ with InnoDB storage engine
- **Payment Gateways**: Stripe (primary), PayPal (alternative)
- **Encryption**: AWS KMS or Azure Key Vault for key management
- **Monitoring**: Application Insights, CloudWatch, or equivalent
- **Vulnerability Scanning**: Qualys, Tenable, or approved ASV

## Implementation Notes

### PCI Scope Minimization

1. **Use Hosted Payment Pages**: Redirect users to Stripe Checkout or PayPal for card entry
2. **Implement Tokenization**: Never store full PAN; use tokens for all transactions
3. **Network Segmentation**: Isolate payment processing from other systems
4. **Minimize Data Retention**: Store only essential payment metadata

### Compliance Roadmap

**Phase 1 (MVP)**:
- Integrate Stripe with hosted checkout
- Implement tokenization for card storage
- Complete SAQ A self-assessment
- Conduct initial vulnerability scan

**Phase 2 (Post-MVP)**:
- Add PayPal as alternative gateway
- Implement comprehensive audit logging
- Establish quarterly scan schedule
- Conduct annual penetration test

**Phase 3 (Scale)**:
- Engage Qualified Security Assessor (QSA)
- Implement advanced fraud detection
- Achieve PCI DSS Level 1 if needed
- Establish dedicated security team

### Security Best Practices

1. **Never Log Sensitive Data**: Ensure no PAN, CVV, or full card data in logs
2. **Validate Gateway Callbacks**: Always verify webhook signatures
3. **Implement Rate Limiting**: Prevent brute force attacks on payment APIs
4. **Monitor for Anomalies**: Alert on unusual payment patterns
5. **Regular Security Training**: Ensure all staff understand PCI requirements
6. **Incident Response Plan**: Maintain and test breach response procedures

### Testing Considerations

- Use payment gateway test mode for development
- Never use real card numbers in non-production environments
- Test tokenization flow end-to-end
- Verify encryption at rest and in transit
- Test access control enforcement
- Validate audit log completeness
- Simulate vulnerability scan findings

### Integration Points

- **Booking System**: Payment tokenization during checkout
- **User Management**: Associate tokens with user accounts
- **Notification Service**: Send payment confirmation emails
- **Fraud Detection**: Integrate with fraud prevention system
- **Reporting**: Compliance dashboards and metrics

## Acceptance Criteria

### F-COMP-PAY-001: PCI-DSS Compliance Framework

1. System SHALL maintain firewall configurations protecting cardholder data
2. System SHALL segment payment processing systems from other network segments
3. System SHALL never store sensitive authentication data (CVV, full magnetic stripe, PIN) after authorization
4. System SHALL use strong cryptography (AES-256) for encrypting stored payment data
5. System SHALL encrypt transmission of cardholder data using TLS 1.2 or higher
6. System SHALL implement vulnerability management program with quarterly ASV scans
7. System SHALL restrict access to cardholder data based on business need-to-know
8. System SHALL implement multi-factor authentication for administrative access to payment systems
9. System SHALL track and monitor all access to payment systems with comprehensive audit trails
10. System SHALL maintain information security policy addressing all PCI DSS requirements

### F-COMP-PAY-002: Payment Tokenization

1. System SHALL integrate with PCI-compliant payment gateway providing tokenization services
2. WHEN user enters payment information, System SHALL transmit data directly to payment gateway without touching platform servers
3. System SHALL receive and store only non-sensitive tokens, never actual card numbers
4. System SHALL use tokens for all subsequent transactions without accessing actual card data
5. System SHALL implement client-side encryption where payment information is encrypted in browser
6. System SHALL validate that tokens cannot be reverse-engineered to obtain original card numbers
7. System SHALL implement token lifecycle management including expiration and revocation

### F-COMP-PAY-003: Secure Payment Forms

1. System SHALL redirect users to payment gateway's secure hosted page for payment information entry
2. System SHALL never receive or process actual cardholder data when using hosted payment pages
3. System SHALL receive only transaction results and tokens from payment gateway
4. System SHALL implement seamless user experience with consistent branding on hosted pages
5. System SHALL validate that hosted payment pages use TLS 1.2 or higher encryption
6. System SHALL handle payment gateway redirects securely to prevent man-in-the-middle attacks

### F-COMP-PAY-004: Payment Data Encryption

1. System SHALL use TLS 1.2 or higher for all transmission of payment-related data
2. System SHALL disable older insecure protocols (SSL 2.0, SSL 3.0, TLS 1.0, TLS 1.1)
3. System SHALL implement perfect forward secrecy using ephemeral key exchange (ECDHE)
4. System SHALL use strong cipher suites (AES-256-GCM, ChaCha20-Poly1305)
5. System SHALL encrypt payment tokens at rest using AES-256 or equivalent
6. System SHALL store encryption keys separately from encrypted data using key management service
7. System SHALL implement key rotation at least annually
8. System SHALL redirect all HTTP requests to HTTPS

### F-COMP-PAY-005: Payment Access Controls

1. System SHALL restrict access to payment systems to only those individuals whose jobs require such access
2. System SHALL assign unique ID to each person with access to payment systems
3. System SHALL implement multi-factor authentication for all administrative access to payment systems
4. System SHALL implement role-based access controls limiting access based on job function
5. System SHALL review user access rights at least every six months
6. System SHALL log all access to payment systems including user ID, timestamp, action, and resource
7. System SHALL secure audit trails so they cannot be altered
8. System SHALL retain audit trail history for at least one year

## Related Features

- F-PB-001: Payment Methods (Payment processing integration)
- F-SEC-DATA-001: Data Encryption (General encryption requirements)
- F-SEC-AUTHZ-001: Role-Based Access Control (Authorization framework)
- F-COMP-PAY-006: Security Monitoring (Ongoing compliance monitoring)
- F-INT-PAY-001: Payment Gateway Integration (Gateway connectivity)

## References

- PCI Security Standards Council: https://www.pcisecuritystandards.org/
- PCI DSS v4.0 Requirements
- Stripe PCI Compliance Guide
- PayPal PCI Compliance Documentation
- OWASP Payment Security Best Practices
