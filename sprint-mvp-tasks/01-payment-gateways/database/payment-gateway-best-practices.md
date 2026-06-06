# Feature: Payment Gateway Integration Best Practices

## Overview

Database schema for payment gateway best practices implementation, tracking idempotency keys, webhook retry attempts, and payment processing metrics.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-005

## Database Specifications

### Schema Changes

Create three new tables: PaymentIdempotencyKeys, WebhookRetryLog, and PaymentMetrics.

### Table Definitions

**PaymentIdempotencyKeys**:
```
CREATE TABLE PaymentIdempotencyKeys (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    IdempotencyKey VARCHAR(255) NOT NULL UNIQUE,
    Gateway ENUM('stripe', 'paypal') NOT NULL,
    PaymentId VARCHAR(255) NOT NULL,
    BookingId INT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NOT NULL,
    CONSTRAINT fk_idempotency_booking 
        FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE,
    INDEX idx_idempotency_key (IdempotencyKey),
    INDEX idx_expires_at (ExpiresAt),
    INDEX idx_booking_id (BookingId),
    INDEX idx_gateway (Gateway)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**WebhookRetryLog**:
```
CREATE TABLE WebhookRetryLog (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    WebhookEventId VARCHAR(255) NOT NULL,
    Gateway ENUM('stripe', 'paypal') NOT NULL,
    AttemptNumber INT NOT NULL,
    AttemptedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('success', 'failure') NOT NULL,
    ErrorMessage TEXT,
    ErrorCode VARCHAR(50),
    NextRetryAt DATETIME,
    ResponseTime INT COMMENT 'Response time in milliseconds',
    INDEX idx_webhook_event_id (WebhookEventId),
    INDEX idx_next_retry_at (NextRetryAt),
    INDEX idx_gateway (Gateway),
    INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PaymentMetrics**:
```
CREATE TABLE PaymentMetrics (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Gateway ENUM('stripe', 'paypal') NOT NULL,
    MetricDate DATE NOT NULL,
    TotalTransactions INT NOT NULL DEFAULT 0,
    SuccessfulTransactions INT NOT NULL DEFAULT 0,
    FailedTransactions INT NOT NULL DEFAULT 0,
    AverageResponseTime INT NOT NULL DEFAULT 0 COMMENT 'Average response time in milliseconds',
    MinResponseTime INT,
    MaxResponseTime INT,
    ErrorBreakdown JSON COMMENT 'Error codes and counts',
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_gateway_date (Gateway, MetricDate),
    INDEX idx_metric_date (MetricDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- PaymentIdempotencyKeys.BookingId → Bookings.Id (many-to-one, cascade delete)
- WebhookRetryLog.WebhookEventId → StripeWebhookEvents.EventId or PayPalWebhookEvents.EventId (reference)
- PaymentMetrics - standalone aggregation table

### Indexes

**PaymentIdempotencyKeys**:
- PRIMARY KEY (Id)
- UNIQUE INDEX idx_idempotency_key (IdempotencyKey) - Fast duplicate detection
- INDEX idx_expires_at (ExpiresAt) - Cleanup job queries
- INDEX idx_booking_id (BookingId) - Booking payment lookup
- INDEX idx_gateway (Gateway) - Gateway-specific queries

**WebhookRetryLog**:
- PRIMARY KEY (Id)
- INDEX idx_webhook_event_id (WebhookEventId) - Retry history lookup
- INDEX idx_next_retry_at (NextRetryAt) - Retry job queries
- INDEX idx_gateway (Gateway) - Gateway-specific retry tracking
- INDEX idx_status (Status) - Failed webhook queries

**PaymentMetrics**:
- PRIMARY KEY (Id)
- UNIQUE INDEX idx_gateway_date (Gateway, MetricDate) - One record per gateway per day
- INDEX idx_metric_date (MetricDate) - Time-series queries

## Technology Stack

- Database: MySQL 8.0+
- Backend: .NET 8+ with Entity Framework Core

## Implementation Notes

- Use InnoDB engine for transaction support
- Set utf8mb4 charset for international support
- Implement unique constraint on idempotency keys
- Store error breakdown as JSON for flexible analysis
- Index expires_at for efficient cleanup queries
- Index next_retry_at for retry job performance
- Implement daily cleanup job for expired idempotency keys (older than 24 hours)
- Implement webhook retry job (runs every minute)
- Implement metrics aggregation job (runs daily at midnight)
- Calculate exponential backoff: next_retry_at = attempted_at + (2^attempt_number) seconds
- Maximum 5 retry attempts per webhook
- Store response times for performance monitoring
- Track error codes for debugging
- Use JSON for flexible error breakdown storage
- Implement database transactions for atomic updates
- Monitor table sizes and implement archival strategy
- Archive old retry logs after 30 days
- Keep metrics for 2 years for trend analysis
- Set up database backups with point-in-time recovery
- Implement query optimization for large tables
- Use partitioning for webhook retry log if volume is high
- Monitor index usage and optimize as needed
