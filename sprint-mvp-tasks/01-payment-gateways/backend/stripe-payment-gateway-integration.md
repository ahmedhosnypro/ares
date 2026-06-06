# Feature: Stripe Payment Gateway Integration

## Overview

Backend implementation for Stripe payment gateway integration, providing secure payment processing, tokenization, webhook handling, and transaction management for the car rental platform.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-001

## User Stories

As a backend developer, I want to integrate Stripe SDK, so that payment processing is secure and PCI compliant.

As a system, I want to handle Stripe webhooks reliably, so that payment status updates are processed accurately.

As a platform operator, I want to tokenize customer payment methods, so that repeat payments are seamless and secure.

## Backend Specifications

### API Endpoints

**POST /api/payments/stripe/create-checkout-session**
- Creates Stripe Checkout session for hosted payment page
- Validates booking exists and amount matches
- Creates or retrieves Stripe customer
- Sets session metadata with booking details
- Returns session ID and URL

**POST /api/payments/stripe/create-payment-intent**
- Creates Payment Intent for custom payment flows
- Supports saved payment methods
- Implements idempotency using booking ID
- Returns client secret for frontend confirmation

**POST /api/payments/stripe/webhook**
- Receives Stripe event notifications
- Verifies webhook signature
- Processes payment status updates
- Updates booking status accordingly
- Returns 200 OK to acknowledge receipt

**GET /api/payments/stripe/payment-methods**
- Retrieves customer's saved payment methods from Stripe
- Filters active payment methods only
- Returns sanitized card information (last 4 digits, brand)

**POST /api/payments/stripe/attach-payment-method**
- Attaches payment method to Stripe customer
- Sets as default if first payment method
- Validates payment method ownership

**POST /api/payments/stripe/refund**
- Processes full or partial refunds
- Validates refund eligibility based on cancellation policy
- Creates refund through Stripe API
- Updates booking and payment records
- Sends refund confirmation notification

### Request Schemas

All request schemas defined in frontend specification apply to backend validation.

### Response Schemas

All response schemas defined in frontend specification.

### Business Logic

**Customer Management**:
- Create Stripe customer on first payment
- Store Stripe customer ID in database
- Reuse customer ID for subsequent payments
- Update customer metadata with user profile changes

**Payment Processing**:
- Validate booking exists and is in correct state
- Calculate total amount including taxes and fees
- Create Payment Intent with booking metadata
- Implement idempotency using unique key per booking
- Enable automatic payment method saving
- Configure 3D Secure for amounts > $500
- Handle payment confirmation asynchronously

**Webhook Processing**:
- Verify webhook signature using Stripe signing secret
- Check for duplicate events using event ID
- Process payment_intent.succeeded event
- Process payment_intent.payment_failed event
- Process charge.refunded event
- Update booking status atomically
- Send customer notifications on status changes
- Log all webhook events for audit trail

**Refund Processing**:
- Validate refund request against cancellation policy
- Calculate refund amount (full or partial)
- Create refund through Stripe API
- Handle refund failures with retry logic
- Update booking status to refunded
- Send refund confirmation email

**Error Handling**:
- Catch Stripe API exceptions
- Map Stripe error codes to user-friendly messages
- Implement retry logic with exponential backoff
- Log all errors with context for debugging
- Provide fallback payment options on gateway failure

### Authentication Requirements

- JWT authentication for all endpoints except webhook
- Webhook signature verification using Stripe-Signature header
- Admin role required for refund operations
- Customer can only access own payment methods and transactions
- Rate limiting: 10 payment creations per minute per user
- API key rotation support for Stripe credentials

## Database Specifications

### Schema Changes

Add tables for Stripe customer mapping, payment intents, and webhook events.

### Table Definitions

**StripeCustomers**:
- Id: INT PRIMARY KEY AUTO_INCREMENT
- UserId: INT NOT NULL UNIQUE
- StripeCustomerId: VARCHAR(255) NOT NULL UNIQUE
- CreatedAt: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- UpdatedAt: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- CONSTRAINT fk_stripe_customers_user FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE

**StripePaymentIntents**:
- Id: INT PRIMARY KEY AUTO_INCREMENT
- BookingId: INT NOT NULL
- PaymentIntentId: VARCHAR(255) NOT NULL UNIQUE
- Amount: DECIMAL(10,2) NOT NULL
- Currency: VARCHAR(3) NOT NULL DEFAULT 'USD'
- Status: ENUM('requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'canceled') NOT NULL
- PaymentMethodId: VARCHAR(255)
- ClientSecret: VARCHAR(500)
- IdempotencyKey: VARCHAR(255) UNIQUE
- Metadata: JSON
- CreatedAt: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- UpdatedAt: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- CONSTRAINT fk_stripe_payment_intents_booking FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE

**StripeWebhookEvents**:
- Id: INT PRIMARY KEY AUTO_INCREMENT
- EventId: VARCHAR(255) NOT NULL UNIQUE
- EventType: VARCHAR(100) NOT NULL
- PaymentIntentId: VARCHAR(255)
- ProcessedAt: DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- RawPayload: JSON NOT NULL
- ProcessingStatus: ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending'
- ErrorMessage: TEXT
- CONSTRAINT fk_stripe_webhook_payment_intent FOREIGN KEY (PaymentIntentId) REFERENCES StripePaymentIntents(PaymentIntentId) ON DELETE SET NULL

### Relationships

- StripeCustomers → Users (one-to-one)
- StripePaymentIntents → Bookings (many-to-one)
- StripeWebhookEvents → StripePaymentIntents (many-to-one, optional)

### Indexes

- UNIQUE INDEX idx_stripe_customer_id ON StripeCustomers(StripeCustomerId)
- INDEX idx_user_id ON StripeCustomers(UserId)
- UNIQUE INDEX idx_payment_intent_id ON StripePaymentIntents(PaymentIntentId)
- INDEX idx_booking_id ON StripePaymentIntents(BookingId)
- INDEX idx_status ON StripePaymentIntents(Status)
- UNIQUE INDEX idx_idempotency_key ON StripePaymentIntents(IdempotencyKey)
- UNIQUE INDEX idx_event_id ON StripeWebhookEvents(EventId)
- INDEX idx_payment_intent_webhook ON StripeWebhookEvents(PaymentIntentId)
- INDEX idx_event_type ON StripeWebhookEvents(EventType)

## Technology Stack

- Backend: .NET 8+ with C#, Stripe.net SDK v43+
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript, @stripe/stripe-js

## Implementation Notes

- Install Stripe.net NuGet package
- Configure Stripe API keys in appsettings.json (use secrets manager)
- Use Stripe Checkout for SAQ A PCI compliance
- Implement webhook endpoint with signature verification
- Store webhook events for idempotency (check EventId before processing)
- Use Payment Intent pattern for transaction lifecycle
- Enable automatic payment method saving via setup_future_usage parameter
- Configure Stripe Radar for fraud detection in dashboard
- Set webhook retry logic with exponential backoff
- Implement polling as backup for webhook failures (check payment status after 30 seconds)
- Use Stripe test mode for development (test API keys)
- Configure multi-currency support in Stripe dashboard
- Set up 3D Secure authentication rules (automatic for >$500)
- Map Stripe error codes to user-friendly messages
- Cache Stripe customer IDs to avoid duplicate creation
- Use metadata to link Stripe objects to booking records
- Implement proper exception handling for Stripe API calls
- Set up monitoring for webhook delivery failures
- Configure webhook endpoint URL in Stripe dashboard
- Test all payment flows in Stripe sandbox environment
