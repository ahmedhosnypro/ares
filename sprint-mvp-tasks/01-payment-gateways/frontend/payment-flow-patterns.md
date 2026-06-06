# Feature: Payment Flow Patterns

## Overview

Flexible payment flow patterns supporting multiple payment timing options including deposit payments, full upfront payment, pay-later for corporate clients, and guest checkout without account creation.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-004

## User Stories

As a customer, I want to choose between deposit and full payment, so that I can select the payment timing that suits my budget.

As a corporate client, I want to book now and pay later via invoice, so that I can follow my company's procurement process.

As a guest user, I want to complete booking without creating an account, so that checkout is fast and frictionless.

## Frontend Specifications

### Pages

- Checkout page with payment timing selector
- Deposit payment schedule display
- Guest checkout flow
- Payment reminder page for outstanding balances

### UI Components

- Payment timing selector (radio buttons or cards)
- Deposit amount calculator and display
- Payment schedule timeline component
- Guest checkout form
- Account creation prompt after successful payment
- Outstanding balance indicator
- Payment reminder notification

### User Flows

**Deposit Payment Flow**:
1. Customer selects deposit payment option at checkout
2. System calculates deposit amount (20% minimum)
3. System displays payment schedule (deposit now, balance before pickup)
4. Customer pays deposit through selected gateway
5. System confirms booking with deposit paid status
6. System sends payment reminder 48 hours before pickup
7. Customer pays remaining balance
8. System confirms full payment and enables pickup

**Full Payment Flow**:
1. Customer selects full payment option at checkout
2. System displays total amount
3. Customer completes payment through selected gateway
4. System confirms booking with fully paid status
5. No additional payment required at pickup

**Pay Later Flow** (Corporate):
1. Corporate customer selects pay later option
2. System validates corporate account approval
3. System creates booking without immediate payment
4. System generates invoice for corporate billing
5. Corporate client pays via invoice within payment terms
6. System confirms payment and enables pickup

**Guest Checkout Flow**:
1. Guest user proceeds to checkout without login
2. System displays guest checkout form
3. Guest enters minimal information (name, email, phone)
4. Guest completes payment
5. System automatically creates account with provided details
6. System sends account activation email
7. Guest can access booking through email link or by setting password

### Data Requirements

- Booking total amount from pricing service
- Deposit percentage configuration (default 20%)
- Payment schedule calculation
- Corporate account approval status
- Guest user information (name, email, phone)
- Payment reminder schedule
- Outstanding balance tracking

## Backend Specifications

### API Endpoints

**POST /api/payments/calculate-deposit**
- Purpose: Calculate deposit amount and payment schedule
- Authentication: Optional (supports guest)
- Request body: bookingAmount, depositPercentage
- Response: Deposit amount, balance amount, payment schedule

**POST /api/payments/create-deposit-payment**
- Purpose: Create payment for deposit amount
- Authentication: Required (JWT)
- Request body: bookingId, depositAmount
- Response: Payment session details

**POST /api/payments/create-balance-payment**
- Purpose: Create payment for remaining balance
- Authentication: Required (JWT)
- Request body: bookingId
- Response: Payment session details

**POST /api/payments/guest-checkout**
- Purpose: Process guest checkout with automatic account creation
- Authentication: Not required
- Request body: guestInfo, bookingDetails, paymentDetails
- Response: Booking confirmation, temporary access token

**POST /api/payments/corporate-invoice**
- Purpose: Create invoice for corporate pay-later booking
- Authentication: Required (JWT, Corporate role)
- Request body: bookingId, invoiceDetails
- Response: Invoice ID and PDF URL

**GET /api/payments/outstanding-balance**
- Purpose: Retrieve outstanding balance for booking
- Authentication: Required (JWT)
- Query params: bookingId
- Response: Outstanding amount, due date, payment schedule

### Request Schemas

**CalculateDepositRequest**:
- bookingAmount: decimal (required)
- depositPercentage: decimal (optional, default 20)
- currency: string (required)

**CreateDepositPaymentRequest**:
- bookingId: string (required)
- depositAmount: decimal (required)
- paymentGateway: string (required) - stripe or paypal

**GuestCheckoutRequest**:
- guestInfo: object (required)
  - firstName: string
  - lastName: string
  - email: string
  - phone: string
- bookingDetails: object (required)
- paymentDetails: object (required)

**CorporateInvoiceRequest**:
- bookingId: string (required)
- corporateAccountId: string (required)
- purchaseOrderNumber: string (optional)
- billingContact: object (required)

### Response Schemas

**DepositCalculationResponse**:
- depositAmount: decimal
- balanceAmount: decimal
- paymentSchedule: array of payment milestones
  - milestone: string (deposit, balance)
  - amount: decimal
  - dueDate: datetime
  - status: string (pending, paid)

**GuestCheckoutResponse**:
- bookingId: string
- confirmationNumber: string
- temporaryAccessToken: string - For booking access
- accountCreated: boolean
- activationEmailSent: boolean

**OutstandingBalanceResponse**:
- bookingId: string
- totalAmount: decimal
- paidAmount: decimal
- outstandingAmount: decimal
- dueDate: datetime
- paymentSchedule: array

### Business Logic

**Deposit Calculation**:
- Calculate deposit as percentage of total (minimum 20%)
- Calculate remaining balance
- Generate payment schedule with due dates
- Deposit due immediately, balance due 48 hours before pickup
- Apply deposit to total booking cost

