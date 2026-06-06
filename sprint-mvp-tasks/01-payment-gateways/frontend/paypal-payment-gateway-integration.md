# Feature: PayPal Payment Gateway Integration

## Overview

PayPal payment gateway integration provides alternative payment processing supporting PayPal accounts and guest card checkout, offering customers a trusted payment brand with buyer protection and instant refunds.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-002

## User Stories

As a customer, I want to pay using my PayPal account, so that I can use my PayPal balance and benefit from buyer protection.

As a customer without a PayPal account, I want to pay with a card through PayPal guest checkout, so that I have payment method flexibility.

As a platform operator, I want to offer PayPal as an alternative to card payments, so that cart abandonment is reduced and global reach is expanded.

## Frontend Specifications

### Pages

- Checkout page with PayPal button integration
- Payment confirmation page with PayPal transaction details
- Refund status page for PayPal refunds

### UI Components

- PayPal Smart Payment Buttons component
- PayPal payment method selector
- PayPal account connection indicator
- Payment status display with PayPal branding
- Loading state during PayPal authorization
- Error message component for PayPal failures

### User Flows

1. Customer proceeds to checkout from booking summary
2. System displays PayPal button alongside other payment options
3. Customer clicks PayPal button
4. PayPal popup window opens for authentication
5. Customer logs into PayPal or proceeds as guest
6. Customer reviews and approves payment in PayPal interface
7. PayPal popup closes and returns to platform
8. System captures payment and displays confirmation
9. Customer receives booking confirmation with PayPal transaction ID

### Data Requirements

- Booking ID and amount from booking service
- Customer email for PayPal account linking
- Currency selection from user preferences
- PayPal order ID from backend
- Transaction status from PayPal webhook
- Refund status for cancelled bookings

## Backend Specifications

### API Endpoints

**POST /api/payments/paypal/create-order**
- Purpose: Create PayPal order for booking payment
- Authentication: Required (JWT)
- Request body: bookingId, amount, currency
- Response: PayPal order ID and approval URL

**POST /api/payments/paypal/capture-order**
- Purpose: Capture approved PayPal order
- Authentication: Required (JWT)
- Request body: orderId
- Response: Capture details and transaction ID

**POST /api/payments/paypal/webhook**
- Purpose: Receive payment status updates from PayPal
- Authentication: PayPal webhook signature verification
- Request body: PayPal event object
- Response: 200 OK acknowledgment

**POST /api/payments/paypal/refund**
- Purpose: Process refund through PayPal
- Authentication: Required (JWT, Admin role)
- Request body: captureId, amount, reason
- Response: Refund ID and status

**GET /api/payments/paypal/transaction-details**
- Purpose: Retrieve PayPal transaction details
- Authentication: Required (JWT)
- Query params: transactionId
- Response: Transaction details including fees

### Request Schemas

**CreateOrderRequest**:
- bookingId: string (required) - Booking reference
- amount: decimal (required) - Payment amount
- currency: string (required) - ISO currency code
- returnUrl: string (required) - Success redirect URL
- cancelUrl: string (required) - Cancel redirect URL

**CaptureOrderRequest**:
- orderId: string (required) - PayPal order ID
- bookingId: string (required) - Booking reference for validation

**RefundRequest**:
- captureId: string (required) - PayPal capture ID
- amount: decimal (optional) - Partial refund amount
- reason: string (required) - Refund reason
- note: string (optional) - Additional notes

### Response Schemas

**OrderResponse**:
- orderId: string - PayPal order ID
- status: string - Order status (CREATED, APPROVED, COMPLETED)
- approvalUrl: string - URL for customer approval
- amount: decimal
- currency: string

**CaptureResponse**:
- captureId: string - PayPal capture ID
- status: string - Capture status (COMPLETED, PENDING)
- amount: decimal
- currency: string
- transactionId: string
- payerEmail: string

