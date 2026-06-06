# Feature: Payment Authorization and Capture

## Overview

Two-phase payment processing with authorization hold and delayed capture, enabling booking confirmation without immediate charge and flexible payment timing for deposits and final payments.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-008

## User Stories

As a platform operator, I want to authorize payments without immediate capture, so that bookings can be confirmed while allowing for modifications.

As a customer, I want my card authorized but not charged until pickup, so that I have flexibility to modify or cancel.

As a finance team, I want to capture payments at optimal timing, so that cash flow is managed effectively.

## Backend Specifications

### API Endpoints

**POST /api/payments/authorize**
- Purpose: Authorize payment without capture
- Authentication: Required (JWT)
- Request body: bookingId, amount, currency, paymentMethodId
- Response: Authorization ID, hold expiration

**POST /api/payments/capture**
- Purpose: Capture previously authorized payment
- Authentication: Required (JWT, System)
- Request body: authorizationId, amount
- Response: Capture ID, status

**POST /api/payments/void-authorization**
- Purpose: Cancel authorization before capture
- Authentication: Required (JWT)
- Request body: authorizationId, reason
- Response: Void confirmation

**GET /api/payments/authorizations/expiring**
- Purpose: Retrieve authorizations expiring soon
- Authentication: Required (JWT, System)
- Query params: hoursUntilExpiry
- Response: Array of expiring authorizations

### Request Schemas

**AuthorizePaymentRequest**:
- bookingId: string (required)
- amount: decimal (required)
- currency: string (required)
- paymentMethodId: string (required)
- captureMethod: string (required) - manual or automatic
- holdDuration: int (optional) - Hours to hold (default 168 = 7 days)

**CapturePaymentRequest**:
- authorizationId: string (required)
- amount: decimal (optional) - For partial capture
- finalCapture: boolean (optional) - Release remaining hold

**VoidAuthorizationRequest**:
- authorizationId: string (required)
- reason: string (required)

### Response Schemas

**AuthorizationResponse**:
- authorizationId: string
- bookingId: string
- amount: decimal
- currency: string
- status: string (authorized, expired, voided, captured)
- expiresAt: datetime
- captureBy: datetime

**CaptureResponse**:
- captureId: string
- authorizationId: string
- amount: decimal
- currency: string
- status: string (completed, pending, failed)
- capturedAt: datetime
- remainingAmount: decimal

### Business Logic

**Authorization Flow**:
- Validate payment method
- Create authorization hold on card
- Store authorization details
- Set expiration (7 days for Stripe, 3 days for PayPal)
- Confirm booking with authorized status
- Schedule automatic capture before expiration
- Monitor authorization expiration

**Capture Flow**:
- Validate authorization is still valid
- Check authorization hasn't expired
- Capture full or partial amount
- Update booking payment status
- Release remaining hold if final capture
- Send payment confirmation
- Log capture for audit

**Partial Capture**:
- Support multiple partial captures
- Track cumulative captured amount
- Prevent over-capturing
- Release remaining hold on final capture
- Update booking balance

**Authorization Expiration**:
- Monitor authorizations approaching expiration
- Send alerts 24 hours before expiry
- Automatically capture or void before expiration
- Handle expired authorizations gracefully
- Notify customer of expiration

**Void Authorization**:
- Cancel authorization before capture
- Release hold on customer card
- Update booking status
- Log void reason
- Send cancellation confirmation

**Use Cases**:
- Deposit payments: Authorize full amount, capture deposit immediately, capture balance at pickup
- Modifications: Authorize new amount, void old authorization
- Cancellations: Void authorization, no charge to customer
- Security deposits: Authorize deposit amount, capture only if damages

### Authentication Requirements

- JWT authentication for all endpoints
- System role for automatic capture jobs
- Admin role for manual void operations
- Customer can only authorize own bookings
- Rate limiting on authorization requests

## Database Specifications

### Schema Changes

Add payment authorization tracking table.

### Table Definitions

**PaymentAuthorizations** (new table):
```
CREATE TABLE PaymentAuthorizations (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BookingId INT NOT NULL,
    AuthorizationId VARCHAR(255) NOT NULL UNIQUE,
    Gateway ENUM('stripe', 'paypal') NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    Currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    Status ENUM('authorized', 'captured', 'voided', 'expired') NOT NULL DEFAULT 'authorized',
    CapturedAmount DECIMAL(10,2) DEFAULT 0.00,
    RemainingAmount DECIMAL(10,2) NOT NULL,
    PaymentMethodId VARCHAR(255) NOT NULL,
    CaptureMethod ENUM('manual', 'automatic') NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    CapturedAt DATETIME,
    VoidedAt DATETIME,
    VoidReason VARCHAR(500),
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_authorizations_booking 
        FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE,
    INDEX idx_booking_id (BookingId),
    INDEX idx_authorization_id (AuthorizationId),
    INDEX idx_status (Status),
    INDEX idx_expires_at (ExpiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- PaymentAuthorizations → Bookings (many-to-one)

### Indexes

- UNIQUE INDEX idx_authorization_id (AuthorizationId)
- INDEX idx_booking_id (BookingId)
- INDEX idx_status (Status)
- INDEX idx_expires_at (ExpiresAt) - Expiration monitoring

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+

## Implementation Notes

- Authorize payment without immediate capture
- Set appropriate hold duration (7 days Stripe, 3 days PayPal)
- Monitor authorization expiration
- Implement automatic capture job (runs hourly)
- Capture or void before expiration
- Support partial captures
- Track cumulative captured amount
- Release remaining hold on final capture
- Handle authorization expiration gracefully
- Notify customers of expiration
- Log all authorization operations
- Implement void with reason tracking
- Monitor authorization success rates
- Alert on high void rates
- Generate authorization reports
- Reconcile authorizations with captures
- Handle gateway-specific authorization limits
- Implement retry logic for failed authorizations
- Support authorization amount updates (if gateway allows)
- Clean up expired authorizations after 30 days
