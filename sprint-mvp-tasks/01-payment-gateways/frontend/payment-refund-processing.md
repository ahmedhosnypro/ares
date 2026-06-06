# Feature: Payment Refund Processing

## Overview

Automated refund processing through payment gateways with support for full and partial refunds, cancellation policy enforcement, and multi-gateway refund handling.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-006

## User Stories

As a customer, I want refunds processed automatically according to cancellation policy, so that I receive my money back promptly when eligible.

As a support agent, I want to process manual refunds with reason tracking, so that customer issues are resolved quickly.

As a finance team member, I want to track all refunds with audit trail, so that financial reconciliation is accurate.

## Frontend Specifications

### Pages

- Booking cancellation page with refund calculator
- Refund status tracking page
- Refund history page in account dashboard
- Admin refund management page

### UI Components

- Refund amount calculator
- Cancellation policy display
- Refund timeline indicator
- Refund status badge (pending, processing, completed)
- Refund method display (original payment method)
- Refund reason selector (admin)
- Refund confirmation modal

### User Flows

**Customer Refund Flow**:
1. Customer navigates to booking details
2. Customer clicks cancel booking button
3. System displays cancellation policy and refund amount
4. Customer confirms cancellation
5. System processes refund automatically
6. System displays refund confirmation with timeline
7. Customer receives email notification
8. Customer can track refund status in booking history

**Admin Manual Refund Flow**:
1. Admin navigates to booking details
2. Admin clicks issue refund button
3. Admin selects refund type (full or partial)
4. Admin enters refund amount and reason
5. System validates refund eligibility
6. Admin confirms refund
7. System processes refund through gateway
8. System logs refund with admin details
9. Customer receives refund notification

### Data Requirements

- Booking details and payment information
- Cancellation policy rules
- Refund calculation logic
- Payment gateway transaction IDs
- Refund status from gateway webhooks
- Refund timeline by payment method

## Backend Specifications

### API Endpoints

**POST /api/payments/refunds/calculate**
- Purpose: Calculate refund amount based on cancellation policy
- Authentication: Required (JWT)
- Request body: bookingId, cancellationDate
- Response: Refund amount, fees, policy details

**POST /api/payments/refunds/process**
- Purpose: Process refund through payment gateway
- Authentication: Required (JWT)
- Request body: bookingId, amount, reason, refundType
- Response: Refund ID, status, estimated arrival

**GET /api/payments/refunds/status**
- Purpose: Check refund status
- Authentication: Required (JWT)
- Query params: refundId
- Response: Current status, timeline, tracking details

**GET /api/payments/refunds/history**
- Purpose: Retrieve refund history for user or booking
- Authentication: Required (JWT)
- Query params: userId, bookingId, startDate, endDate
- Response: Array of refund records

**POST /api/payments/refunds/admin**
- Purpose: Admin manual refund processing
- Authentication: Required (JWT, Admin role)
- Request body: bookingId, amount, reason, adminNotes
- Response: Refund details

### Request Schemas

**CalculateRefundRequest**:
- bookingId: string (required)
- cancellationDate: datetime (required)
- cancellationReason: string (optional)

**ProcessRefundRequest**:
- bookingId: string (required)
- amount: decimal (optional) - For partial refunds
- reason: string (required)
- refundType: string (required) - full or partial
- adminOverride: boolean (optional)

**AdminRefundRequest**:
- bookingId: string (required)
- amount: decimal (required)
- reason: string (required)
- adminNotes: string (required)
- bypassPolicy: boolean (optional)

### Response Schemas

**RefundCalculationResponse**:
- eligibleAmount: decimal
- cancellationFee: decimal
- refundAmount: decimal
- policyDetails: object
  - policyType: string
  - freeUntil: datetime
  - feePercentage: decimal
- refundTimeline: string

**RefundResponse**:
- refundId: string
- bookingId: string
- amount: decimal
- currency: string
- status: string (pending, processing, completed, failed)
- gateway: string (stripe, paypal)
- estimatedArrival: datetime
- refundMethod: string
- processedAt: datetime

**RefundStatusResponse**:
- refundId: string
- status: string
- currentStep: string
- timeline: array of status updates
- estimatedCompletion: datetime

### Business Logic

**Refund Calculation**:
- Retrieve booking and payment details
- Apply cancellation policy rules
- Calculate cancellation fees based on timing
- Determine eligible refund amount
- Account for non-refundable charges
- Calculate partial refunds for modifications

**Cancellation Policy Rules**:
- Free cancellation: Full refund if cancelled 48+ hours before pickup
- Partial refund: 50% refund if cancelled 24-48 hours before pickup
- No refund: No refund if cancelled <24 hours before pickup
- Admin override: Allow manual refund with justification

**Refund Processing**:
- Validate refund eligibility
- Determine payment gateway from original transaction
- Call gateway refund API
- Store refund record in database
- Update booking status to refunded
- Send customer notification
- Log refund for audit trail

**Multi-Gateway Refund Handling**:
- Route refund to original payment gateway
- Handle Stripe refunds (5-10 business days to card)
- Handle PayPal refunds (instant to balance, 3-5 days to bank)
- Handle crypto refunds (instant blockchain transaction)
- Track refund status through gateway webhooks

**Partial Refund Logic**:
- Support partial refunds for booking modifications
- Calculate prorated amounts
- Process multiple partial refunds if needed
- Track total refunded amount
- Prevent over-refunding

### Authentication Requirements

- JWT authentication for all refund endpoints
- Admin role required for manual refunds
- Customer can only refund own bookings
- Admin override requires justification and audit logging
- Rate limiting on refund requests (5 per hour per user)

## Database Specifications

### Schema Changes

Add refund tracking table with audit trail.

### Table Definitions

**PaymentRefunds** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- BookingId: INT NOT NULL
- OriginalPaymentId: VARCHAR(255) NOT NULL
- RefundId: VARCHAR(255) NOT NULL UNIQUE
- Gateway: ENUM('stripe', 'paypal') NOT NULL
- Amount: DECIMAL(10,2) NOT NULL
- Currency: VARCHAR(3) NOT NULL
- RefundType: ENUM('full', 'partial') NOT NULL
- Status: ENUM('pending', 'processing', 'completed', 'failed') NOT NULL
- Reason: VARCHAR(500) NOT NULL
- AdminUserId: INT
- AdminNotes: TEXT
- PolicyOverride: BOOLEAN DEFAULT FALSE
- EstimatedArrival: DATETIME
- CompletedAt: DATETIME
- CreatedAt: DATETIME NOT NULL
- INDEX idx_booking_id (BookingId)
- INDEX idx_refund_id (RefundId)
- INDEX idx_status (Status)

### Relationships

- PaymentRefunds.BookingId → Bookings.Id (many-to-one)
- PaymentRefunds.AdminUserId → Users.Id (optional, for manual refunds)

### Indexes

- UNIQUE INDEX idx_refund_id (RefundId)
- INDEX idx_booking_id (BookingId)
- INDEX idx_status (Status)
- INDEX idx_gateway (Gateway)
- INDEX idx_created_at (CreatedAt)

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript

## Implementation Notes

- Process refunds through original payment gateway
- Calculate refund amount based on cancellation policy
- Initiate refund within 24 hours of cancellation approval
- Support both full and partial refunds
- Refund to original payment method
- Handle crypto refunds at current market rate
- Send refund notifications with timeline
- Track refund status through webhooks
- Maintain refund audit trail
- Display refund timeline based on payment method
- Implement admin override with justification
- Log all refund operations
- Monitor refund success rates
- Alert on refund failures
- Implement refund retry logic for failures
