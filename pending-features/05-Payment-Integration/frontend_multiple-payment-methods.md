# Feature: Multiple Payment Method Support

## Overview

Comprehensive payment method support enabling customers to pay using their preferred payment option while maintaining the highest security standards. The system supports credit/debit cards, digital wallets (Apple Pay, Google Pay), PayPal, bank transfers, platform wallet, pay at counter options, and corporate billing with full PCI-DSS compliance, encryption, tokenization, 3D Secure authentication, and real-time fraud detection.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

F-PB-001

## User Stories

### As a customer
I want to choose from multiple payment methods during checkout, so that I can pay using my preferred and most convenient payment option.

### As a business traveler
I want to use corporate billing for my rental, so that expenses are automatically billed to my company account without personal payment.

### As an international customer
I want to use region-specific payment methods, so that I can complete bookings without currency conversion fees or payment restrictions.

### As a security-conscious user
I want my payment information protected with industry-standard security, so that I can trust the platform with my financial data.

## Frontend Specifications

### Pages

**Payment Method Selection Page** (`/booking/payment`)
- Display all available payment methods with icons
- Show saved payment methods for authenticated users
- Highlight recommended payment method based on user location
- Display security badges (PCI-DSS, SSL, 3D Secure)
- Show payment method fees if applicable
- Provide "Pay at Counter" option with requirements

**Saved Payment Methods Page** (`/account/payment-methods`)
- List all saved payment methods with masked details
- Add new payment method functionality
- Edit/remove existing payment methods
- Set default payment method
- Display expiration warnings for cards

### UI Components

**PaymentMethodSelector Component**
- Radio button or card-based selection interface
- Payment method icons (Visa, Mastercard, Apple Pay, etc.)
- Conditional rendering based on device (Apple Pay on iOS, Google Pay on Android)
- Real-time validation of payment method availability
- Loading states during payment processing

**CreditCardForm Component**
- Card number input with real-time formatting (spaces every 4 digits)
- Expiration date picker (MM/YY format)
- CVV input with security tooltip
- Billing address form
- "Save for future use" checkbox
- Card type detection from BIN
- Luhn algorithm validation

**DigitalWalletButton Component**
- Apple Pay button (iOS/Safari)
- Google Pay button (Android/Chrome)
- Samsung Pay button (Samsung devices)
- One-tap payment initiation
- Biometric authentication prompt
- Payment sheet display

**PayPalButton Component**
- PayPal branded button
- Redirect to PayPal authentication
- Return handling with payment confirmation
- Venmo option for US customers

**BankTransferForm Component**
- Bank account selection
- ACH/SEPA details input
- Verification micro-deposits flow
- Processing time disclaimer

**CorporateBillingForm Component**
- Corporate account selection
- Cost center/project code input
- Approval workflow display
- Invoice recipient email

### User Flows

**Credit Card Payment Flow**:
1. User selects "Credit/Debit Card" option
2. System displays card input form
3. User enters card details with real-time validation
4. User optionally checks "Save for future use"
5. User clicks "Pay Now"
6. System tokenizes card data via payment gateway
7. System initiates 3D Secure authentication if required
8. User completes authentication in bank popup
9. System processes payment
10. System displays confirmation with transaction ID

**Digital Wallet Payment Flow**:
1. User selects Apple Pay/Google Pay
2. System displays payment sheet with booking details
3. User authenticates with biometric (Face ID/fingerprint)
4. System processes payment through wallet
5. System displays instant confirmation

**Pay at Counter Flow**:
1. User selects "Pay at Counter" option
2. System displays requirements (valid credit card for hold)
3. User provides card for pre-authorization hold
4. System places hold for estimated amount + security deposit
5. Booking confirmed with "Payment Due at Pickup" status
6. User pays full amount at counter during pickup
7. System releases pre-authorization hold

### Data Requirements

**From Backend APIs**:
- GET `/api/payment-methods` - Available payment methods for user's region
- POST `/api/payment-methods` - Save new payment method
- GET `/api/payment-methods/saved` - Retrieve saved payment methods
- DELETE `/api/payment-methods/{id}` - Remove saved payment method
- POST `/api/payments/process` - Process payment transaction
- POST `/api/payments/authorize` - Pre-authorize payment
- GET `/api/payments/status/{transactionId}` - Check payment status

