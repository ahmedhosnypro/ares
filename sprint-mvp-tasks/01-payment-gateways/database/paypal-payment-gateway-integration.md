# Feature: PayPal Payment Gateway Integration

## Overview

Database schema for PayPal payment gateway integration, storing order tracking, capture details, and webhook events for audit trail and transaction reconciliation.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-002

## Database Specifications

### Schema Changes

Create three new tables for PayPal integration: PayPalOrders, PayPalCaptures, and PayPalWebhookEvents.

### Table Definitions

**PayPalOrders**:
```
CREATE TABLE PayPalOrders (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    BookingId INT NOT NULL,
    OrderId VARCHAR(255) NOT NULL UNIQUE,
    Amount DECIMAL(10,2) NOT NULL,
    Currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    Status ENUM('CREATED', 'APPROVED', 'COMPLETED', 'VOIDED', 'EXPIRED') NOT NULL,
    ApprovalUrl VARCHAR(500),
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_paypal_orders_booking 
        FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PayPalCaptures**:
```
CREATE TABLE PayPalCaptures (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    OrderId VARCHAR(255) NOT NULL,
    CaptureId VARCHAR(255) NOT NULL UNIQUE,
    Amount DECIMAL(10,2) NOT NULL,
    Currency VARCHAR(3) NOT NULL,
    Status ENUM('COMPLETED', 'PENDING', 'DECLINED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL,
    PayerEmail VARCHAR(255),
    PayerName VARCHAR(255),
    TransactionId VARCHAR(255),
    CapturedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_paypal_captures_order 
        FOREIGN KEY (OrderId) REFERENCES PayPalOrders(OrderId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PayPalWebhookEvents**:
```
CREATE TABLE PayPalWebhookEvents (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    EventId VARCHAR(255) NOT NULL UNIQUE,
    EventType VARCHAR(100) NOT NULL,
    ResourceId VARCHAR(255),
    ProcessedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    RawPayload JSON NOT NULL,
    ProcessingStatus ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending',
    ErrorMessage TEXT,
    INDEX idx_event_id (EventId),
    INDEX idx_resource_id (ResourceId),
    INDEX idx_event_type (EventType)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- PayPalOrders.BookingId → Bookings.Id (many-to-one, cascade delete)
- PayPalCaptures.OrderId → PayPalOrders.OrderId (many-to-one, cascade delete)
- PayPalWebhookEvents.ResourceId → PayPalOrders.OrderId or PayPalCaptures.CaptureId (optional reference)

### Indexes

**PayPalOrders**:
- PRIMARY KEY (Id)
- UNIQUE INDEX idx_order_id (OrderId) - PayPal API operations
- INDEX idx_booking_id (BookingId) - Booking payment queries
- INDEX idx_status (Status) - Order status filtering
- INDEX idx_expires_at (ExpiresAt) - Cleanup expired orders

**PayPalCaptures**:
- PRIMARY KEY (Id)
- UNIQUE INDEX idx_capture_id (CaptureId) - Refund operations
- INDEX idx_order_id_capture (OrderId) - Order capture lookup

**PayPalWebhookEvents**:
- PRIMARY KEY (Id)
- UNIQUE INDEX idx_event_id (EventId) - Idempotent webhook processing
- INDEX idx_resource_id (ResourceId) - Event lookup by resource
- INDEX idx_event_type (EventType) - Event type filtering

## Technology Stack

- Database: MySQL 8.0+
- Backend: .NET 8+ with Entity Framework Core

## Implementation Notes

- Use InnoDB engine for transaction support
- Set utf8mb4 charset for international names
- Implement foreign key constraints for referential integrity
- Store webhook raw payload as JSON for debugging
- Use ENUM types for status fields
- Implement unique constraints on PayPal IDs
- Index frequently queried fields
- Set CASCADE delete for orders and captures
- Use JSON column for flexible payload storage
- Implement automatic timestamp updates
- Create cleanup job for expired orders (older than 7 days)
- Monitor table sizes and archive old webhook events
- Set up database backups with point-in-time recovery
- Consider partitioning webhook events by date for large volumes
