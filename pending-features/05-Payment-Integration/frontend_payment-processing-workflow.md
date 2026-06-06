# Feature: Payment Processing Workflow

## Overview

This feature implements the complete end-to-end payment processing workflow for car rental bookings, covering payment method selection, secure payment input, authorization, capture, receipt generation, and fraud detection. The workflow ensures PCI-DSS compliance, provides a seamless user experience, and handles various payment scenarios including immediate capture, delayed capture, partial payments, and refunds.

## Sprint Category

sprint-01 (F-WF-PAY-001, F-WF-PAY-005, F-WF-PAY-007)
nice-to-have (F-WF-PAY-004, F-WF-PAY-006, F-WF-PAY-008)
project (F-WF-PAY-002)

## Feature IDs

- F-WF-PAY-001: Payment Method Display
- F-WF-PAY-002: Secure Payment Input Form
- F-WF-PAY-004: Payment Authorization Hold
- F-WF-PAY-005: Payment Decline Handling
- F-WF-PAY-006: Flexible Payment Capture
- F-WF-PAY-007: Digital Receipt Generation
- F-WF-PAY-008: Automated Fraud Detection

## User Stories

### As a customer
I want to see all available payment methods with clear security indicators, so that I can choose my preferred payment option with confidence.

### As a customer
I want to enter my payment information in a secure, validated form, so that I can complete my booking without errors or security concerns.

### As a customer
I want clear feedback if my payment is declined, so that I can understand the issue and try an alternative payment method.

### As a customer
I want to receive a detailed digital receipt immediately after payment, so that I have documentation for my records and expense reporting.

### As a platform operator
I want to detect and prevent fraudulent transactions in real-time, so that I can protect the platform and legitimate customers from financial losses.

### As a finance manager
I want flexible payment capture options (immediate, delayed, partial), so that I can optimize cash flow and accommodate different business models.

## Frontend Specifications

### Pages

#### Payment Method Selection Page
- **Route**: `/booking/payment` (step in checkout flow)
- **Purpose**: Display available payment methods and allow user selection
- **Access**: Authenticated users during booking checkout


#### Payment Information Entry Page
- **Route**: `/booking/payment/details` (step in checkout flow)
- **Purpose**: Secure form for entering payment details
- **Access**: Authenticated users during booking checkout

#### Payment Confirmation Page
- **Route**: `/booking/payment/confirm` (step in checkout flow)
- **Purpose**: Review final amount and confirm payment
- **Access**: Authenticated users during booking checkout

#### Payment Success Page
- **Route**: `/booking/payment/success`
- **Purpose**: Display payment confirmation and receipt
- **Access**: Authenticated users after successful payment

#### Payment Declined Page
- **Route**: `/booking/payment/declined`
- **Purpose**: Handle payment decline with retry options
- **Access**: Authenticated users after payment decline

### UI Components

#### PaymentMethodSelector
- Display available payment methods with logos and icons
- Show security badges (PCI-DSS, SSL, verified)
- Display saved payment methods for logged-in users
- Highlight recommended or default payment method
- Show method-specific features (instant confirmation, no fees)
- One-click selection for saved methods
- "Add new payment method" option

#### SecurePaymentForm
- PCI-DSS compliant payment input fields
- Card number input with masking (show only last 4 digits)
- Real-time card type detection and logo display
- Expiration date picker (MM/YY format)
- CVV input with tooltip explaining location
- Billing address fields (if required)
- Real-time validation with inline error messages
- Luhn algorithm validation for card numbers
- Security indicators (lock icon, HTTPS badge)
- Auto-formatting (spaces in card number, date format)

#### PaymentAmountSummary
- Itemized breakdown of all charges
- Base rental cost with duration
- Insurance and coverage charges
- Additional services and equipment fees
- Taxes itemized by type
- Discounts and promotional savings
- Total amount prominently displayed
- Currency indicator
- Payment timing information (charge now vs later)
- Refund policy summary