**Payment Method Data**:
- Payment method type (card, wallet, paypal, bank, corporate)
- Card details (masked number, expiration, type, last 4 digits)
- Billing address
- Default payment method flag
- Tokenization reference
- Expiration status

## Backend Specifications

### API Endpoints

**GET `/api/v1/payment-methods`**
- Purpose: Retrieve available payment methods for user's region
- Authentication: Required (JWT)
- Query Parameters:
  - `region` (string, optional): ISO country code
  - `amount` (decimal, optional): Transaction amount for method filtering
- Response: Array of available payment method configurations

**POST `/api/v1/payment-methods`**
- Purpose: Save new payment method for user
- Authentication: Required (JWT)
- Request Body:
  - `type` (string, required): Payment method type
  - `cardToken` (string, required for cards): Tokenized card data
  - `billingAddress` (object, required): Address details
  - `setAsDefault` (boolean, optional): Set as default method
- Response: Saved payment method with ID

**GET `/api/v1/payment-methods/saved`**
- Purpose: Retrieve user's saved payment methods
- Authentication: Required (JWT)
- Response: Array of saved payment methods with masked details

**DELETE `/api/v1/payment-methods/{id}`**
- Purpose: Remove saved payment method
- Authentication: Required (JWT)
- Path Parameters:
  - `id` (guid, required): Payment method ID
- Response: Success confirmation

**POST `/api/v1/payments/process`**
- Purpose: Process payment transaction
- Authentication: Required (JWT)
- Request Body:
  - `bookingId` (guid, required): Associated booking
  - `amount` (decimal, required): Payment amount
  - `currency` (string, required): ISO currency code
  - `paymentMethodId` (guid, optional): Saved payment method
  - `paymentMethodData` (object, optional): New payment method details
  - `savePaymentMethod` (boolean, optional): Save for future use
- Response: Transaction result with status and transaction ID

**POST `/api/v1/payments/authorize`**
- Purpose: Pre-authorize payment without charging
- Authentication: Required (JWT)
- Request Body:
  - `bookingId` (guid, required): Associated booking
  - `amount` (decimal, required): Authorization amount
  - `paymentMethodId` (guid, required): Payment method to authorize
- Response: Authorization result with hold reference

**POST `/api/v1/payments/3ds-callback`**
- Purpose: Handle 3D Secure authentication callback
- Authentication: Required (JWT)
- Request Body:
  - `transactionId` (guid, required): Original transaction ID
  - `authenticationResult` (string, required): 3DS result token
- Response: Final payment status

### Request Schemas

**SavePaymentMethodRequest**:
```
{
  type: "card" | "paypal" | "bank_transfer" | "corporate",
  cardToken: string (required for card),
  billingAddress: {
    line1: string,
    line2: string (optional),
    city: string,
    state: string,
    postalCode: string,
    country: string (ISO code)
  },
  setAsDefault: boolean
}
```

**ProcessPaymentRequest**:
```
{
  bookingId: guid,
  amount: decimal,
  currency: string (ISO 4217),
  paymentMethodId: guid (optional),
  paymentMethodData: {
    type: string,
    token: string,
    billingAddress: object
  } (optional),
  savePaymentMethod: boolean,
  metadata: {
    ipAddress: string,
    deviceFingerprint: string,
    userAgent: string
  }
}
```

### Response Schemas

**PaymentMethodResponse**:
```
{
  id: guid,
  type: string,
  displayName: string,
  maskedDetails: string (e.g., "**** 4242"),
  expirationDate: string (MM/YY),
  isDefault: boolean,
  isExpired: boolean,
  billingAddress: object
}
```

**PaymentTransactionResponse**:
```
{
  transactionId: guid,
  status: "pending" | "processing" | "completed" | "failed" | "requires_authentication",
  amount: decimal,
  currency: string,
  paymentMethod: string,
  timestamp: datetime,
  authenticationUrl: string (optional, for 3DS),
  errorMessage: string (optional),
  receiptUrl: string (optional)
}
```

### Business Logic

**Payment Method Validation**:
- Verify payment method is available in user's region
- Check minimum/maximum transaction amounts per method
- Validate card expiration date is in future
- Verify billing address completeness
- Check payment method supports required features (refunds, pre-auth)

