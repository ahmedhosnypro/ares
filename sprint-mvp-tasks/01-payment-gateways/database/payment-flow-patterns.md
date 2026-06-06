# Feature: Payment Flow Patterns

## Overview

Database schema for flexible payment flow patterns, tracking payment schedules, guest checkouts, corporate invoices, and payment reminders.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-004

## Database Specifications

### Schema Changes

Create four new tables: PaymentSchedules, GuestCheckouts, CorporateInvoices, and PaymentReminders.

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
        FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE,
    INDEX idx_booking_id (BookingId),
    INDEX idx_status (Status),
    INDEX idx_balance_due_date (BalanceDueDate)
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
        FOREIGN KEY (CreatedUserId) REFERENCES Users(Id) ON DELETE SET NULL,
    INDEX idx_email (Email),
    INDEX idx_booking_id (BookingId),
    INDEX idx_expires_at (ExpiresAt),
    INDEX idx_payment_status (PaymentStatus)
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
        FOREIGN KEY (CorporateAccountId) REFERENCES CorporateAccounts(Id) ON DELETE CASCADE,
    INDEX idx_booking_id (BookingId),
    INDEX idx_corporate_account (CorporateAccountId),
    INDEX idx_invoice_number (InvoiceNumber),
    INDEX idx_status (Status),
    INDEX idx_due_date (DueDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PaymentReminders**:
```
CREATE TABLE PaymentReminders (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BookingId INT NOT NULL,
    ReminderType ENUM(
        '48_hours', 
        '24_hours', 
        '12_hours', 
        'invoice_15_days', 
        'invoice_25_days', 
        'invoice_30_days'
    ) NOT NULL,
    SentAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    DeliveryStatus ENUM('sent', 'delivered', 'failed') NOT NULL DEFAULT 'sent',
    Channel ENUM('email', 'sms', 'push') NOT NULL,
    RecipientEmail VARCHAR(255),
    RecipientPhone VARCHAR(20),
    CONSTRAINT fk_payment_reminders_booking 
        FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE,
    INDEX idx_booking_id (BookingId),
    INDEX idx_sent_at (SentAt),
    INDEX idx_reminder_type (ReminderType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- PaymentSchedules.BookingId → Bookings.Id (one-to-one, cascade delete)
- GuestCheckouts.BookingId → Bookings.Id (one-to-one, set null on delete)
- GuestCheckouts.CreatedUserId → Users.Id (one-to-one, set null on delete)
- CorporateInvoices.BookingId → Bookings.Id (many-to-one, cascade delete)
- CorporateInvoices.CorporateAccountId → CorporateAccounts.Id (many-to-one, cascade delete)
- PaymentReminders.BookingId → Bookings.Id (many-to-one, cascade delete)

### Indexes

**PaymentSchedules**:
- PRIMARY KEY (Id)
- UNIQUE INDEX idx_booking_id (BookingId) - One schedule per booking
- INDEX idx_status (Status) - Filter by payment status
- INDEX idx_balance_due_date (BalanceDueDate) - Reminder job queries

**GuestCheckouts**:
- PRIMARY KEY (Id)
- INDEX idx_email (Email) - Check for existing accounts
- INDEX idx_booking_id (BookingId) - Booking lookup
- INDEX idx_expires_at (ExpiresAt) - Cleanup job
- INDEX idx_payment_status (PaymentStatus) - Status filtering

**CorporateInvoices**:
- PRIMARY KEY (Id)
- UNIQUE INDEX idx_invoice_number (InvoiceNumber) - Invoice lookup
- INDEX idx_booking_id (BookingId) - Booking invoice queries
- INDEX idx_corporate_account (CorporateAccountId) - Account invoice history
- INDEX idx_status (Status) - Status filtering
- INDEX idx_due_date (DueDate) - Aging reports

**PaymentReminders**:
- PRIMARY KEY (Id)
- INDEX idx_booking_id (BookingId) - Booking reminder history
- INDEX idx_sent_at (SentAt) - Chronological queries
- INDEX idx_reminder_type (ReminderType) - Reminder type filtering

## Technology Stack

- Database: MySQL 8.0+
- Backend: .NET 8+ with Entity Framework Core
- Background Jobs: Hangfire for scheduled tasks

## Implementation Notes

- Use InnoDB engine for transaction support
- Set utf8mb4 charset for international characters
- Implement foreign key constraints for referential integrity
- Use ENUM types for status fields
- Store billing contact as JSON for flexibility
- Index due dates for reminder job performance
- Implement cleanup job for expired guest checkouts (daily)
- Implement reminder job for outstanding balances (hourly)
- Implement invoice aging job for overdue invoices (daily)
- Calculate late fees automatically after due date
- Generate unique invoice numbers with date-based prefix
- Store PDF paths for generated invoices
- Track reminder delivery status for monitoring
- Support multiple reminders per booking
- Implement payment schedule audit trail
- Monitor table sizes and implement archival strategy
- Set up database backups with point-in-time recovery
- Use transactions for payment schedule updates
- Implement optimistic locking for concurrent updates
