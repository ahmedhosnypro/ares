# Feature: Payment Flow Patterns

## Overview

Backend implementation for flexible payment flow patterns including deposit payments, full upfront payment, corporate pay-later, and guest checkout with automatic account creation.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-004

## User Stories

As a backend developer, I want to implement multiple payment timing options, so that customers can choose the payment flow that suits their needs.

As a system, I want to track payment schedules and send reminders, so that outstanding balances are collected before pickup.

As a platform operator, I want to support corporate invoicing, so that B2B clients can book through their procurement process.

## Backend Specifications

### API Endpoints

All endpoints defined in frontend specification.

### Request Schemas

All request schemas defined in frontend specification.

### Response Schemas

All response schemas defined in frontend specification.

### Business Logic

**Deposit Payment Logic**:
- Validate deposit percentage (20-100%)
- Calculate deposit and balance amounts
- Create payment schedule with milestones
- Process deposit payment immediately
- Schedule balance payment 48 hours before pickup
- Send automated reminders at 48h, 24h, 12h before pickup
- Block pickup if balance unpaid
- Apply deposit to total booking cost

**Full Payment Logic**:
- Process entire booking amount immediately
- Mark booking as fully paid
- No additional payment required
- Enable immediate pickup (after pickup time)

**Pay Later Logic**:
- Validate corporate account eligibility
- Check credit limit and outstanding balance
- Verify corporate account is in good standing
- Create booking without payment
- Generate invoice with Net 30 terms
- Send invoice to corporate billing contact
- Track invoice aging
- Send payment reminders at 15, 25, 30 days
- Apply late fees after 30 days
- Block future bookings if invoices overdue

**Guest Checkout Logic**:
- Validate email is not already registered
- Create temporary guest checkout record
- Process payment through selected gateway
- On payment success:
  - Create user account with guest information
  - Generate random secure password
  - Send account activation email with password reset link
  - Link booking to new account
  - Mark guest checkout as completed
- On payment failure:
  - Keep guest checkout record for retry
  - Allow guest to retry payment
- Clean up abandoned guest checkouts after 24 hours

**Payment Schedule Management**:
- Create payment schedule on booking creation
- Track deposit and balance payment status
- Calculate due dates based on pickup time
- Send automated reminders via email and SMS
- Update schedule status on payment completion
- Handle early balance payments
- Support payment schedule modifications (admin only)

**Reminder System**:
- Background job runs hourly
- Identifies bookings with outstanding balance
- Checks reminder schedule (48h, 24h, 12h before pickup)
- Sends email and SMS reminders
- Logs reminder delivery
- Escalates to support team if payment not received

### Authentication Requirements

- JWT authentication for authenticated flows
- No authentication for guest checkout (pre-payment)
- Corporate role required for pay-later option
- Admin role for payment schedule modifications
- Rate limiting on guest checkout (5 per IP per hour)
- Rate limiting on payment creation (10 per user per minute)

## Database Specifications

### Schema Changes

Add tables for payment schedules, guest checkouts, and corporate invoices.

### Table Definitions