**Payment Processing Logic**:
- Tokenize sensitive payment data before transmission
- Calculate total amount including taxes and fees
- Apply fraud detection scoring before processing
- Initiate 3D Secure authentication for high-risk transactions
- Process payment through appropriate gateway
- Handle asynchronous payment confirmations
- Store transaction record with audit trail
- Send payment confirmation notifications

**Pre-Authorization Logic**:
- Calculate hold amount (rental cost + security deposit)
- Place authorization hold on payment method
- Set hold expiration (typically 7-30 days)
- Release hold after successful rental completion
- Capture hold amount if charges apply (damage, fuel)

**Refund Processing**:
- Validate refund eligibility based on cancellation policy
- Calculate refund amount (full or partial)
- Initiate refund to original payment method
- Handle refund failures with retry logic
- Update transaction status and notify customer

### Authentication Requirements

- JWT token required for all payment endpoints
- User must own the booking for payment processing
- Admin role required for refund overrides
- Supplier role can view payment status but not process
- Payment method access restricted to owning user
- Corporate billing requires corporate account association

### Integration Requirements

**Payment Gateway Integration**:
- Stripe for card processing and digital wallets
- PayPal SDK for PayPal/Venmo payments
- Plaid for bank account verification
- 3D Secure provider (Stripe Radar or equivalent)

**Fraud Detection Integration**:
- Stripe Radar for fraud scoring
- Device fingerprinting service (FingerprintJS)
- IP geolocation service
- Stolen card database checks

**Notification Integration**:
- Email service for payment confirmations
- SMS service for payment alerts
- Push notification service for mobile apps

## Database Specifications

### Schema Changes

**New Tables**:
- `PaymentMethods` - Stored payment methods
- `PaymentTransactions` - Transaction records
- `PaymentAuthorizations` - Pre-authorization holds
- `RefundTransactions` - Refund records

### Table Definitions

**PaymentMethods Table**:
```
PaymentMethodId (CHAR(36), PRIMARY KEY)
UserId (CHAR(36), NOT NULL, FOREIGN KEY -> Users.UserId)
PaymentType (ENUM('card', 'paypal', 'bank_transfer', 'corporate'), NOT NULL)
TokenizedData (VARCHAR(500), NOT NULL) - Encrypted token from gateway
DisplayName (VARCHAR(100), NOT NULL) - e.g., "Visa ending in 4242"
MaskedDetails (VARCHAR(50), NOT NULL) - e.g., "**** **** **** 4242"
ExpirationDate (DATE, NULL) - For cards only
BillingAddressId (CHAR(36), NULL, FOREIGN KEY -> Addresses.AddressId)
IsDefault (BOOLEAN, DEFAULT FALSE)
IsExpired (BOOLEAN, DEFAULT FALSE)
CreatedAt (DATETIME, NOT NULL)
UpdatedAt (DATETIME, NOT NULL)
DeletedAt (DATETIME, NULL) - Soft delete
```

**PaymentTransactions Table**:
```
TransactionId (CHAR(36), PRIMARY KEY)
BookingId (CHAR(36), NOT NULL, FOREIGN KEY -> Bookings.BookingId)
UserId (CHAR(36), NOT NULL, FOREIGN KEY -> Users.UserId)
PaymentMethodId (CHAR(36), NULL, FOREIGN KEY -> PaymentMethods.PaymentMethodId)
Amount (DECIMAL(10,2), NOT NULL)
Currency (CHAR(3), NOT NULL) - ISO 4217
TransactionType (ENUM('payment', 'refund', 'authorization', 'capture'), NOT NULL)
Status (ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'), NOT NULL)
GatewayTransactionId (VARCHAR(255), NULL) - External gateway reference
GatewayName (VARCHAR(50), NOT NULL) - stripe, paypal, etc.
FraudScore (DECIMAL(5,2), NULL) - 0-100 risk score
RequiresAuthentication (BOOLEAN, DEFAULT FALSE)
AuthenticationUrl (VARCHAR(500), NULL) - 3DS URL
ErrorCode (VARCHAR(50), NULL)
ErrorMessage (VARCHAR(500), NULL)
Metadata (JSON, NULL) - IP, device fingerprint, user agent
CreatedAt (DATETIME, NOT NULL)
CompletedAt (DATETIME, NULL)
```