#### PaymentAuthorizationLoader
- Processing animation during authorization
- "Processing payment..." message
- Prevent duplicate submissions (disabled button)
- Estimated time remaining indicator
- Security reassurance messaging

#### PaymentDeclineMessage
- User-friendly decline reason display
- Suggested corrective actions
- Alternative payment method options
- Customer support contact information
- Retry payment button
- Preserve entered booking information

#### DigitalReceipt
- Transaction details (date, time, ID)
- Payment method (last 4 digits, card type)
- Itemized charges breakdown
- Total amount charged
- Merchant information
- Booking reference link
- Download PDF button
- Email receipt button
- Print-friendly layout

#### FraudVerificationModal
- Verification request message
- Additional information form
- Document upload capability
- Phone verification option
- Verification deadline display
- Customer support contact

### User Flows

#### Standard Payment Flow
1. User completes booking details
2. System displays payment method selection
3. User selects payment method (saved or new)
4. System displays secure payment form
5. User enters payment details with real-time validation
6. System displays payment amount summary
7. User reviews and confirms payment
8. System processes authorization (with 3DS if required)
9. System captures payment (immediate or scheduled)
10. System generates and displays receipt
11. User receives confirmation email with receipt

#### Payment Decline Flow
1. User submits payment
2. System receives decline from gateway
3. System displays user-friendly decline message
4. System suggests corrective actions
5. User chooses to retry or use alternative method
6. System preserves booking information
7. User re-enters payment or selects different method
8. System retries authorization

#### Fraud Detection Flow
1. User submits payment
2. System performs fraud risk assessment
3. System flags high-risk transaction
4. System holds booking for verification
5. System sends verification request to customer
6. Customer provides additional information
7. Fraud team reviews and makes decision
8. System approves or declines transaction
9. Customer notified of outcome

### Data Requirements

#### Payment Method Display
- Available payment methods list
- Saved payment methods for user
- Payment method capabilities (instant, delayed)
- Security certifications and badges
- Method-specific fees or restrictions

#### Payment Form
- Card type detection rules
- Validation rules (Luhn, expiry, CVV)
- Billing address requirements by country
- Supported card brands
- Form field labels and placeholders

#### Payment Authorization
- Authorization request parameters
- 3DS authentication URLs
- Authorization response codes
- Decline reason mappings
- Fraud risk thresholds

#### Receipt Data
- Transaction details
- Itemized charges
- Merchant information
- Booking reference
- Receipt template
- PDF generation parameters

## Backend Specifications

### API Endpoints

#### Payment Method Display