**PaymentSchedules**:
```
CREATE TABLE PaymentSchedules (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BookingId INT NOT NULL UNIQUE,
    TotalAmount DECIMAL(10,2) NOT NULL,
    DepositAmount DECIMAL(10,2) NOT NULL,
    BalanceAmount DECIMAL(10,2) NOT NULL,
    DepositPaidAt DATETIME,
    BalancePaidAt DATETIME,
    BalanceDueDate DATETIME NOT NULL,
    Status ENUM('deposit_pending', 'deposit_paid', 'fully_paid') NOT NULL DEFAULT 'deposit_pending',
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_schedules_booking 
        FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**GuestCheckouts**:
```
CREATE TABLE GuestCheckouts (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Email VARCHAR(255) NOT NULL,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    BookingId INT UNIQUE,
    PaymentStatus ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    AccountCreated BOOLEAN DEFAULT FALSE,
    CreatedUserId INT,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NOT NULL,
    CONSTRAINT fk_guest_checkouts_booking 
        FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE SET NULL,
    CONSTRAINT fk_guest_checkouts_user 
        FOREIGN KEY (CreatedUserId) REFERENCES Users(Id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**CorporateInvoices**:
```
CREATE TABLE CorporateInvoices (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BookingId INT NOT NULL,
    CorporateAccountId INT NOT NULL,
    InvoiceNumber VARCHAR(50) NOT NULL UNIQUE,
    Amount DECIMAL(10,2) NOT NULL,
    Currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    Status ENUM('pending', 'sent', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'pending',
    IssuedDate DATE NOT NULL,
    DueDate DATE NOT NULL,
    PaidDate DATE,
    PurchaseOrderNumber VARCHAR(100),
    BillingContact JSON NOT NULL,
    PdfPath VARCHAR(500),
    LateFeeAmount DECIMAL(10,2) DEFAULT 0.00,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_corporate_invoices_booking 
        FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE,
    CONSTRAINT fk_corporate_invoices_account 
        FOREIGN KEY (CorporateAccountId) REFERENCES CorporateAccounts(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PaymentReminders** (new table):
```
CREATE TABLE PaymentReminders (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BookingId INT NOT NULL,
    ReminderType ENUM('48_hours', '24_hours', '12_hours', 'invoice_15_days', 'invoice_25_days', 'invoice_30_days') NOT NULL,
    SentAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    DeliveryStatus ENUM('sent', 'delivered', 'failed') NOT NULL,
    Channel ENUM('email', 'sms', 'push') NOT NULL,
    CONSTRAINT fk_payment_reminders_booking 
        FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- PaymentSchedules → Bookings (one-to-one)
- GuestCheckouts → Bookings (one-to-one, optional)
- GuestCheckouts → Users (one-to-one, optional, for created account)
- CorporateInvoices → Bookings (many-to-one)
- CorporateInvoices → CorporateAccounts (many-to-one)
- PaymentReminders → Bookings (many-to-one)

### Indexes

**PaymentSchedules**:
- UNIQUE INDEX idx_booking_id (BookingId)
- INDEX idx_status (Status)
- INDEX idx_balance_due_date (BalanceDueDate) - For reminder job

**GuestCheckouts**:
- INDEX idx_email (Email) - Check for existing accounts
- INDEX idx_expires_at (ExpiresAt) - Cleanup job
- INDEX idx_payment_status (PaymentStatus)

**CorporateInvoices**:
- UNIQUE INDEX idx_invoice_number (InvoiceNumber)
- INDEX idx_corporate_account (CorporateAccountId)
- INDEX idx_status (Status)
- INDEX idx_due_date (DueDate) - For aging reports

**PaymentReminders**:
- INDEX idx_booking_id (BookingId)
- INDEX idx_sent_at (SentAt)

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+
- Background Jobs: Hangfire or Quartz.NET for reminders

## Implementation Notes

- Implement background job for payment reminders (runs hourly)
- Clean up expired guest checkouts daily (older than 24 hours)
- Generate unique invoice numbers with prefix (INV-YYYY-MM-XXXXXX)
- Calculate late fees automatically after due date
- Send invoice via email with PDF attachment
- Implement payment schedule modification with audit trail
- Support early balance payment without penalty
- Block pickup if balance unpaid at pickup time
- Generate secure random passwords for guest accounts (min 12 chars)
- Send account activation email with password reset link
- Implement guest checkout cleanup job
- Track payment reminder delivery status
- Escalate to support if payment not received after final reminder
- Monitor corporate account credit limits
- Implement invoice aging reports
- Support partial payments for corporate invoices
- Calculate deposit percentage based on booking value and customer trust score
- Allow admin override of payment timing requirements
- Implement payment schedule notifications via webhook
