# Feature: PayPal Payment Gateway Integration

## Overview

Backend implementation for PayPal payment gateway integration, providing alternative payment processing with PayPal accounts and guest checkout, webhook handling, and refund management.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-002

## User Stories

As a backend developer, I want to integrate PayPal SDK, so that customers can pay using PayPal accounts or cards through PayPal.

As a system, I want to handle PayPal webhooks reliably, so that payment status updates and disputes are processed accurately.

As a platform operator, I want to process instant refunds through PayPal, so that customer satisfaction is maintained.

## Backend Specifications

### API Endpoints

**POST /api/payments/paypal/create-order**
- Creates PayPal order for booking payment
- Validates booking exists and amount matches
- Sets order metadata with booking details
- Configures order expiration (3 hours)
- Returns order ID and approval URL

**POST /api/payments/paypal/capture-order**
- Captures approved PayPal order
- Validates order belongs to authenticated user
- Updates booking status on successful capture
- Stores capture details in database
- Sends booking confirmation notification

**POST /api/payments/paypal/webhook**
- Receives PayPal event notifications
- Verifies webhook signature using transmission ID
- Processes payment capture events
- Processes refund events
- Handles dispute notifications
- Returns 200 OK to acknowledge receipt

**POST /api/payments/paypal/refund**
- Processes full or partial refunds through PayPal
- Validates refund eligibility
- Creates refund via PayPal API
- Updates booking and payment records
- Sends refund confirmation notification

**GET /api/payments/paypal/transaction-details**
- Retrieves PayPal transaction details
- Includes PayPal fees and net amount
- Returns payer information
- Provides transaction timeline

### Request Schemas

**CreateOrderRequest**:
- bookingId: string (required)
- amount: decimal (required)
- currency: string (required)
- returnUrl: string (required)
- cancelUrl: string (required)
- description: string (optional)

**CaptureOrderRequest**:
- orderId: string (required)
- bookingId: string (required)

**RefundRequest**:
- captureId: string (required)
- amount: decimal (optional)
- reason: string (required)
- note: string (optional)

### Response Schemas

**OrderResponse**:
- orderId: string
- status: string (CREATED, APPROVED, COMPLETED)
- approvalUrl: string
- amount: decimal
- currency: string
- expiresAt: datetime

**CaptureResponse**:
- captureId: string
- status: string (COMPLETED, PENDING)
- amount: decimal
- currency: string
- transactionId: string
- payerEmail: string
- payerName: string
- capturedAt: datetime

**RefundResponse**:
- refundId: string
- status: string (COMPLETED, PENDING, FAILED)
- amount: decimal
- currency: string
- refundType: string (FULL, PARTIAL)
- estimatedArrival: string

### Business Logic

**Order Management**:
- Create PayPal order with purchase units
- Set order intent to CAPTURE
- Configure order expiration (3 hours)
- Store order ID immediately after creation
- Handle order approval by customer
- Validate order status before capture

**Payment Capture**:
- Verify order is in APPROVED status
- Capture payment through PayPal API
- Handle partial captures for deposits
- Update booking status atomically
- Store capture details in database
- Send confirmation notification

**Webhook Processing**:
- Verify webhook signature using PayPal SDK
- Check for duplicate events using event ID
- Process PAYMENT.CAPTURE.COMPLETED event
- Process PAYMENT.CAPTURE.DENIED event
- Process CUSTOMER.DISPUTE.CREATED event
- Update booking status based on event type
- Log all webhook events for audit

**Refund Processing**:
- Validate refund against cancellation policy
- Calculate refund amount
- Create refund through PayPal API
- Handle instant refunds to PayPal balance
- Update booking status
- Send refund notification

**Error Handling**:
- Catch PayPal API exceptions
- Map PayPal error codes to user messages
- Implement retry with exponential backoff
- Log errors with full context
- Provide alternative payment options on failure

### Authentication Requirements

- JWT authentication for all endpoints except webhook
- PayPal webhook signature verification
- Admin role for refund operations
- Customer can only capture own orders
- Rate limiting: 10 order creations per minute per user
- Secure storage of PayPal client credentials