**GET /api/v1/payments/methods**
- Purpose: Retrieve available payment methods for user
- Authentication: Required (JWT)
- Query Parameters: bookingId (string)
- Response:
  ```
  {
    "availableMethods": [
      {
        "type": "credit_card|debit_card|digital_wallet|bank_transfer|pay_at_counter",
        "name": "string",
        "icon": "string (URL)",
        "supported": "boolean",
        "instantConfirmation": "boolean",
        "fees": "number",
        "description": "string"
      }
    ],
    "savedMethods": [
      {
        "id": "string",
        "type": "string",
        "last4": "string",
        "cardBrand": "string",
        "expiryMonth": "number",
        "expiryYear": "number",
        "isDefault": "boolean"
      }
    ]
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized


#### Payment Authorization

**POST /api/v1/payments/authorize**
- Purpose: Authorize payment for booking
- Authentication: Required (JWT)
- Request Body:
  ```
  {
    "bookingId": "string",
    "paymentMethodId": "string (for saved methods)",
    "paymentDetails": {
      "cardNumber": "string (if new card)",
      "expiryMonth": "number",
      "expiryYear": "number",
      "cvv": "string",
      "cardholderName": "string",
      "billingAddress": {
        "line1": "string",
        "city": "string",
        "state": "string",
        "postalCode": "string",
        "country": "string"
      }
    },
    "amount": "number",
    "currency": "string",
    "captureMode": "immediate|delayed|partial",
    "savePaymentMethod": "boolean",
    "deviceFingerprint": "string",
    "returnUrl": "string (for 3DS)"
  }
  ```
- Response:
  ```
  {
    "authorizationId": "string",
    "status": "authorized|declined|requires_action",
    "authorizationCode": "string",
    "requires3DS": "boolean",
    "threeDSUrl": "string (if requires_action)",
    "declineReason": "string (if declined)",
    "riskScore": "number",
    "expiresAt": "ISO8601 datetime"
  }
  ```
- Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 402 Payment Required

**POST /api/v1/payments/authorize/hold**
- Purpose: Place authorization hold without immediate capture
- Authentication: Required (JWT)
- Request Body: Same as authorize endpoint with captureMode="delayed"
- Response: Same as authorize endpoint
- Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized

#### Payment Capture

**POST /api/v1/payments/capture**
- Purpose: Capture previously authorized payment
- Authentication: Required (JWT, Admin or System)
- Request Body:
  ```
  {
    "authorizationId": "string",
    "amount": "number (can be less than authorized)",
    "finalCharges": {
      "baseRate": "number",
      "insurance": "number",
      "extras": "number",
      "taxes": "number",
      "adjustments": "number"
    }
  }
  ```
- Response:
  ```
  {
    "captureId": "string",
    "status": "captured|failed",
    "capturedAmount": "number",
    "currency": "string",
    "capturedAt": "ISO8601 datetime",
    "receiptId": "string"
  }
  ```
- Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 404 Not Found

**POST /api/v1/payments/void**
- Purpose: Void authorization before capture (for cancellations)
- Authentication: Required (JWT)
- Request Body:
  ```
  {
    "authorizationId": "string",
    "reason": "string"
  }
  ```
- Response: 200 OK
- Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 404 Not Found

#### Payment Decline Handling

**GET /api/v1/payments/decline-reasons**
- Purpose: Get user-friendly decline reason messages
- Authentication: Required (JWT)
- Query Parameters: declineCode (string)
- Response:
  ```
  {
    "declineCode": "string",
    "userMessage": "string",
    "suggestedActions": ["string"],
    "canRetry": "boolean",
    "contactSupport": "boolean"
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized

#### Receipt Generation

**POST /api/v1/payments/receipts/generate**
- Purpose: Generate digital receipt for transaction
- Authentication: Required (JWT)
- Request Body:
  ```
  {
    "transactionId": "string",
    "format": "pdf|html|json"
  }
  ```
- Response:
  ```
  {
    "receiptId": "string",
    "receiptUrl": "string (for PDF)",
    "receiptHtml": "string (for HTML)",
    "receiptData": "object (for JSON)"
  }
  ```
- Status Codes: 200 OK, 401 Unauthorized, 404 Not Found

**POST /api/v1/payments/receipts/{receiptId}/email**
- Purpose: Email receipt to customer
- Authentication: Required (JWT)
- Path Parameters: receiptId (string)
- Request Body:
  ```
  {
    "emailAddress": "string"
  }
  ```
- Response: 200 OK
- Status Codes: 200 OK, 401 Unauthorized, 404 Not Found

### Business Logic

#### Payment Method Display Logic

1. **Available Methods Determination**
   - Check booking amount and currency
   - Filter methods by geographic availability
   - Check supplier payment method restrictions
   - Verify payment gateway availability
   - Apply business rules (e.g., pay-at-counter requires approval)

2. **Saved Methods Display**
   - Retrieve user's saved payment tokens
   - Filter expired payment methods
   - Sort by default flag and last used
   - Display last 4 digits and card brand
   - Show expiration dates
   - Indicate which methods need re-verification

3. **Security Indicators**
   - Display PCI-DSS compliance badge
   - Show SSL/TLS encryption indicator
   - Display payment gateway security certifications
   - Show 3D Secure support indicator


#### Secure Payment Input Logic

1. **Real-Time Validation**
   - Card number: Luhn algorithm validation
   - Card type detection from BIN (first 6 digits)
   - Expiration date: Must be future date
   - CVV: 3 digits (Visa, MC, Discover) or 4 digits (Amex)
   - Billing address: Format validation by country
   - Display inline validation feedback

2. **Card Number Masking**
   - Show only last 4 digits as user types
   - Format with spaces (4-4-4-4 or 4-6-5 for Amex)
   - Replace digits with bullets (•••• •••• •••• 1234)
   - Prevent copy/paste of masked values

3. **Security Measures**
   - HTTPS enforcement for all payment pages
   - Tokenization before transmission to server
   - No storage of raw card data
   - Auto-clear sensitive fields on navigation
   - Secure iframe for hosted payment fields
   - Certificate pinning on mobile apps

4. **Form Accessibility**
   - Proper label associations
   - ARIA attributes for screen readers
   - Keyboard navigation support
   - Error announcements for assistive technology
   - High contrast mode support

#### Payment Authorization Hold Logic

1. **Hold Amount Calculation**
   - Base rental cost
   - Estimated insurance and extras
   - Security deposit (typically $200-500)
   - Fuel deposit (if applicable)
   - Buffer for potential additional charges (10-20%)

2. **Hold Duration**
   - Standard hold: 7 days for short rentals
   - Extended hold: 30 days for long rentals
   - Automatic extension if rental extended
   - Release hold after successful return

3. **Hold vs Capture Decision**
   - Immediate capture: Pay-in-full bookings
   - Authorization hold: Pay-at-counter, deposit bookings
   - Partial capture: Deposit now, balance at pickup
   - Hold only: Corporate billing, invoice later

4. **Hold Management**
   - Monitor hold expiration dates
   - Extend holds before expiration if needed
   - Void holds for cancelled bookings
   - Capture holds at appropriate time
   - Handle hold failures gracefully

#### Payment Decline Handling Logic

1. **Decline Reason Mapping**
   - Map gateway decline codes to user-friendly messages
   - Insufficient funds → "Payment declined due to insufficient funds"
   - Expired card → "This card has expired"
   - Incorrect CVV → "Security code is incorrect"
   - Generic decline → "Payment could not be processed"
   - Fraud suspected → "Additional verification required"

2. **Corrective Action Suggestions**
   - Insufficient funds: "Try a different card or contact your bank"
   - Expired card: "Please use a different payment method"
   - Incorrect CVV: "Verify the security code and try again"
   - Generic: "Try a different payment method or contact support"

3. **Retry Logic**
   - Allow immediate retry with same method (for CVV errors)
   - Suggest alternative payment methods
   - Preserve booking information for retry
   - Track retry attempts (limit to 3 per session)
   - Escalate to support after multiple failures

4. **Decline Analytics**
   - Track decline reasons and frequency
   - Identify patterns (time of day, card types)
   - Monitor decline rate by payment method
   - Optimize authorization parameters

#### Flexible Payment Capture Logic

1. **Immediate Capture**
   - Capture immediately after authorization
   - Used for standard pay-in-full bookings
   - Funds transferred to merchant account
   - Receipt generated immediately

2. **Delayed Capture**
   - Maintain authorization hold
   - Capture at pickup time
   - Allows for booking modifications
   - Adjust capture amount if needed
   - Void if booking cancelled

3. **Partial Capture**
   - Capture deposit amount immediately
   - Maintain hold for remaining balance
   - Capture balance at pickup or return
   - Support multiple capture transactions
   - Track captured vs remaining amounts

4. **Void Authorization**
   - Cancel authorization without capture
   - Used for booking cancellations
   - Release hold on customer's card
   - No charge to customer
   - Update booking status

#### Digital Receipt Generation Logic

1. **Receipt Data Collection**
   - Transaction ID and timestamp
   - Payment method details (last 4, type)
   - Booking reference and details
   - Itemized charges breakdown
   - Total amount and currency
   - Merchant information
   - Customer information

2. **Receipt Formatting**
   - Professional layout and branding
   - Clear section organization
   - Itemized charges table
   - Tax breakdown
   - Payment method display
   - Legal disclaimers and terms

3. **PDF Generation**
   - Use PDF library (e.g., PDFKit, Puppeteer)
   - Consistent formatting and styling
   - Include company logo and branding
   - Optimize for printing (A4/Letter size)
   - Compress for email delivery

4. **Receipt Delivery**
   - Display on confirmation page
   - Email to customer immediately
   - Store in customer account
   - Provide download link
   - Support re-sending

#### Automated Fraud Detection Logic

1. **Real-Time Fraud Screening**
   - Perform checks before authorization
   - Calculate composite risk score
   - Apply fraud detection rules
   - Integrate with gateway fraud services
   - Make approve/review/decline decision

2. **Fraud Signals**
   - AVS mismatch: Billing address doesn't match card
   - CVV failure: Security code incorrect
   - Velocity violation: Too many transactions
   - Geolocation mismatch: IP location vs billing address
   - Device fingerprint: Suspicious or blacklisted device
   - Card BIN: High-risk card issuer or country
   - Behavioral anomaly: Unusual user behavior

3. **Risk Scoring**
   - Base score: 0 (lowest risk)
   - Add points for each fraud signal
   - Weight signals by severity
   - Calculate final risk score (0-100)
   - Classify into risk levels (low, medium, high, critical)

4. **Fraud Response Actions**
   - Low risk (0-25): Approve automatically
   - Medium risk (26-50): Require 3DS if amount > $500
   - High risk (51-75): Require 3DS and manual review
   - Critical risk (76-100): Decline automatically

5. **Manual Review Queue**
   - Flag high-risk transactions
   - Notify fraud team
   - Hold booking pending review
   - Request customer verification
   - Track review status and outcomes

### Authentication Requirements

- **User Authentication**: JWT token required for all payment operations
- **Gateway Authentication**: Webhook signature verification for callbacks
- **Admin Authentication**: JWT + Admin role for fraud review and capture operations

### Authorization Rules

- Users can only process payments for their own bookings
- Users can only view their own payment methods and receipts
- Admins can view all transactions and fraud flags
- Admins can manually review and approve/decline flagged transactions
- System can automatically capture authorized payments

### Rate Limiting

- Payment authorization: 5 requests per minute per user
- Payment method retrieval: 30 requests per minute per user
- Receipt generation: 10 requests per minute per user
- Fraud check: 10 requests per minute per user

### Error Handling

- Invalid payment details: Return 400 with validation errors
- Payment declined: Return 402 with decline reason
- Authorization timeout: Return 408 with retry instructions
- Fraud detected: Return 403 with verification requirements
- Gateway unavailable: Return 503 with retry-after header
- Capture failure: Return 500 with support contact


## Database Specifications

### Schema Changes

#### New Tables

**payment_authorizations**
- Stores payment authorization records
- Tracks authorization holds and expiration
- Links authorizations to captures

**payment_declines**
- Records declined payment attempts
- Tracks decline reasons and patterns
- Supports decline analytics

**payment_receipts**
- Stores generated receipt metadata
- Links receipts to transactions
- Tracks receipt delivery status

### Table Definitions

#### payment_authorizations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| booking_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | References bookings.id |
| user_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | References users.id |
| authorization_code | VARCHAR(100) | NOT NULL | Gateway authorization code |
| amount | DECIMAL(10,2) | NOT NULL | Authorized amount |
| currency | CHAR(3) | NOT NULL | ISO 4217 currency code |
| payment_method_id | VARCHAR(36) | NULL, FOREIGN KEY | References payment_tokens.id |
| card_last4 | CHAR(4) | NULL | Last 4 digits of card |
| card_brand | VARCHAR(50) | NULL | Card brand |
| status | ENUM('pending', 'authorized', 'captured', 'voided', 'expired') | NOT NULL | Authorization status |
| capture_mode | ENUM('immediate', 'delayed', 'partial') | NOT NULL | Capture timing |
| captured_amount | DECIMAL(10,2) | DEFAULT 0.00 | Amount captured so far |
| remaining_amount | DECIMAL(10,2) | NOT NULL | Amount available to capture |
| risk_score | DECIMAL(5,2) | NULL | Fraud risk score |
| requires_3ds | BOOLEAN | DEFAULT FALSE | 3DS required flag |
| three_ds_session_id | VARCHAR(36) | NULL, FOREIGN KEY | References three_ds_sessions.id |
| authorized_at | DATETIME | NOT NULL | Authorization timestamp |
| expires_at | DATETIME | NOT NULL | Authorization expiration |
| voided_at | DATETIME | NULL | Void timestamp |
| created_at | DATETIME | NOT NULL | Record creation |
| updated_at | DATETIME | NOT NULL | Last update |

**Indexes:**
- INDEX idx_booking_id (booking_id)
- INDEX idx_user_id (user_id, created_at)
- INDEX idx_status (status, expires_at)
- INDEX idx_authorization_code (authorization_code)

#### payment_declines

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY AUTO_INCREMENT | Decline record ID |
| booking_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | References bookings.id |
| user_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | References users.id |
| amount | DECIMAL(10,2) | NOT NULL | Attempted amount |
| currency | CHAR(3) | NOT NULL | ISO 4217 currency code |
| payment_method_type | VARCHAR(50) | NOT NULL | Card, wallet, etc. |
| card_last4 | CHAR(4) | NULL | Last 4 digits |
| card_brand | VARCHAR(50) | NULL | Card brand |
| decline_code | VARCHAR(50) | NOT NULL | Gateway decline code |
| decline_reason | VARCHAR(255) | NOT NULL | Decline reason |
| gateway_message | TEXT | NULL | Raw gateway message |
| retry_attempted | BOOLEAN | DEFAULT FALSE | User retried flag |
| device_fingerprint | VARCHAR(255) | NULL | Device identifier |
| ip_address | VARCHAR(45) | NOT NULL | IP address |
| declined_at | DATETIME | NOT NULL | Decline timestamp |

**Indexes:**
- INDEX idx_booking_id (booking_id)
- INDEX idx_user_id (user_id, declined_at)
- INDEX idx_decline_code (decline_code, declined_at)
- INDEX idx_declined_at (declined_at DESC)

#### payment_receipts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| transaction_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | References transactions.id |
| booking_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | References bookings.id |
| user_id | VARCHAR(36) | NOT NULL, FOREIGN KEY | References users.id |
| receipt_number | VARCHAR(50) | NOT NULL, UNIQUE | Sequential receipt number |
| format | ENUM('pdf', 'html', 'json') | NOT NULL | Receipt format |
| pdf_url | VARCHAR(500) | NULL | S3/storage URL for PDF |
| html_content | TEXT | NULL | HTML receipt content |
| json_data | JSON | NULL | Structured receipt data |
| emailed | BOOLEAN | DEFAULT FALSE | Email sent flag |
| emailed_at | DATETIME | NULL | Email sent timestamp |
| email_address | VARCHAR(255) | NULL | Recipient email |
| downloaded | BOOLEAN | DEFAULT FALSE | Downloaded flag |
| download_count | INT | DEFAULT 0 | Number of downloads |
| generated_at | DATETIME | NOT NULL | Generation timestamp |
| created_at | DATETIME | NOT NULL | Record creation |

**Indexes:**
- INDEX idx_transaction_id (transaction_id)
- INDEX idx_booking_id (booking_id)
- INDEX idx_user_id (user_id, generated_at)
- INDEX idx_receipt_number (receipt_number)

### Relationships

- payment_authorizations.booking_id → bookings.id (Many-to-One)
- payment_authorizations.user_id → users.id (Many-to-One)
- payment_authorizations.payment_method_id → payment_tokens.id (Many-to-One)
- payment_authorizations.three_ds_session_id → three_ds_sessions.id (One-to-One)
- payment_declines.booking_id → bookings.id (Many-to-One)
- payment_declines.user_id → users.id (Many-to-One)
- payment_receipts.transaction_id → transactions.id (One-to-One)
- payment_receipts.booking_id → bookings.id (Many-to-One)
- payment_receipts.user_id → users.id (Many-to-One)

### Data Retention

- **payment_authorizations**: Retained for 2 years for dispute resolution
- **payment_declines**: Retained for 1 year for fraud analysis
- **payment_receipts**: Retained for 7 years for tax compliance

## Technology Stack

- **Frontend**: Next.js 14+ with React, TypeScript
- **Backend**: .NET 8+ with C#, ASP.NET Core Web API
- **Database**: MySQL 8.0+ with InnoDB storage engine
- **Payment Gateways**: Stripe (primary), PayPal (alternative)
- **PDF Generation**: PDFKit, Puppeteer, or similar
- **Fraud Detection**: Stripe Radar, PayPal Fraud Protection
- **Device Fingerprinting**: FingerprintJS or similar

## Implementation Notes

### Payment Method Display

1. **Dynamic Method Availability**: Filter payment methods based on booking amount, currency, and geographic location
2. **Saved Methods UX**: Make it easy to use saved methods while allowing new method entry
3. **Security Messaging**: Prominently display security badges to build trust
4. **Mobile Optimization**: Ensure payment method selection works well on mobile devices

### Secure Payment Input

1. **Use Hosted Fields**: Consider using payment gateway's hosted fields for PCI scope reduction
2. **Client-Side Validation**: Validate immediately for better UX, but always validate server-side
3. **Card Type Detection**: Use BIN database to detect card type and show appropriate logo
4. **Accessibility**: Ensure form is fully accessible with keyboard navigation and screen readers
5. **Mobile Optimization**: Use appropriate input types (tel for card number, numeric for CVV)

### Payment Authorization

1. **Idempotency**: Use idempotency keys to prevent duplicate charges
2. **3DS Integration**: Implement 3DS 2.0 for better mobile experience and liability shift
3. **Timeout Handling**: Set appropriate timeouts and handle gracefully
4. **State Management**: Maintain state during 3DS redirects
5. **Error Recovery**: Provide clear paths to retry or use alternative methods

### Payment Capture

1. **Capture Timing**: Choose appropriate capture timing based on business model
2. **Partial Capture**: Support capturing less than authorized amount for adjustments
3. **Capture Monitoring**: Monitor capture success rates and investigate failures
4. **Void Management**: Void authorizations promptly for cancellations to release holds

### Receipt Generation

1. **Template Design**: Create professional, branded receipt templates
2. **PDF Quality**: Ensure PDFs are print-quality and properly formatted
3. **Email Delivery**: Use transactional email service for reliable delivery
4. **Storage**: Store receipts in cloud storage (S3, Azure Blob) for long-term access
5. **Regeneration**: Allow receipt regeneration if original is lost

### Fraud Detection

1. **Multi-Layered Approach**: Combine multiple fraud signals for accurate detection
2. **Machine Learning**: Leverage gateway ML models for advanced fraud detection
3. **Manual Review**: Establish efficient manual review process for flagged transactions
4. **False Positive Minimization**: Balance security with user experience
5. **Continuous Improvement**: Analyze fraud patterns and adjust detection rules

### Testing Considerations

- Test payment flow with various card types and scenarios
- Test decline handling with different decline reasons
- Test 3DS authentication flow end-to-end
- Test authorization hold and capture timing
- Test receipt generation and delivery
- Test fraud detection with various risk scenarios
- Test payment method saving and retrieval
- Test refund processing
- Use payment gateway test mode and test cards

## Acceptance Criteria

### F-WF-PAY-001: Payment Method Display

1. System SHALL display all available payment methods with logos and icons
2. System SHALL show security badges (PCI-DSS, SSL) to build trust
3. System SHALL display saved payment methods for logged-in users
4. System SHALL indicate which methods support instant confirmation
5. System SHALL allow one-click selection for saved methods
6. System SHALL provide option to add new payment method
7. System SHALL filter payment methods based on booking amount and currency

### F-WF-PAY-002: Secure Payment Input Form

1. System SHALL provide PCI-DSS compliant payment input form
2. System SHALL mask card number showing only last 4 digits as user types
3. System SHALL validate card number using Luhn algorithm in real-time
4. System SHALL detect card type from number prefix and display logo
5. System SHALL validate expiration date is in future
6. System SHALL validate CVV length based on card type (3 or 4 digits)
7. System SHALL encrypt all payment data using HTTPS (TLS 1.3)
8. System SHALL never store raw card numbers or CVV codes
9. System SHALL provide real-time validation feedback with inline error messages
10. System SHALL auto-format card number with spaces for readability

### F-WF-PAY-004: Payment Authorization Hold

1. System SHALL place authorization hold on payment method without immediate capture
2. System SHALL support configurable hold duration (7-30 days)
3. System SHALL calculate hold amount including rental cost, security deposit, and buffer
4. System SHALL maintain authorization hold until capture or void
5. System SHALL extend hold before expiration if rental is extended
6. System SHALL void hold for cancelled bookings to release funds
7. System SHALL support delayed capture at pickup time

### F-WF-PAY-005: Payment Decline Handling

1. System SHALL display user-friendly decline messages based on decline reason
2. System SHALL suggest corrective actions for common decline reasons
3. System SHALL offer option to try alternative payment method
4. System SHALL preserve booking information for retry attempts
5. System SHALL limit retry attempts to 3 per session
6. System SHALL provide customer support contact for persistent failures
7. System SHALL track decline reasons and patterns for analytics

### F-WF-PAY-006: Flexible Payment Capture

1. System SHALL support immediate capture (charge immediately after authorization)
2. System SHALL support delayed capture (charge at pickup time)
3. System SHALL support partial capture (deposit now, balance later)
4. System SHALL allow capturing less than authorized amount for adjustments
5. System SHALL support void operation to cancel authorization without capture
6. System SHALL track captured amount vs remaining authorized amount
7. System SHALL handle multiple capture transactions for single authorization

### F-WF-PAY-007: Digital Receipt Generation

1. System SHALL generate detailed digital receipt for each transaction
2. System SHALL include transaction ID, date, time, and payment method
3. System SHALL provide itemized breakdown of all charges
4. System SHALL generate professional PDF receipt for download
5. System SHALL email receipt to customer immediately after payment
6. System SHALL store receipt in customer account for future access
7. System SHALL provide print-friendly receipt layout
8. System SHALL allow receipt regeneration and re-sending

### F-WF-PAY-008: Automated Fraud Detection

1. System SHALL perform real-time fraud screening before payment authorization
2. System SHALL verify CVV and billing address (AVS) with card issuer
3. System SHALL implement velocity checks limiting transaction frequency
4. System SHALL perform geolocation matching between IP and billing address
5. System SHALL calculate composite risk score based on multiple fraud signals
6. System SHALL flag high-risk transactions for manual review
7. System SHALL automatically decline critical-risk transactions
8. System SHALL require 3D Secure authentication for medium and high-risk transactions
9. System SHALL maintain fraud detection audit trail

## Related Features

- F-PB-001: Multiple Payment Methods (Payment method support)
- F-PB-009: Invoice Generation (Receipt and invoice creation)
- F-PB-014: Advanced Fraud Detection (Fraud prevention)
- F-PB-015: PCI-DSS Compliance (Payment security)
- F-COMP-PAY-001-005: PCI Compliance Framework (Security foundation)
- F-COMP-PAY-006-010: Fraud Detection & 3D Secure (Fraud prevention)

## References

- PCI DSS Requirements and Security Assessment Procedures
- Stripe Payment Intents API Documentation
- PayPal Orders API Documentation
- 3D Secure 2.0 Specification (EMVCo)
- Luhn Algorithm for Card Validation
- ISO 4217 Currency Codes

