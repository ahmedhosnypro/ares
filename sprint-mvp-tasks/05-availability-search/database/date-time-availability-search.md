# Feature: Date Time Availability Search - Database

## Overview

Database schema and queries to support precise rental period specification with real-time availability checking, maintenance scheduling, and rental constraint management. Optimized for fast date range queries and concurrent booking operations.

## Sprint Category

MVP - Must have for first release (3 weeks)

## Feature ID

F-SD-003

## User Stories

- As a database system, I want to efficiently store booking date ranges, so that availability checks are fast.
- As a database system, I want to track maintenance schedules, so that vehicles are blocked during service periods.
- As a database system, I want to store rental constraints, so that business rules are enforced consistently.
- As a database system, I want to prevent double-bookings, so that data integrity is maintained.
- As a database system, I want to support concurrent booking requests, so that the system scales under load.

## Database Specifications

### Schema Changes

**Bookings Table**
```sql
CREATE TABLE bookings (
  id VARCHAR(50) PRIMARY KEY,
  vehicle_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  pickup_datetime DATETIME NOT NULL,
  return_datetime DATETIME NOT NULL,
  status ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled') NOT NULL,
  location_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT,
  INDEX idx_vehicle_dates (vehicle_id, pickup_datetime, return_datetime),
  INDEX idx_status (status),
  INDEX idx_user (user_id),
  INDEX idx_location (location_id),
  INDEX idx_pickup_date (pickup_datetime),
  INDEX idx_return_date (return_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Vehicle Maintenance Schedule Table**
```sql
CREATE TABLE vehicle_maintenance_schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id VARCHAR(50) NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  maintenance_type VARCHAR(100) NOT NULL,
  notes TEXT,
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_vehicle_dates (vehicle_id, start_datetime, end_datetime),
  INDEX idx_status (status),
  INDEX idx_start_date (start_datetime),
  INDEX idx_end_date (end_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Rental Constraints Table**
```sql
CREATE TABLE rental_constraints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_type VARCHAR(50),
  location_id VARCHAR(50),
  minimum_rental_hours INT NOT NULL DEFAULT 1,
  maximum_rental_days INT NOT NULL DEFAULT 90,
  buffer_hours INT NOT NULL DEFAULT 2,
  time_interval_minutes INT NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  INDEX idx_vehicle_type (vehicle_type),
  INDEX idx_location (location_id),
  INDEX idx_active (is_active),
  UNIQUE KEY unique_constraint (vehicle_type, location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table Definitions

**bookings**
- **Purpose**: Store all vehicle reservations with precise date/time ranges
- **Key Fields**:
  - `id`: Unique booking identifier (UUID format)
  - `vehicle_id`: Reference to rented vehicle
  - `user_id`: Reference to customer making booking
  - `pickup_datetime`: Rental start date and time (stored in UTC)
  - `return_datetime`: Rental end date and time (stored in UTC)
  - `status`: Current booking state for filtering active bookings
  - `location_id`: Pickup location reference
- **Storage**: InnoDB engine for transaction support and foreign key constraints
- **Character Set**: UTF-8 for international character support

**vehicle_maintenance_schedule**
- **Purpose**: Track planned and completed maintenance periods that block vehicle availability
- **Key Fields**:
  - `id`: Auto-incrementing primary key
  - `vehicle_id`: Reference to vehicle being serviced
  - `start_datetime`: Maintenance start date and time (stored in UTC)
  - `end_datetime`: Maintenance end date and time (stored in UTC)
  - `maintenance_type`: Type of service (oil change, inspection, repair, etc.)
  - `notes`: Additional maintenance details
  - `status`: Current maintenance state
  - `created_by`: User who scheduled the maintenance
- **Cascade Delete**: Maintenance records deleted when vehicle is removed
- **Storage**: InnoDB engine for referential integrity

**rental_constraints**
- **Purpose**: Store configurable business rules for rental periods by vehicle type and location
- **Key Fields**:
  - `id`: Auto-incrementing primary key
  - `vehicle_type`: Vehicle category (economy, luxury, SUV, etc.) - NULL for default
  - `location_id`: Specific location - NULL for default
  - `minimum_rental_hours`: Shortest allowed rental period
  - `maximum_rental_days`: Longest allowed rental period
  - `buffer_hours`: Required time between consecutive bookings
  - `time_interval_minutes`: Allowed time increments (15, 30, 60)
  - `is_active`: Enable/disable constraint without deletion
- **Unique Constraint**: One constraint per vehicle type and location combination
- **Cascade Delete**: Constraints deleted when location is removed

### Relationships

**vehicles → bookings (one-to-many)**
- A vehicle can have multiple bookings over time
- Bookings cannot exist without a vehicle (RESTRICT on delete)
- Used for availability checking and utilization tracking

**users → bookings (one-to-many)**
- A user can have multiple bookings
- Bookings cannot exist without a user (RESTRICT on delete)
- Used for booking history and user analytics

**locations → bookings (one-to-many)**
- A location can have multiple bookings
- Bookings cannot exist without a location (RESTRICT on delete)
- Used for location-based availability queries

**vehicles → vehicle_maintenance_schedule (one-to-many)**
- A vehicle can have multiple maintenance periods
- Maintenance records deleted when vehicle is removed (CASCADE)
- Used for blocking vehicle availability during service

**locations → rental_constraints (one-to-many)**
- A location can have multiple constraints (one per vehicle type)
- Constraints deleted when location is removed (CASCADE)
- Used for location-specific rental rules

**users → vehicle_maintenance_schedule (one-to-many)**
- A user can schedule multiple maintenance periods
- User reference set to NULL if user is deleted (SET NULL)
- Used for audit trail of who scheduled maintenance

### Indexes

**bookings table indexes:**
- `PRIMARY KEY (id)`: Fast lookup by booking ID
- `idx_vehicle_dates (vehicle_id, pickup_datetime, return_datetime)`: Composite index for availability queries - most critical for performance
- `idx_status (status)`: Filter active vs completed bookings
- `idx_user (user_id)`: User booking history queries
- `idx_location (location_id)`: Location-based availability
- `idx_pickup_date (pickup_datetime)`: Date range queries
- `idx_return_date (return_datetime)`: Date range queries

**vehicle_maintenance_schedule table indexes:**
- `PRIMARY KEY (id)`: Fast lookup by maintenance ID
- `idx_vehicle_dates (vehicle_id, start_datetime, end_datetime)`: Composite index for maintenance period queries
- `idx_status (status)`: Filter scheduled vs completed maintenance
- `idx_start_date (start_datetime)`: Date range queries
- `idx_end_date (end_datetime)`: Date range queries

**rental_constraints table indexes:**
- `PRIMARY KEY (id)`: Fast lookup by constraint ID
- `idx_vehicle_type (vehicle_type)`: Retrieve constraints by vehicle type
- `idx_location (location_id)`: Retrieve constraints by location
- `idx_active (is_active)`: Filter active constraints
- `UNIQUE KEY unique_constraint (vehicle_type, location_id)`: Prevent duplicate constraints

### Query Patterns

**Check Vehicle Availability**
```sql
-- Check if vehicle is available for date range
SELECT COUNT(*) as conflict_count
FROM bookings
WHERE vehicle_id = ?
  AND status IN ('confirmed', 'active')
  AND pickup_datetime < ?  -- requested return datetime
  AND return_datetime > ?  -- requested pickup datetime
UNION ALL
SELECT COUNT(*) as conflict_count
FROM vehicle_maintenance_schedule
WHERE vehicle_id = ?
  AND status IN ('scheduled', 'in_progress')
  AND start_datetime < ?  -- requested return datetime
  AND end_datetime > ?;   -- requested pickup datetime
```

**Get Available Vehicles for Period**
```sql
-- Find all vehicles available for date range at location
SELECT v.*
FROM vehicles v
WHERE v.location_id = ?
  AND v.status = 'available'
  AND v.id NOT IN (
    SELECT vehicle_id FROM bookings
    WHERE status IN ('confirmed', 'active')
      AND pickup_datetime < ?
      AND return_datetime > ?
    UNION
    SELECT vehicle_id FROM vehicle_maintenance_schedule
    WHERE status IN ('scheduled', 'in_progress')
      AND start_datetime < ?
      AND end_datetime > ?
  );
```

**Get Vehicle Calendar**
```sql
-- Retrieve booking and maintenance calendar for vehicle
SELECT 
  DATE(pickup_datetime) as date,
  'booked' as status,
  id as reference_id
FROM bookings
WHERE vehicle_id = ?
  AND status IN ('confirmed', 'active')
  AND pickup_datetime BETWEEN ? AND ?
UNION ALL
SELECT 
  DATE(start_datetime) as date,
  'maintenance' as status,
  id as reference_id
FROM vehicle_maintenance_schedule
WHERE vehicle_id = ?
  AND status IN ('scheduled', 'in_progress')
  AND start_datetime BETWEEN ? AND ?
ORDER BY date;
```

**Get Rental Constraints**
```sql
-- Retrieve constraints for vehicle type and location (with fallback to defaults)
SELECT *
FROM rental_constraints
WHERE is_active = TRUE
  AND (
    (vehicle_type = ? AND location_id = ?)
    OR (vehicle_type = ? AND location_id IS NULL)
    OR (vehicle_type IS NULL AND location_id = ?)
    OR (vehicle_type IS NULL AND location_id IS NULL)
  )
ORDER BY 
  CASE 
    WHEN vehicle_type IS NOT NULL AND location_id IS NOT NULL THEN 1
    WHEN vehicle_type IS NOT NULL THEN 2
    WHEN location_id IS NOT NULL THEN 3
    ELSE 4
  END
LIMIT 1;
```

### Data Integrity

**Constraints**
- Foreign key constraints prevent orphaned bookings
- RESTRICT on delete prevents accidental data loss
- CASCADE on maintenance schedule cleanup
- UNIQUE constraint prevents duplicate rental rules

**Validation**
- ENUM types enforce valid status values
- NOT NULL constraints on critical fields
- CHECK constraints for date logic (return > pickup) - application level
- Positive values for rental periods and buffer times - application level

**Concurrency Control**
- InnoDB row-level locking for concurrent bookings
- Transaction isolation for booking creation
- Optimistic locking with version numbers (application level)
- Deadlock detection and retry logic (application level)

### Performance Optimization

**Index Strategy**
- Composite index on (vehicle_id, pickup_datetime, return_datetime) for availability queries
- Covering indexes to avoid table lookups
- Index on status fields for filtering
- Analyze and optimize index usage regularly

**Query Optimization**
- Use EXPLAIN to analyze query plans
- Avoid SELECT * in production queries
- Use appropriate JOIN types
- Limit result sets with pagination
- Use query result caching for constraints

**Partitioning Strategy**
- Consider partitioning bookings table by date range for large datasets
- Archive completed bookings older than 2 years
- Partition maintenance schedule by year
- Use read replicas for availability queries

**Connection Management**
- Use connection pooling (minimum 10, maximum 100 connections)
- Set appropriate timeout values
- Monitor connection usage and adjust pool size
- Use persistent connections for high-traffic scenarios

## Technology Stack

- Database: MySQL 8.0+ with InnoDB storage engine
- Character Set: UTF-8 (utf8mb4) for international support
- Collation: utf8mb4_unicode_ci for proper sorting
- Storage Engine: InnoDB for transactions and foreign keys

## Implementation Notes

### Migration Strategy

1. Create tables in order: rental_constraints, vehicle_maintenance_schedule, bookings
2. Add indexes after initial data load for better performance
3. Populate rental_constraints with default values
4. Test foreign key constraints before production deployment
5. Create database backup before migration

### Data Migration

- Convert existing booking data to UTC timezone
- Validate all date ranges (return > pickup)
- Populate maintenance schedule from existing records
- Set default rental constraints for all locations
- Verify referential integrity after migration

### Monitoring and Maintenance

- Monitor index usage and query performance
- Set up alerts for slow queries (> 1 second)
- Regularly analyze table statistics
- Archive old bookings to maintain performance
- Monitor table sizes and plan for partitioning

### Backup and Recovery

- Daily full backups of database
- Hourly incremental backups
- Point-in-time recovery capability
- Test restore procedures monthly
- Replicate to secondary datacenter

### Security

- Use parameterized queries to prevent SQL injection
- Restrict database user permissions (no DROP, ALTER in production)
- Encrypt sensitive data at rest
- Enable audit logging for data changes
- Use SSL/TLS for database connections

### Testing Requirements

- Unit tests for all query patterns
- Integration tests for concurrent bookings
- Performance tests with realistic data volumes
- Data integrity tests for foreign key constraints
- Timezone handling tests
- Backup and restore tests
