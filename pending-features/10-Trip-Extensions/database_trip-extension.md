# Feature: Trip Extension (Database)

## Overview

Database schema for tracking trip extensions including extension history, cost tracking, payment status, and grace period usage.

## Sprint Category

sprint-01

## Feature ID

F-BM-009

## Table Definitions

### trip_extensions

```sql
CREATE TABLE trip_extensions (
  extension_id VARCHAR(36) PRIMARY KEY COMMENT 'Unique extension identifier',
  trip_id VARCHAR(36) NOT NULL COMMENT 'Reference to extended trip',
  booking_id VARCHAR(36) NOT NULL COMMENT 'Reference to original booking',
  extended_by_user_id VARCHAR(36) NOT NULL COMMENT 'User who requested extension',
  extended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When extension was made',
  
  -- Extension details
  original_return_time DATETIME NOT NULL COMMENT 'Original scheduled return time',
  new_return_time DATETIME NOT NULL COMMENT 'New extended return time',
  extension_hours DECIMAL(5,2) NOT NULL COMMENT 'Number of hours extended',
  
  -- Financial
  extension_cost DECIMAL(10,2) NOT NULL COMMENT 'Additional cost for extension',
  payment_status ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
  payment_transaction_id VARCHAR(100) COMMENT 'Payment gateway transaction ID',
  
  -- Tracking
  availability_checked_at TIMESTAMP COMMENT 'When availability was verified',
  supplier_notified BOOLEAN DEFAULT FALSE COMMENT 'Whether supplier was notified',
  supplier_notified_at TIMESTAMP COMMENT 'When supplier notification sent',
  
  -- Grace period
  in_grace_period BOOLEAN DEFAULT FALSE COMMENT 'Extension made during grace period',
  grace_period_fees_waived DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Late fees waived',
  
  notes TEXT COMMENT 'Additional notes or comments',
  
  FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
  FOREIGN KEY (extended_by_user_id) REFERENCES users(user_id),
  
  INDEX idx_trip_extensions (trip_id, extended_at DESC),
  INDEX idx_extended_at (extended_at),
  INDEX idx_payment_status (payment_status),
  
  CONSTRAINT chk_extension_hours_positive CHECK (extension_hours > 0),
  CONSTRAINT chk_new_return_after_original CHECK (new_return_time > original_return_time)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks all trip extensions with cost and payment information';
```

### trips Table Updates

```sql
ALTER TABLE trips
ADD COLUMN extension_count INT DEFAULT 0 COMMENT 'Number of times trip was extended',
ADD COLUMN total_extension_hours DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Total hours extended',
ADD COLUMN grace_period_used BOOLEAN DEFAULT FALSE COMMENT 'Whether grace period was used',
ADD INDEX idx_extension_count (extension_count);
```

## Relationships

### trip_extensions → trips
- Many-to-one relationship
- Each extension belongs to one trip
- Foreign key: `trip_id`
- Cascade delete: Extensions deleted when trip deleted

### trip_extensions → bookings
- Many-to-one relationship
- Each extension belongs to one booking
- Foreign key: `booking_id`

### trip_extensions → users
- Many-to-one relationship
- Each extension made by one user
- Foreign key: `extended_by_user_id`

## Indexes

```sql
-- Most common query: Get extensions for a trip
CREATE INDEX idx_trip_extensions 
ON trip_extensions(trip_id, extended_at DESC);

-- Payment processing queries
CREATE INDEX idx_payment_status 
ON trip_extensions(payment_status, extended_at);

-- Temporal analysis
CREATE INDEX idx_extended_at 
ON trip_extensions(extended_at);

-- Grace period analysis
CREATE INDEX idx_grace_period 
ON trip_extensions(in_grace_period, extended_at);
```

## Triggers

### Update Trip Extension Metadata

```sql
DELIMITER //

CREATE TRIGGER trg_update_trip_extension_count
AFTER INSERT ON trip_extensions
FOR EACH ROW
BEGIN
  UPDATE trips
  SET 
    extension_count = extension_count + 1,
    total_extension_hours = total_extension_hours + NEW.extension_hours,
    grace_period_used = CASE 
      WHEN NEW.in_grace_period THEN TRUE 
      ELSE grace_period_used 
    END,
    return_time = NEW.new_return_time
  WHERE trip_id = NEW.trip_id;
END//

DELIMITER ;
```

## Query Patterns

### Get Extension History for Trip

```sql
SELECT 
  e.extension_id,
  e.extended_at,
  e.original_return_time,
  e.new_return_time,
  e.extension_hours,
  e.extension_cost,
  e.payment_status,
  e.in_grace_period,
  u.first_name,
  u.last_name
FROM trip_extensions e
JOIN users u ON e.extended_by_user_id = u.user_id
WHERE e.trip_id = ?
ORDER BY e.extended_at DESC;
```

### Find Pending Payment Extensions

```sql
SELECT 
  e.extension_id,
  e.trip_id,
  e.booking_id,
  e.extension_cost,
  e.extended_at,
  t.customer_email
FROM trip_extensions e
JOIN trips t ON e.trip_id = t.trip_id
WHERE e.payment_status = 'pending'
  AND e.extended_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
ORDER BY e.extended_at ASC
LIMIT 100;
```

### Extension Statistics

```sql
SELECT 
  DATE(extended_at) as extension_date,
  COUNT(*) as total_extensions,
  AVG(extension_hours) as avg_hours_extended,
  SUM(extension_cost) as total_revenue,
  COUNT(CASE WHEN in_grace_period THEN 1 END) as grace_period_extensions,
  COUNT(CASE WHEN payment_status = 'processed' THEN 1 END) as successful_payments
FROM trip_extensions
WHERE extended_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(extended_at)
ORDER BY extension_date DESC;
```

### Grace Period Usage Analysis

```sql
SELECT 
  COUNT(*) as total_extensions,
  COUNT(CASE WHEN in_grace_period THEN 1 END) as grace_period_count,
  SUM(grace_period_fees_waived) as total_fees_waived,
  AVG(extension_hours) as avg_extension_hours
FROM trip_extensions
WHERE extended_at >= DATE_SUB(NOW(), INTERVAL 90 DAY);
```

## Data Integrity

### Check Constraints

```sql
-- Extension hours must be positive
ALTER TABLE trip_extensions
ADD CONSTRAINT chk_extension_hours_positive 
CHECK (extension_hours > 0);

-- New return time must be after original
ALTER TABLE trip_extensions
ADD CONSTRAINT chk_new_return_after_original 
CHECK (new_return_time > original_return_time);

-- Extension cost must be non-negative
ALTER TABLE trip_extensions
ADD CONSTRAINT chk_extension_cost_positive 
CHECK (extension_cost >= 0);
```

## Technology Stack

- **Database**: MySQL 8.0+
- **Storage Engine**: InnoDB
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci

## Implementation Notes

### Migration Strategy
1. Create trip_extensions table
2. Add columns to trips table
3. Create indexes
4. Create triggers
5. Test with sample data
6. Deploy to production

### Performance Optimization
- Index on (trip_id, extended_at) for common queries
- Partition by extended_at for high-volume systems
- Archive old extensions after 2 years

### Monitoring
- Track table size growth
- Monitor extension success rates
- Alert on high payment failure rates
- Track grace period usage patterns
