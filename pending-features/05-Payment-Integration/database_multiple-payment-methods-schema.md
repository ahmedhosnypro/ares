# Feature: Multiple Payment Method Support (Database Schema)

## Overview

Database schema design for storing payment methods, transactions, authorizations, and refunds with full audit trail and PCI-DSS compliance. Supports multiple payment types including cards, digital wallets, PayPal, bank transfers, and corporate billing.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

F-PB-001 (Database Schema)

## Database Specifications

### Schema Changes

**New Tables**:
- `PaymentMethods` - Tokenized payment method storage
- `PaymentTransactions` - Complete transaction records
- `PaymentAuthorizations` - Pre-authorization holds
- `RefundTransactions` - Refund processing records
- `PaymentGatewayWebhooks` - Webhook event log

### Table Definitions

**PaymentMethods**:
```sql
CREATE TABLE PaymentMethods (
  PaymentMethodId CHAR(36) PRIMARY KEY,
  UserId CHAR(36) NOT NULL,
  PaymentType ENUM('card', 'paypal', 'bank_transfer', 'corporate', 'apple_pay', 'google_pay') NOT NULL,
  TokenizedData VARCHAR(500) NOT NULL COMMENT 'Encrypted gateway token',
  DisplayName VARCHAR(100) NOT NULL COMMENT 'User-friendly name',
  MaskedDetails VARCHAR(50) NOT NULL COMMENT 'Masked card/account number',
  CardBrand VARCHAR(20) NULL COMMENT 'visa, mastercard, amex, etc.',
  ExpirationMonth TINYINT NULL COMMENT '1-12',
  ExpirationYear SMALLINT NULL COMMENT 'YYYY',
  BillingAddressId CHAR(36) NULL,
  IsDefault BOOLEAN DEFAULT FALSE,
  IsExpired BOOLEAN DEFAULT FALSE,
  IsVerified BOOLEAN DEFAULT FALSE COMMENT 'For bank accounts',
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  DeletedAt DATETIME NULL COMMENT 'Soft delete',
  
  FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
  FOREIGN KEY (BillingAddressId) REFERENCES Addresses(AddressId) ON DELETE SET NULL,
  
  INDEX idx_user_id (UserId),
  INDEX idx_user_default (UserId, IsDefault),
  INDEX idx_expiration (ExpirationYear, ExpirationMonth, IsExpired),
  INDEX idx_deleted (DeletedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PaymentTransactions**:
```sql
CREATE TABLE PaymentTransactions (
  TransactionId CHAR(36) PRIMARY KEY,
  BookingId CHAR(36) NOT NULL,
  UserId CHAR(36) NOT NULL,
  PaymentMethodId CHAR(36) NULL COMMENT 'NULL for guest checkout',
  Amount DECIMAL(10,2) NOT NULL,
  Currency CHAR(3) NOT NULL COMMENT 'ISO 4217',
  TransactionType ENUM('payment', 'refund', 'authorization', 'capture', 'void') NOT NULL,
  Status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'requires_authentication') NOT NULL,
  GatewayTransactionId VARCHAR(255) NULL COMMENT 'External gateway reference',
  GatewayName VARCHAR(50) NOT NULL COMMENT 'stripe, paypal, etc.',
  FraudScore DECIMAL(5,2) NULL COMMENT '0-100 risk score',
  FraudDecision ENUM('accept', 'review', 'decline') NULL,
  RequiresAuthentication BOOLEAN DEFAULT FALSE,
  AuthenticationUrl VARCHAR(500) NULL COMMENT '3DS authentication URL',
  ErrorCode VARCHAR(50) NULL,
  ErrorMessage VARCHAR(500) NULL,
  Metadata JSON NULL COMMENT 'IP, device fingerprint, user agent',
  IdempotencyKey VARCHAR(255) NULL COMMENT 'Prevent duplicate charges',
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CompletedAt DATETIME NULL,
  
  FOREIGN KEY (BookingId) REFERENCES Bookings(BookingId) ON DELETE RESTRICT,
  FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE RESTRICT,
  FOREIGN KEY (PaymentMethodId) REFERENCES PaymentMethods(PaymentMethodId) ON DELETE SET NULL,
  
  INDEX idx_booking_id (BookingId),
  INDEX idx_user_id (UserId, CreatedAt DESC),
  INDEX idx_status (Status, CreatedAt),
  INDEX idx_gateway_transaction (GatewayTransactionId),
  INDEX idx_idempotency (IdempotencyKey),
  INDEX idx_fraud_review (FraudDecision, Status),
  UNIQUE KEY uk_idempotency (IdempotencyKey, BookingId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PaymentAuthorizations**:
```sql
CREATE TABLE PaymentAuthorizations (
  AuthorizationId CHAR(36) PRIMARY KEY,
  BookingId CHAR(36) NOT NULL,
  PaymentMethodId CHAR(36) NOT NULL,
  Amount DECIMAL(10,2) NOT NULL COMMENT 'Authorized amount',
  Currency CHAR(3) NOT NULL,
  Status ENUM('pending', 'authorized', 'captured', 'released', 'expired', 'failed') NOT NULL,
  GatewayAuthorizationId VARCHAR(255) NOT NULL COMMENT 'Gateway hold reference',
  GatewayName VARCHAR(50) NOT NULL,
  ExpiresAt DATETIME NOT NULL COMMENT 'Authorization expiration',
  CapturedAmount DECIMAL(10,2) NULL COMMENT 'Amount actually captured',
  CapturedAt DATETIME NULL,
  ReleasedAt DATETIME NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (BookingId) REFERENCES Bookings(BookingId) ON DELETE RESTRICT,
  FOREIGN KEY (PaymentMethodId) REFERENCES PaymentMethods(PaymentMethodId) ON DELETE RESTRICT,
  
  INDEX idx_booking_id (BookingId),
  INDEX idx_status (Status),
  INDEX idx_expires_at (ExpiresAt, Status),
  INDEX idx_gateway_auth (GatewayAuthorizationId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**RefundTransactions**:
```sql
CREATE TABLE RefundTransactions (
  RefundId CHAR(36) PRIMARY KEY,
  OriginalTransactionId CHAR(36) NOT NULL,
  BookingId CHAR(36) NOT NULL,
  UserId CHAR(36) NOT NULL,
  Amount DECIMAL(10,2) NOT NULL,
  Currency CHAR(3) NOT NULL,
  RefundType ENUM('full', 'partial', 'cancellation', 'modification', 'damage_waiver') NOT NULL,
  Status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL,
  GatewayRefundId VARCHAR(255) NULL,
  Reason VARCHAR(500) NULL,
  ProcessedBy CHAR(36) NULL COMMENT 'Admin user if manual',
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CompletedAt DATETIME NULL,
  
  FOREIGN KEY (OriginalTransactionId) REFERENCES PaymentTransactions(TransactionId) ON DELETE RESTRICT,
  FOREIGN KEY (BookingId) REFERENCES Bookings(BookingId) ON DELETE RESTRICT,
  FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE RESTRICT,
  FOREIGN KEY (ProcessedBy) REFERENCES Users(UserId) ON DELETE SET NULL,
  
  INDEX idx_original_transaction (OriginalTransactionId),
  INDEX idx_booking_id (BookingId),
  INDEX idx_user_id (UserId, CreatedAt DESC),
  INDEX idx_status (Status, CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PaymentGatewayWebhooks**:
```sql
CREATE TABLE PaymentGatewayWebhooks (
  WebhookId CHAR(36) PRIMARY KEY,
  GatewayName VARCHAR(50) NOT NULL,
  EventType VARCHAR(100) NOT NULL COMMENT 'payment.succeeded, refund.completed, etc.',
  EventId VARCHAR(255) NOT NULL COMMENT 'Gateway event ID',
  Payload JSON NOT NULL COMMENT 'Full webhook payload',
  Signature VARCHAR(500) NOT NULL COMMENT 'Webhook signature for verification',
  ProcessedAt DATETIME NULL,
  ProcessingStatus ENUM('pending', 'processed', 'failed', 'ignored') NOT NULL DEFAULT 'pending',
  ErrorMessage VARCHAR(500) NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_gateway_event (GatewayName, EventId),
  INDEX idx_processing_status (ProcessingStatus, CreatedAt),
  UNIQUE KEY uk_gateway_event (GatewayName, EventId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

**Primary Relationships**:
- `PaymentMethods.UserId` → `Users.UserId` (Many-to-One): User owns multiple payment methods
- `PaymentMethods.BillingAddressId` → `Addresses.AddressId` (Many-to-One): Payment method has billing address
- `PaymentTransactions.BookingId` → `Bookings.BookingId` (Many-to-One): Multiple transactions per booking
- `PaymentTransactions.UserId` → `Users.UserId` (Many-to-One): User transaction history
- `PaymentTransactions.PaymentMethodId` → `PaymentMethods.PaymentMethodId` (Many-to-One): Transaction uses payment method
- `PaymentAuthorizations.BookingId` → `Bookings.BookingId` (One-to-One): One authorization per booking
- `PaymentAuthorizations.PaymentMethodId` → `PaymentMethods.PaymentMethodId` (Many-to-One): Authorization on payment method
- `RefundTransactions.OriginalTransactionId` → `PaymentTransactions.TransactionId` (Many-to-One): Refund references original payment
- `RefundTransactions.BookingId` → `Bookings.BookingId` (Many-to-One): Refund associated with booking

**Cascade Rules**:
- User deletion: CASCADE delete payment methods (PCI compliance - remove all data)
- Booking deletion: RESTRICT (cannot delete booking with transactions)
- Payment method deletion: SET NULL on transactions (preserve transaction history)

### Indexes

**Query Optimization**:
- `idx_user_id` on `PaymentMethods(UserId)` - Retrieve user's payment methods
- `idx_user_default` on `PaymentMethods(UserId, IsDefault)` - Find default payment method
- `idx_expiration` on `PaymentMethods(ExpirationYear, ExpirationMonth, IsExpired)` - Expiration monitoring
- `idx_booking_id` on `PaymentTransactions(BookingId)` - Booking payment history
- `idx_user_id` on `PaymentTransactions(UserId, CreatedAt DESC)` - User transaction history
- `idx_status` on `PaymentTransactions(Status, CreatedAt)` - Pending payment monitoring
- `idx_gateway_transaction` on `PaymentTransactions(GatewayTransactionId)` - Gateway reconciliation
- `idx_fraud_review` on `PaymentTransactions(FraudDecision, Status)` - Manual review queue
- `idx_expires_at` on `PaymentAuthorizations(ExpiresAt, Status)` - Authorization expiration cleanup
- `idx_processing_status` on `PaymentGatewayWebhooks(ProcessingStatus, CreatedAt)` - Webhook processing queue

**Unique Constraints**:
- `uk_idempotency` on `PaymentTransactions(IdempotencyKey, BookingId)` - Prevent duplicate charges
- `uk_gateway_event` on `PaymentGatewayWebhooks(GatewayName, EventId)` - Prevent duplicate webhook processing

### Data Integrity Constraints

**Check Constraints**:
- `Amount > 0` on all transaction tables
- `ExpirationMonth BETWEEN 1 AND 12` on PaymentMethods
- `ExpirationYear >= YEAR(CURRENT_DATE)` for non-expired cards
- `FraudScore BETWEEN 0 AND 100` on PaymentTransactions
- `CapturedAmount <= Amount` on PaymentAuthorizations

**Business Rules**:
- Only one default payment method per user
- Cannot delete payment method used in pending booking
- Refund amount cannot exceed original transaction amount
- Authorization must be captured before expiration
- Transaction status transitions must follow valid state machine

## Technology Stack

- Database: MySQL 8.0+ with InnoDB storage engine
- Character Set: utf8mb4 for full Unicode support
- Collation: utf8mb4_unicode_ci for case-insensitive comparisons
- Storage Engine: InnoDB for ACID compliance and foreign key support

## Implementation Notes

**Security Considerations**:
- Encrypt `TokenizedData` column at application level before storage
- Never store raw card numbers, CVV, or full account numbers
- Implement column-level encryption for sensitive fields
- Use database audit logging for payment table access
- Restrict database user permissions to minimum required
- Enable MySQL audit plugin for compliance

**Data Retention**:
- Retain transaction records for 7 years (financial compliance)
- Soft delete payment methods (set DeletedAt) to preserve transaction history
- Purge soft-deleted payment methods after 90 days
- Archive old transactions to separate table after 2 years

**Performance Optimization**:
- Partition PaymentTransactions by CreatedAt (monthly partitions)
- Use covering indexes for common queries
- Implement read replicas for reporting queries
- Cache payment method lookups in Redis

**Backup and Recovery**:
- Daily encrypted backups of payment tables
- Point-in-time recovery capability
- Test restore procedures quarterly
- Store backups in geographically separate location

**Monitoring**:
- Monitor table growth rates
- Alert on unusual transaction volumes
- Track query performance on payment tables
- Monitor failed transaction rates

## Related Features

- F-PB-001: Multiple Payment Methods (Frontend/Backend)
- F-COMP-PAY-001: PCI Compliance & Tokenization
- F-SEC-DATA-001: Data Encryption