## Database Specifications

### Schema Changes

Add tables for PayPal order tracking, captures, and webhook events.

### Table Definitions

**PayPalOrders**:
- Id: INT PRIMARY KEY AUTO_INCREMENT
- BookingId: INT NOT NULL
- OrderId: VARCHAR(255) NOT NULL UNIQUE
- Amount: DECIMAL(10,2) NOT NULL
- Currency: VARCHAR(3) NOT NULL DEFAULT 'USD'
- Status: ENUM('CREATED', 'APPROVED', 'COMPLETED', 'VOIDED', 'EXPIRED') NOT NULL
- ApprovalUrl: VARCHAR(500)
- CreatedAt: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- ExpiresAt: DATETIME NOT NULL
- UpdatedAt: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- CONSTRAINT fk_paypal_orders_booking FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE

**PayPalCaptures**:
- Id: INT PRIMARY KEY AUTO_INCREMENT
- OrderId: VARCHAR(255) NOT NULL
- CaptureId: VARCHAR(255) NOT NULL UNIQUE
- Amount: DECIMAL(10,2) NOT NULL
- Currency: VARCHAR(3) NOT NULL
- Status: ENUM('COMPLETED', 'PENDING', 'DECLINED', 'REFUNDED') NOT NULL
- PayerEmail: VARCHAR(255)
- PayerName: VARCHAR(255)
- TransactionId: VARCHAR(255)
- CapturedAt: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- CONSTRAINT fk_paypal_captures_order FOREIGN KEY (OrderId) REFERENCES PayPalOrders(OrderId) ON DELETE CASCADE

**PayPalWebhookEvents**:
- Id: INT PRIMARY KEY AUTO_INCREMENT
- EventId: VARCHAR(255) NOT NULL UNIQUE
- EventType: VARCHAR(100) NOT NULL
- ResourceId: VARCHAR(255)
- ProcessedAt: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- RawPayload: JSON NOT NULL
- ProcessingStatus: ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending'
- ErrorMessage: TEXT

### Relationships

- PayPalOrders → Bookings (many-to-one)
- PayPalCaptures → PayPalOrders (many-to-one)
- PayPalWebhookEvents → PayPalOrders or PayPalCaptures (optional reference)

### Indexes

- UNIQUE INDEX idx_order_id ON PayPalOrders(OrderId)
- INDEX idx_booking_id ON PayPalOrders(BookingId)
- INDEX idx_status ON PayPalOrders(Status)
- INDEX idx_expires_at ON PayPalOrders(ExpiresAt)
- UNIQUE INDEX idx_capture_id ON PayPalCaptures(CaptureId)
- INDEX idx_order_id_capture ON PayPalCaptures(OrderId)
- UNIQUE INDEX idx_event_id ON PayPalWebhookEvents(EventId)
- INDEX idx_resource_id ON PayPalWebhookEvents(ResourceId)

## Technology Stack

- Backend: .NET 8+ with C#, PayPal .NET SDK
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript, PayPal JavaScript SDK

## Implementation Notes

- Install PayPal .NET SDK NuGet package
- Configure PayPal client ID and secret in appsettings.json
- Use PayPal Smart Payment Buttons for optimal UX
- Implement OAuth 2.0 for PayPal API authentication
- Cache access tokens (9-hour expiration)
- Configure sandbox and production environments
- Implement webhook signature verification
- Store webhook events for idempotency
- Handle order expiration (3 hours default)
- Capture payment within 3 days of authorization
- Process instant refunds to PayPal balance
- Handle PayPal disputes through webhook events
- Configure webhook URL in PayPal developer dashboard
- Test all flows in PayPal sandbox
- Monitor PayPal API health
- Implement fallback to card payment if PayPal unavailable
- Use order metadata to link to booking records
- Handle currency conversion through PayPal
- Support guest checkout without PayPal account
- Implement proper error handling for PayPal API exceptions
