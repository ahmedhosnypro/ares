# Feature: Multiple Payment Method Support (Backend)

## Overview

Backend payment processing infrastructure supporting multiple payment methods including credit/debit cards, digital wallets, PayPal, bank transfers, platform wallet, and corporate billing. Implements secure payment processing with PCI-DSS compliance, tokenization, 3D Secure authentication, fraud detection, and comprehensive transaction management.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

F-PB-001 (Backend Implementation)

## Backend Specifications

### API Endpoints

**GET `/api/v1/payment-methods/available`**
- Purpose: Get available payment methods for region and amount
- Authentication: Required (JWT)
- Authorization: Any authenticated user
- Query Parameters:
  - `region` (string, optional): ISO 3166-1 alpha-2 country code
  - `amount` (decimal, optional): Transaction amount for filtering
  - `currency` (string, optional): ISO 4217 currency code
- Response: 200 OK with payment method configurations
- Error Responses: 401 Unauthorized

**POST `/api/v1/payment-methods`**
- Purpose: Save payment method for user
- Authentication: Required (JWT)
- Authorization: User can only save to own account
- Request Body: SavePaymentMethodRequest
- Response: 201 Created with payment method details
- Error Responses: 400 Bad Request, 401 Unauthorized, 422 Validation Error

**GET `/api/v1/payment-methods`**
- Purpose: Retrieve user's saved payment methods
- Authentication: Required (JWT)
- Authorization: User can only view own payment methods
- Query Parameters:
  - `includeExpired` (boolean, optional): Include expired cards
- Response: 200 OK with array of payment methods
- Error Responses: 401 Unauthorized

**PUT `/api/v1/payment-methods/{id}/default`**
- Purpose: Set payment method as default
- Authentication: Required (JWT)
- Authorization: User must own payment method
- Path Parameters:
  - `id` (guid, required): Payment method ID
- Response: 200 OK
- Error Responses: 401 Unauthorized, 404 Not Found

**DELETE `/api/v1/payment-methods/{id}`**
- Purpose: Remove saved payment method
- Authentication: Required (JWT)
- Authorization: User must own payment method
- Path Parameters:
  - `id` (guid, required): Payment method ID
- Response: 204 No Content
- Error Responses: 401 Unauthorized, 404 Not Found, 409 Conflict (if used in pending booking)

**POST `/api/v1/payments/process`**
- Purpose: Process payment transaction
- Authentication: Required (JWT)
- Authorization: User must own booking
- Request Body: ProcessPaymentRequest
- Response: 200 OK with transaction result
- Error Responses: 400 Bad Request, 401 Unauthorized, 402 Payment Required, 422 Validation Error

**POST `/api/v1/payments/authorize`**
- Purpose: Pre-authorize payment without charging
- Authentication: Required (JWT)
- Authorization: User must own booking
- Request Body: AuthorizePaymentRequest
- Response: 200 OK with authorization details
- Error Responses: 400 Bad Request, 401 Unauthorized, 402 Payment Required

**POST `/api/v1/payments/capture/{authorizationId}`**
- Purpose: Capture previously authorized payment
- Authentication: Required (JWT)
- Authorization: Supplier or Admin role
- Path Parameters:
  - `authorizationId` (guid, required): Authorization ID
- Request Body:
  - `amount` (decimal, required): Amount to capture (≤ authorized amount)
- Response: 200 OK with transaction details
- Error Responses: 401 Unauthorized, 404 Not Found, 409 Conflict (if expired)

**POST `/api/v1/payments/release/{authorizationId}`**
- Purpose: Release authorization hold
- Authentication: Required (JWT)
- Authorization: Supplier or Admin role
- Path Parameters:
  - `authorizationId` (guid, required): Authorization ID
- Response: 200 OK
- Error Responses: 401 Unauthorized, 404 Not Found

### Business Logic

