# Feature: Stripe Payment Gateway Integration

## Overview

Stripe payment gateway integration provides comprehensive payment processing capabilities for the car rental platform, supporting credit/debit cards, subscriptions, and international payments with built-in PCI compliance through hosted checkout pages and tokenization.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-001

## User Stories

As a customer, I want to pay for my rental using credit/debit cards through Stripe, so that my payment information is protected and transactions are processed reliably.

As a platform operator, I want to use Stripe's hosted checkout pages, so that PCI compliance scope is minimized and security is maintained.

As an international customer, I want to pay in my local currency through Stripe, so that I understand the exact cost without manual conversion.

## Frontend Specifications

### Pages

- Checkout page with Stripe payment integration
- Payment method management page for saved cards
- Payment confirmation page with transaction details

### UI Components

- Stripe Checkout button component
- Stripe Elements integration for card input (fallback)
- Payment method selector with saved cards
- Currency selector dropdown
- Payment status indicator
- Loading spinner during payment processing
- Error message display component

### User Flows

1. Customer proceeds to checkout from booking summary
2. System displays Stripe Checkout button
3. Customer clicks button and redirects to Stripe-hosted payment page
4. Customer enters card details on Stripe's secure page
5. Stripe processes payment with 3D Secure if required
6. Customer redirects back to platform with payment result
7. System displays confirmation or error message
8. For saved customers, system displays saved payment methods for one-click checkout

### Data Requirements

- Booking ID and amount from booking service
- Customer ID for tokenization
- Currency selection from user preferences
- Return URL for post-payment redirect
- Payment Intent ID from backend
- Transaction status from webhook

## Backend Specifications

### API Endpoints

**POST /api/payments/stripe/create-checkout-session**
- Purpose: Create Stripe Checkout session for booking payment
- Authentication: Required (JWT)
- Request body: bookingId, amount, currency, successUrl, cancelUrl
- Response: Checkout session ID and URL

**POST /api/payments/stripe/create-payment-intent**
- Purpose: Create Payment Intent for custom payment flows
- Authentication: Required (JWT)
- Request body: bookingId, amount, currency, paymentMethodId
- Response: Payment Intent ID and client secret

**POST /api/payments/stripe/webhook**
- Purpose: Receive payment status updates from Stripe
- Authentication: Stripe signature verification
- Request body: Stripe event object
- Response: 200 OK acknowledgment

**GET /api/payments/stripe/payment-methods**
- Purpose: Retrieve customer's saved payment methods
- Authentication: Required (JWT)
- Response: Array of tokenized payment methods

**POST /api/payments/stripe/attach-payment-method**
- Purpose: Save payment method for future use
- Authentication: Required (JWT)
- Request body: paymentMethodId
- Response: Confirmation of attachment

**POST /api/payments/stripe/refund**
- Purpose: Process refund through Stripe
- Authentication: Required (JWT, Admin role)
- Request body: paymentIntentId, amount, reason
- Response: Refund ID and status

### Request Schemas

**CreateCheckoutSessionRequest**:
- bookingId: string (required) - Booking reference
- amount: decimal (required) - Payment amount in cents
- currency: string (required) - ISO currency code (USD, EUR, etc.)
- successUrl: string (required) - Redirect URL on success
- cancelUrl: string (required) - Redirect URL on cancellation
- customerId: string (optional) - Stripe customer ID for saved methods

**CreatePaymentIntentRequest**:
- bookingId: string (required)
- amount: decimal (required)
- currency: string (required)
- paymentMethodId: string (optional) - For saved payment methods
- setupFutureUsage: boolean (optional) - Save for future payments

**RefundRequest**:
- paymentIntentId: string (required)
- amount: decimal (optional) - Partial refund amount
- reason: string (required) - Refund reason

### Response Schemas

**CheckoutSessionResponse**:
- sessionId: string - Stripe Checkout session ID
- url: string - Hosted checkout page URL
- expiresAt: datetime - Session expiration time

**PaymentIntentResponse**:
- paymentIntentId: string
- clientSecret: string - For frontend confirmation
- status: string - Payment status (requires_payment_method, requires_confirmation, succeeded, etc.)
- amount: decimal
- currency: string

