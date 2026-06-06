# Feature: Payment Refund Processing

## Overview

Backend implementation for automated refund processing through payment gateways, supporting full and partial refunds with cancellation policy enforcement and comprehensive audit trail.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-006

## User Stories

As a backend developer, I want to implement automated refund processing, so that refunds are handled consistently according to policy.

As a system, I want to track refund status through webhooks, so that customers are notified of refund completion.

As a finance team, I want comprehensive refund audit trail, so that financial reconciliation is accurate.

## Backend Specifications

### API Endpoints

All endpoints defined in frontend specification.

### Request Schemas

All request schemas defined in frontend specification.

### Response Schemas

All response schemas defined in frontend specification.

### Business Logic

**Refund Calculation Engine**:
- Load booking and payment details
- Retrieve cancellation policy for booking
- Calculate hours until pickup
- Apply policy rules:
  - 48+ hours: 100% refund (free cancellation)
  - 24-48 hours: 50% refund
  - <24 hours: 0% refund (no refund)
- Subtract non-refundable charges (processing fees)
- Calculate final refund amount
- Support admin override with justification

**Refund Processing**:
- Validate refund request
- Determine original payment gateway
- Retrieve original transaction ID
- Call gateway refund API
- Handle gateway-specific refund flows
- Store refund record in database
- Update booking status atomically
- Send customer notification
- Log refund for audit

**Stripe Refund Processing**:
- Use Stripe Refund API
- Provide payment intent ID
- Specify refund amount (full or partial)
- Include refund reason in metadata
- Handle refund status updates via webhook
- Timeline: 5-10 business days to card

**PayPal Refund Processing**:
- Use PayPal Refund API
- Provide capture ID
- Specify refund amount
- Include refund note
- Handle instant refunds to PayPal balance
- Timeline: Instant to balance, 3-5 days to bank

**Partial Refund Logic**:
- Validate partial amount is less than original
- Track cumulative refunded amount
- Prevent over-refunding
- Support multiple partial refunds
- Update booking balance

**Refund Status Tracking**:
- Monitor refund status through webhooks
- Poll gateway API as backup
- Update database on status changes
- Send notifications on completion
- Handle refund failures with retry

**Admin Manual Refunds**:
- Validate admin permissions
- Require refund reason and notes
- Support policy override with justification
- Log admin user and timestamp
- Send notification to customer
- Track override for compliance review

### Authentication Requirements

- JWT authentication for all endpoints
- Admin role for manual refunds and overrides
- Customer can only refund own bookings
- Audit logging for all refund operations
- Rate limiting on refund requests

## Database Specifications

### Schema Changes

Add comprehensive refund tracking table.

### Table Definitions

**PaymentRefunds**:
```
CREATE TABLE PaymentRefunds (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BookingId INT NOT NULL,
    OriginalPaymentId VARCHAR(255) NOT NULL,
    RefundId VARCHAR(255) NOT NULL UNIQUE,
    Gateway ENUM('stripe', 'paypal') NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    Currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    RefundType ENUM('full', 'partial') NOT NULL,
    Status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    Reason VARCHAR(500) NOT NULL,
    AdminUserId INT,
    AdminNotes TEXT,
    PolicyOverride BOOLEAN DEFAULT FALSE,
    OverrideJustification TEXT,
    EstimatedArrival DATETIME,
    CompletedAt DATETIME,
    FailureReason TEXT,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_refunds_booking 
        FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE,
    CONSTRAINT fk_refunds_admin 
        FOREIGN KEY (AdminUserId) REFERENCES Users(Id) ON DELETE SET NULL,
    INDEX idx_booking_id (BookingId),
    INDEX idx_refund_id (RefundId),
    INDEX idx_status (Status),
    INDEX idx_gateway (Gateway),
    INDEX idx_created_at (CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- PaymentRefunds.BookingId → Bookings.Id (many-to-one, cascade delete)
- PaymentRefunds.AdminUserId → Users.Id (optional, set null on delete)

### Indexes

- UNIQUE INDEX idx_refund_id (RefundId) - Gateway refund ID lookup
- INDEX idx_booking_id (BookingId) - Booking refund queries
- INDEX idx_status (Status) - Status filtering
- INDEX idx_gateway (Gateway) - Gateway-specific queries
- INDEX idx_created_at (CreatedAt) - Chronological queries

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+

## Implementation Notes

- Process refunds through original payment gateway
- Calculate refund based on cancellation policy
- Initiate refund within 24 hours of approval
- Support full and partial refunds
- Refund to original payment method
- Handle crypto refunds at current market rate
- Send refund notifications with timeline
- Track status through webhooks
- Maintain comprehensive audit trail
- Display timeline based on payment method
- Implement admin override with justification
- Log all refund operations
- Monitor refund success rates
- Alert on refund failures
- Implement retry logic for failed refunds
- Track cumulative refunded amount per booking
- Prevent over-refunding
- Support multiple partial refunds
- Generate refund reports for finance team
- Implement refund reconciliation with gateway settlements