**Payment Method Management**:
- Tokenize payment data through payment gateway before storage
- Store only tokenized references, never raw card data
- Validate card expiration dates
- Check for duplicate payment methods before saving
- Automatically mark expired cards
- Send expiration notifications 30 days before expiry
- Soft delete payment methods (retain for transaction history)

**Payment Processing**:
- Validate booking exists and belongs to user
- Check booking status allows payment
- Verify payment amount matches booking total
- Calculate fraud risk score using multiple signals
- Route to appropriate payment gateway based on method type
- Handle 3D Secure authentication flow
- Implement idempotency to prevent duplicate charges
- Store transaction metadata for fraud analysis
- Update booking payment status on success
- Trigger confirmation notifications

**Fraud Detection**:
- Calculate risk score based on:
  - User account age and history
  - Payment method age and usage history
  - Transaction amount vs user's typical spending
  - IP geolocation vs billing address mismatch
  - Device fingerprint analysis
  - Velocity checks (multiple attempts in short time)
- Require 3D Secure for high-risk transactions (score > 70)
- Flag for manual review for medium-risk (score 40-70)
- Auto-decline for very high-risk (score > 90)

**3D Secure Authentication**:
- Initiate 3DS challenge when required
- Generate authentication URL for frontend redirect
- Handle authentication callback from issuer
- Verify authentication result token
- Complete payment after successful authentication
- Handle authentication failures gracefully

**Corporate Billing**:
- Verify corporate account association
- Check credit limit availability
- Apply approval workflow if required
- Generate invoice for corporate accounting
- Track outstanding balances
- Send monthly statements

### Error Handling

**Payment Gateway Errors**:
- Insufficient funds: Return clear error message
- Card declined: Provide decline reason if available
- Gateway timeout: Implement retry logic with exponential backoff
- Gateway unavailable: Fail gracefully with user-friendly message

**Validation Errors**:
- Invalid card number: Return validation error
- Expired card: Prompt to update payment method
- Invalid amount: Return amount validation error
- Currency mismatch: Return currency error

**Authentication Errors**:
- 3DS authentication failed: Allow retry with different method
- 3DS timeout: Cancel transaction and notify user
- Authentication unavailable: Fall back to non-3DS if allowed

## Technology Stack

- Backend: .NET 8+ with C# (ASP.NET Core Web API)
- ORM: Entity Framework Core 8+
- Database: MySQL 8.0+
- Payment Gateway: Stripe API v2023-10-16
- Fraud Detection: Stripe Radar
- Authentication: JWT with .NET Identity

## Implementation Notes

**PCI-DSS Compliance**:
- Use Stripe Elements or hosted payment pages to avoid PCI scope
- Never log or store sensitive payment data
- Implement SAQ-A compliance checklist
- Regular security scans and penetration testing
- Maintain PCI compliance documentation

**Payment Gateway Configuration**:
- Store API keys in secure configuration (Azure Key Vault)
- Use separate keys for test and production environments
- Implement webhook handlers for asynchronous events
- Configure webhook signature verification
- Set up idempotency keys for payment requests

**Transaction Idempotency**:
- Use idempotency keys to prevent duplicate charges
- Store idempotency key with transaction
- Return existing transaction if duplicate request detected
- Expire idempotency keys after 24 hours

**Monitoring and Alerting**:
- Monitor payment success rates
- Alert on elevated failure rates
- Track fraud detection accuracy
- Monitor gateway response times
- Alert on gateway downtime

**Testing Strategy**:
- Use Stripe test mode with test card numbers
- Test successful payments for all method types
- Test payment failures (insufficient funds, declined)
- Test 3D Secure authentication flows
- Test refund processing
- Test authorization and capture flows
- Load test payment processing under high volume

## Related Features

- F-PB-001: Multiple Payment Methods (Frontend)
- F-PB-014: Advanced Fraud Detection
- F-COMP-PAY-001: PCI Compliance & Tokenization
- F-COMP-PAY-006: 3D Secure Authentication