**PaymentMethodResponse**:
- id: string - Payment method ID
- type: string - Card type (visa, mastercard, etc.)
- last4: string - Last 4 digits
- expiryMonth: int
- expiryYear: int
- isDefault: boolean

**RefundResponse**:
- refundId: string
- status: string - Refund status (pending, succeeded, failed)
- amount: decimal
- currency: string
- estimatedArrival: datetime

### Business Logic

- Create Stripe customer on first payment for tokenization
- Store Stripe customer ID in user profile
- Implement idempotency keys using booking ID + timestamp
- Enable 3D Secure for transactions above $500
- Set payment intent metadata with booking details
- Handle payment confirmation asynchronously via webhooks
- Update booking status based on payment result
- Implement retry logic for failed API calls
- Cache payment method tokens securely
- Calculate refund amounts based on cancellation policy

### Authentication Requirements

- JWT authentication for all payment endpoints
- Stripe webhook signature verification using signing secret
- Admin role required for refund operations
- Customer can only access their own payment methods
- Rate limiting on payment creation endpoints (10 requests per minute)

## Database Specifications

### Schema Changes

Add Stripe-specific fields to existing payment tables.

### Table Definitions

**StripeCustomers** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- UserId: INT NOT NULL FOREIGN KEY → Users.Id
- StripeCustomerId: VARCHAR(255) NOT NULL UNIQUE
- CreatedAt: DATETIME NOT NULL
- UpdatedAt: DATETIME NOT NULL
- INDEX idx_user_id (UserId)
- INDEX idx_stripe_customer_id (StripeCustomerId)

**StripePaymentIntents** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- BookingId: INT NOT NULL FOREIGN KEY → Bookings.Id
- PaymentIntentId: VARCHAR(255) NOT NULL UNIQUE
- Amount: DECIMAL(10,2) NOT NULL
- Currency: VARCHAR(3) NOT NULL
- Status: VARCHAR(50) NOT NULL
- PaymentMethodId: VARCHAR(255)
- ClientSecret: VARCHAR(500)
- CreatedAt: DATETIME NOT NULL
- UpdatedAt: DATETIME NOT NULL
- INDEX idx_booking_id (BookingId)
- INDEX idx_payment_intent_id (PaymentIntentId)
- INDEX idx_status (Status)

**StripeWebhookEvents** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- EventId: VARCHAR(255) NOT NULL UNIQUE
- EventType: VARCHAR(100) NOT NULL
- PaymentIntentId: VARCHAR(255)
- ProcessedAt: DATETIME NOT NULL
- RawPayload: JSON NOT NULL
- INDEX idx_event_id (EventId)
- INDEX idx_payment_intent_id (PaymentIntentId)

### Relationships

- StripeCustomers.UserId → Users.Id (one-to-one)
- StripePaymentIntents.BookingId → Bookings.Id (one-to-many)
- StripeWebhookEvents.PaymentIntentId → StripePaymentIntents.PaymentIntentId (one-to-many)

### Indexes

- idx_user_id on StripeCustomers for fast customer lookup
- idx_stripe_customer_id for Stripe API operations
- idx_booking_id on StripePaymentIntents for booking payment queries
- idx_payment_intent_id for webhook event processing
- idx_status for payment status filtering
- idx_event_id on StripeWebhookEvents for idempotent webhook processing

## Technology Stack

- Backend: .NET 8+ with C#, Stripe.net SDK
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript, @stripe/stripe-js library

## Implementation Notes

- Use Stripe Checkout for hosted payment pages (SAQ A compliance)
- Implement webhook endpoint with signature verification
- Store webhook events for idempotency and audit trail
- Use Payment Intent pattern for transaction lifecycle
- Enable automatic payment method saving for repeat customers
- Configure Stripe Radar for fraud detection
- Set up webhook retry logic with exponential backoff
- Implement polling as backup for webhook failures
- Use Stripe test mode for development and staging environments
- Configure multi-currency support through Stripe dashboard
- Set up 3D Secure authentication for high-value transactions
- Implement proper error handling for declined payments
- Cache Stripe customer IDs to avoid duplicate customer creation
- Use metadata fields to link Stripe objects to booking records
