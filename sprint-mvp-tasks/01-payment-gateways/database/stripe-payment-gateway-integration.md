# Feature: Stripe Payment Gateway Integration

## Overview

Database schema for Stripe payment gateway integration, storing customer mappings, payment intents, and webhook events for audit trail and idempotency.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-001

## Database Specifications

### Schema Changes

Create three new tables for Stripe integration: StripeCustomers, StripePaymentIntents, and StripeWebhookEvents.

### Table Definitions

**StripeCustomers**:
```
CREATE TABLE StripeCustomers (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    UserId INT NOT NULL UNIQUE,
    StripeCustomerId VARCHAR(255) NOT NULL UNIQUE,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_stripe_customers_user 
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**StripePaymentIntents**:
```
CREATE TABLE StripePaymentIntents (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BookingId INT NOT NULL,
    PaymentIntentId VARCHAR(255) NOT NULL UNIQUE,
    Amount DECIMAL(10,2) NOT NULL,
    Currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    Status ENUM(
        'requires_payment_method',
        'requires_confirmation', 
        'requires_action',
        'processing',
        'succeeded',
        'canceled'
    ) NOT NULL,
    PaymentMethodId VARCHAR(255),
    ClientSecret VARCHAR(500),
    IdempotencyKey VARCHAR(255) UNIQUE,
    Metadata JSON,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_stripe_payment_intents_booking 
        FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**StripeWebhookEvents**:
```
CREATE TABLE StripeWebhookEvents (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    EventId VARCHAR(255) NOT NULL UNIQUE,
    EventType VARCHAR(100) NOT NULL,
    PaymentIntentId VARCHAR(255),
    ProcessedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    RawPayload JSON NOT NULL,
    ProcessingStatus ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending',
    ErrorMessage TEXT,
    CONSTRAINT fk_stripe_webhook_payment_intent 
        FOREIGN KEY (PaymentIntentId) 
        REFERENCES StripePaymentIntents(PaymentIntentId) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- StripeCustomers.UserId → Users.Id (one-to-one, cascade delete)
- StripePaymentIntents.BookingId → Bookings.Id (many-to-one, cascade delete)
- StripeWebhookEvents.PaymentIntentId → StripePaymentIntents.PaymentIntentId (many-to-one, set null on delete)

### Indexes

**StripeCustomers**:
- PRIMARY KEY (Id)
- UNIQUE INDEX idx_user_id (UserId) - Fast user-to-customer lookup
- UNIQUE INDEX idx_stripe_customer_id (StripeCustomerId) - Stripe API operations

**StripePaymentIntents**:
- PRIMARY KEY (Id)
- UNIQUE INDEX idx_payment_intent_id (PaymentIntentId) - Webhook processing
- INDEX idx_booking_id (BookingId) - Booking payment queries
- INDEX idx_status (Status) - Payment status filtering
- UNIQUE INDEX idx_idempotency_key (IdempotencyKey) - Prevent duplicate payments

**StripeWebhookEvents**:
- PRIMARY KEY (Id)
- UNIQUE INDEX idx_event_id (EventId) - Idempotent webhook processing
- INDEX idx_payment_intent_webhook (PaymentIntentId) - Event lookup by payment
- INDEX idx_event_type (EventType) - Event type filtering
- INDEX idx_processing_status (ProcessingStatus) - Failed event retry

## Technology Stack

- Database: MySQL 8.0+
- Backend: .NET 8+ with Entity Framework Core

## Implementation Notes

- Use InnoDB engine for transaction support
- Set utf8mb4 charset for international character support
- Implement foreign key constraints for referential integrity
- Store webhook raw payload as JSON for debugging
- Use ENUM types for status fields to ensure data integrity
- Implement unique constraints on Stripe IDs to prevent duplicates
- Store idempotency keys to prevent duplicate payment processing
- Index frequently queried fields for performance
- Set appropriate ON DELETE actions (CASCADE for customers, SET NULL for webhooks)
- Use JSON column type for flexible metadata storage
- Implement automatic timestamp updates with ON UPDATE CURRENT_TIMESTAMP
- Consider partitioning StripeWebhookEvents table by date for large volumes
- Set up database backups with point-in-time recovery
- Monitor table sizes and implement archival strategy for old webhook events