**RefundResponse**:
- refundId: string
- status: string - Refund status (COMPLETED, PENDING)
- amount: decimal
- currency: string
- refundType: string - FULL or PARTIAL

### Business Logic

- Create PayPal order with booking details in metadata
- Store order ID in database before customer approval
- Implement order expiration (3 hours)
- Capture order only after customer approval
- Handle partial captures for deposit payments
- Process refunds instantly to PayPal balance
- Update booking status based on capture result
- Handle PayPal disputes through webhook events
- Implement retry logic for API failures
- Log all PayPal transactions for reconciliation

### Authentication Requirements

- JWT authentication for all payment endpoints
- PayPal webhook signature verification using transmission ID and signature
- Admin role required for refund operations
- Customer can only capture their own orders
- Rate limiting on order creation (10 requests per minute)

## Database Specifications

### Schema Changes

Add PayPal-specific tables for order tracking and webhook events.

### Table Definitions

**PayPalOrders** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- BookingId: INT NOT NULL
- OrderId: VARCHAR(255) NOT NULL UNIQUE
- Amount: DECIMAL(10,2) NOT NULL
- Currency: VARCHAR(3) NOT NULL
- Status: VARCHAR(50) NOT NULL
- ApprovalUrl: VARCHAR(500)
- CreatedAt: DATETIME NOT NULL
- ExpiresAt: DATETIME NOT NULL
- UpdatedAt: DATETIME NOT NULL
- INDEX idx_booking_id (BookingId)
- INDEX idx_order_id (OrderId)
- INDEX idx_status (Status)

**PayPalCaptures** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- OrderId: VARCHAR(255) NOT NULL
- CaptureId: VARCHAR(255) NOT NULL UNIQUE
- Amount: DECIMAL(10,2) NOT NULL
- Currency: VARCHAR(3) NOT NULL
- Status: VARCHAR(50) NOT NULL
- PayerEmail: VARCHAR(255)
- TransactionId: VARCHAR(255)
- CapturedAt: DATETIME NOT NULL
- INDEX idx_order_id (OrderId)
- INDEX idx_capture_id (CaptureId)

**PayPalWebhookEvents** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- EventId: VARCHAR(255) NOT NULL UNIQUE
- EventType: VARCHAR(100) NOT NULL
- ResourceId: VARCHAR(255)
- ProcessedAt: DATETIME NOT NULL
- RawPayload: JSON NOT NULL
- INDEX idx_event_id (EventId)
- INDEX idx_resource_id (ResourceId)

### Relationships

- PayPalOrders.BookingId → Bookings.Id (many-to-one)
- PayPalCaptures.OrderId → PayPalOrders.OrderId (many-to-one)
- PayPalWebhookEvents.ResourceId → PayPalOrders.OrderId or PayPalCaptures.CaptureId (optional)

### Indexes

- idx_booking_id on PayPalOrders for booking payment queries
- idx_order_id on PayPalOrders for PayPal API operations
- idx_status for order status filtering
- idx_capture_id on PayPalCaptures for refund operations
- idx_event_id on PayPalWebhookEvents for idempotent processing

## Technology Stack

- Backend: .NET 8+ with C#, PayPal .NET SDK
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript, PayPal JavaScript SDK

## Implementation Notes

- Use PayPal Smart Payment Buttons for optimal UX
- Implement OAuth 2.0 authentication for PayPal API
- Configure sandbox and production environments
- Store webhook events for idempotency
- Handle order expiration (3 hours default)
- Implement capture within 3 days of authorization
- Process refunds instantly to PayPal balance (3-5 days to bank)
- Handle PayPal disputes and chargebacks through webhooks
- Configure webhook URL in PayPal developer dashboard
- Test all flows in PayPal sandbox environment
- Monitor PayPal API health and response times
- Implement fallback to card payment if PayPal unavailable
- Cache PayPal access tokens (expires in 9 hours)
- Use PayPal order metadata to link to booking records