**PaymentAuthorizations Table**:
```
AuthorizationId (CHAR(36), PRIMARY KEY)
BookingId (CHAR(36), NOT NULL, FOREIGN KEY -> Bookings.BookingId)
PaymentMethodId (CHAR(36), NOT NULL, FOREIGN KEY -> PaymentMethods.PaymentMethodId)
Amount (DECIMAL(10,2), NOT NULL)
Currency (CHAR(3), NOT NULL)
Status (ENUM('pending', 'authorized', 'captured', 'released', 'expired'), NOT NULL)
GatewayAuthorizationId (VARCHAR(255), NOT NULL)
ExpiresAt (DATETIME, NOT NULL)
CapturedAmount (DECIMAL(10,2), NULL)
CapturedAt (DATETIME, NULL)
ReleasedAt (DATETIME, NULL)
CreatedAt (DATETIME, NOT NULL)
```

### Relationships

- `PaymentMethods.UserId` → `Users.UserId` (Many-to-One)
- `PaymentMethods.BillingAddressId` → `Addresses.AddressId` (Many-to-One)
- `PaymentTransactions.BookingId` → `Bookings.BookingId` (Many-to-One)
- `PaymentTransactions.UserId` → `Users.UserId` (Many-to-One)
- `PaymentTransactions.PaymentMethodId` → `PaymentMethods.PaymentMethodId` (Many-to-One)
- `PaymentAuthorizations.BookingId` → `Bookings.BookingId` (One-to-One)
- `PaymentAuthorizations.PaymentMethodId` → `PaymentMethods.PaymentMethodId` (Many-to-One)

### Indexes

**Performance Optimization**:
- `idx_payment_methods_user_id` on `PaymentMethods(UserId)` - Fast retrieval of user's payment methods
- `idx_payment_methods_user_default` on `PaymentMethods(UserId, IsDefault)` - Quick default method lookup
- `idx_payment_transactions_booking` on `PaymentTransactions(BookingId)` - Booking payment history
- `idx_payment_transactions_user` on `PaymentTransactions(UserId, CreatedAt DESC)` - User transaction history
- `idx_payment_transactions_status` on `PaymentTransactions(Status, CreatedAt)` - Pending payment monitoring
- `idx_payment_authorizations_booking` on `PaymentAuthorizations(BookingId)` - Authorization lookup
- `idx_payment_authorizations_expires` on `PaymentAuthorizations(ExpiresAt, Status)` - Expiration cleanup

## Technology Stack

- Backend: .NET 8+ with C# (ASP.NET Core Web API, Entity Framework Core)
- Database: MySQL 8.0+ (InnoDB storage engine)
- Frontend: Next.js 14+ with TypeScript, React 18+, Tailwind CSS
- Payment Gateway: Stripe API for card processing and digital wallets
- Security: JWT authentication, PCI-DSS Level 1 compliance

## Implementation Notes

**Security Considerations**:
- Never store raw card numbers or CVV codes
- Use payment gateway tokenization for all card data
- Implement PCI-DSS SAQ-A compliance (hosted payment pages)
- Enforce TLS 1.3 for all payment API calls
- Implement rate limiting on payment endpoints
- Log all payment attempts for fraud analysis

**Payment Gateway Selection**:
- Stripe recommended for comprehensive payment method support
- PayPal SDK for PayPal/Venmo integration
- Consider regional gateways for specific markets (Alipay, WeChat Pay for China)

**3D Secure Implementation**:
- Use Stripe's built-in 3DS 2.0 support
- Implement frictionless authentication when possible
- Handle authentication challenges gracefully
- Provide clear user guidance during authentication

**Corporate Billing**:
- Requires separate corporate account setup
- Implement approval workflows for large transactions
- Generate detailed invoices for corporate accounting
- Support multiple cost centers per corporate account

**Testing Requirements**:
- Use Stripe test mode with test card numbers
- Test all payment method types
- Test 3D Secure authentication flows
- Test payment failures and error handling
- Test refund processing
- Verify PCI compliance with security scans

## Related Features

- F-PB-006: Saved Payment Methods (Payment method storage)
- F-PB-014: Advanced Fraud Detection (Fraud prevention)
- F-COMP-PAY-001: PCI Compliance (Security foundation)
- F-BM-001: Multi-Step Checkout (Booking integration)