**Payment Timing Validation**:
- Validate deposit percentage is between 20% and 100%
- Ensure balance payment is completed before pickup
- Block pickup if balance is outstanding
- Send automated payment reminders

**Guest Checkout Processing**:
- Validate guest email is not already registered
- Create temporary booking record
- Process payment through selected gateway
- On payment success, create user account automatically
- Generate random password and send activation email
- Link booking to newly created account
- Clean up abandoned guest checkouts after 24 hours

**Corporate Pay Later**:
- Validate corporate account has pay-later approval
- Check credit limit and outstanding invoices
- Create booking without immediate payment
- Generate invoice with payment terms (Net 30)
- Send invoice to corporate billing contact
- Track invoice payment status
- Enable pickup only after invoice payment

**Payment Reminders**:
- Send reminder 48 hours before pickup for outstanding balance
- Send reminder 24 hours before pickup if still unpaid
- Send final reminder 12 hours before pickup
- Block pickup if balance unpaid at pickup time

### Authentication Requirements

- JWT authentication for authenticated payment flows
- No authentication required for guest checkout (pre-payment)
- Corporate role required for pay-later option
- Admin role for payment schedule modifications
- Rate limiting on guest checkout (5 per IP per hour)

## Database Specifications

### Schema Changes

Add payment schedule tracking and guest checkout tables.

### Table Definitions

**PaymentSchedules** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- BookingId: INT NOT NULL UNIQUE
- TotalAmount: DECIMAL(10,2) NOT NULL
- DepositAmount: DECIMAL(10,2) NOT NULL
- BalanceAmount: DECIMAL(10,2) NOT NULL
- DepositPaidAt: DATETIME
- BalancePaidAt: DATETIME
- BalanceDueDate: DATETIME NOT NULL
- Status: ENUM('deposit_pending', 'deposit_paid', 'fully_paid') NOT NULL
- CreatedAt: DATETIME NOT NULL
- UpdatedAt: DATETIME NOT NULL
- CONSTRAINT fk_payment_schedules_booking FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE

**GuestCheckouts** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- Email: VARCHAR(255) NOT NULL
- FirstName: VARCHAR(100) NOT NULL
- LastName: VARCHAR(100) NOT NULL
- Phone: VARCHAR(20) NOT NULL
- BookingId: INT UNIQUE
- PaymentStatus: ENUM('pending', 'completed', 'failed') NOT NULL
- AccountCreated: BOOLEAN DEFAULT FALSE
- CreatedAt: DATETIME NOT NULL
- ExpiresAt: DATETIME NOT NULL
- INDEX idx_email (Email)
- INDEX idx_booking_id (BookingId)

**CorporateInvoices** (new table):
- Id: INT PRIMARY KEY AUTO_INCREMENT
- BookingId: INT NOT NULL
- CorporateAccountId: INT NOT NULL
- InvoiceNumber: VARCHAR(50) NOT NULL UNIQUE
- Amount: DECIMAL(10,2) NOT NULL
- Currency: VARCHAR(3) NOT NULL
- Status: ENUM('pending', 'sent', 'paid', 'overdue') NOT NULL
- IssuedDate: DATE NOT NULL
- DueDate: DATE NOT NULL
- PaidDate: DATE
- PurchaseOrderNumber: VARCHAR(100)
- BillingContact: JSON NOT NULL
- PdfPath: VARCHAR(500)
- INDEX idx_corporate_account (CorporateAccountId)
- INDEX idx_status (Status)

### Relationships

- PaymentSchedules → Bookings (one-to-one)
- GuestCheckouts → Bookings (one-to-one, optional)
- CorporateInvoices → Bookings (many-to-one)
- CorporateInvoices → CorporateAccounts (many-to-one)

### Indexes

- UNIQUE INDEX idx_booking_id ON PaymentSchedules(BookingId)
- INDEX idx_status ON PaymentSchedules(Status)
- INDEX idx_balance_due_date ON PaymentSchedules(BalanceDueDate)
- INDEX idx_email ON GuestCheckouts(Email)
- INDEX idx_expires_at ON GuestCheckouts(ExpiresAt)
- UNIQUE INDEX idx_invoice_number ON CorporateInvoices(InvoiceNumber)
- INDEX idx_corporate_account ON CorporateInvoices(CorporateAccountId)
- INDEX idx_due_date ON CorporateInvoices(DueDate)

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+
- Security: Azure Key Vault for secrets management

## Implementation Notes

- Use hosted checkout pages for SAQ A compliance
- Never store full card numbers, CVV, or magnetic stripe data
- Tokenize all payment methods through gateways
- Encrypt payment tokens at rest using AES-256
- Use TLS 1.2+ for all payment API communications
- Implement certificate pinning in mobile apps
- Configure firewall rules to restrict payment system access
- Use network segmentation for payment infrastructure
- Implement MFA for admin access to payment data
- Log all payment-related operations with full context
- Retain audit logs for minimum 12 months
- Conduct quarterly vulnerability scans by approved ASV
- Complete annual SAQ self-assessment questionnaire
- Maintain documentation of payment processing workflows
- Store Attestation of Compliance (AOC) for acquiring bank
- Implement intrusion detection for payment systems
- Monitor for suspicious payment patterns
- Set up security alerting for anomalies
- Rotate API keys and secrets quarterly
- Use environment variables for sensitive configuration
- Implement proper exception handling without exposing sensitive data
- Clean up expired guest checkouts daily
- Send payment reminders via background job
- Monitor corporate invoice aging
- Implement automatic late fees for overdue invoices
