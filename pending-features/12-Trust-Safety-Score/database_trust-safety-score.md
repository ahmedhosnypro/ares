# Feature: Trust & Safety Score - Database Specifications

## Overview

The database schema for the Trust & Safety Score system stores calculated trust scores, component breakdowns, historical snapshots, and improvement recommendations. The schema is designed for efficient querying, supports historical tracking, enables trend analysis, and maintains data integrity through proper relationships and constraints. The design optimizes for both read-heavy operations (displaying scores) and write operations (updating scores on events).

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

F-AM-010

## Schema Design

### New Tables

#### 1. trust_scores

**Purpose**: Store current trust scores and component breakdowns for each user

**Table Definition**:
```sql
CREATE TABLE trust_scores (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID for trust score record',
  user_id CHAR(36) NOT NULL COMMENT 'Reference to user',
  overall_score DECIMAL(5,2) NOT NULL COMMENT 'Weighted overall score (0-100)',
  display_rating DECIMAL(3,2) NOT NULL COMMENT 'Star rating (0-5)',
  verification_score DECIMAL(5,2) NOT NULL COMMENT 'Verification component score',
  booking_history_score DECIMAL(5,2) NOT NULL COMMENT 'Booking history component score',
  payment_reliability_score DECIMAL(5,2) NOT NULL COMMENT 'Payment reliability component score',
  vehicle_care_score DECIMAL(5,2) NOT NULL COMMENT 'Vehicle care component score',
  communication_score DECIMAL(5,2) NOT NULL COMMENT 'Communication quality component score',
  cancellation_rate_score DECIMAL(5,2) NOT NULL COMMENT 'Cancellation rate component score',
  account_age_score DECIMAL(5,2) NOT NULL COMMENT 'Account age component score',
  calculated_at DATETIME NOT NULL COMMENT 'When score was calculated',
  expires_at DATETIME NOT NULL COMMENT 'When cached score expires',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  
  CONSTRAINT fk_trust_scores_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_overall_score CHECK (overall_score >= 0 AND overall_score <= 100),
  CONSTRAINT chk_display_rating CHECK (display_rating >= 0 AND display_rating <= 5),
  CONSTRAINT chk_verification_score CHECK (verification_score >= 0 AND verification_score <= 100),
  CONSTRAINT chk_booking_history_score CHECK (booking_history_score >= 0 AND booking_history_score <= 100),
  CONSTRAINT chk_payment_reliability_score CHECK (payment_reliability_score >= 0 AND payment_reliability_score <= 100),
  CONSTRAINT chk_vehicle_care_score CHECK (vehicle_care_score >= 0 AND vehicle_care_score <= 100),
  CONSTRAINT chk_communication_score CHECK (communication_score >= 0 AND communication_score <= 100),
  CONSTRAINT chk_cancellation_rate_score CHECK (cancellation_rate_score >= 0 AND cancellation_rate_score <= 100),
  CONSTRAINT chk_account_age_score CHECK (account_age_score >= 0 AND account_age_score <= 100),
  CONSTRAINT chk_expires_after_calculated CHECK (expires_at > calculated_at),
  
  INDEX idx_user_id (user_id) COMMENT 'Fast lookup by user',
  INDEX idx_overall_score (overall_score) COMMENT 'For leaderboard queries',
  INDEX idx_expires_at (expires_at) COMMENT 'For cache cleanup',
  INDEX idx_calculated_at (calculated_at) COMMENT 'For temporal queries',
  UNIQUE KEY uk_user_id (user_id) COMMENT 'One active score per user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Current trust scores for users';
```

**Sample Data**:
```sql
INSERT INTO trust_scores VALUES
('550e8400-e29b-41d4-a716-446655440001', '123e4567-e89b-12d3-a456-426614174000', 
 85.50, 4.50, 90.00, 85.00, 95.00, 80.00, 88.00, 90.00, 75.00,
 '2026-02-23 10:30:00', '2026-02-23 11:30:00', 
 '2026-02-23 10:30:00', '2026-02-23 10:30:00');
```

#### 2. trust_score_history

**Purpose**: Track trust score changes over time for trend analysis and auditing

**Table Definition**:
```sql
CREATE TABLE trust_score_history (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID for history record',
  user_id CHAR(36) NOT NULL COMMENT 'Reference to user',
  score DECIMAL(5,2) NOT NULL COMMENT 'Score at this point in time',
  previous_score DECIMAL(5,2) COMMENT 'Previous score before this change',
  change_amount DECIMAL(6,2) COMMENT 'Amount of change (can be negative)',
  event_type VARCHAR(50) COMMENT 'Type of event that triggered change',
  event_description TEXT COMMENT 'Human-readable description of event',
  component_changed VARCHAR(50) COMMENT 'Which component was affected',
  recorded_at DATETIME NOT NULL COMMENT 'When this change occurred',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  
  CONSTRAINT fk_trust_score_history_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_score CHECK (score >= 0 AND score <= 100),
  CONSTRAINT chk_previous_score CHECK (previous_score IS NULL OR (previous_score >= 0 AND previous_score <= 100)),
  
  INDEX idx_user_id (user_id) COMMENT 'Fast lookup by user',
  INDEX idx_recorded_at (recorded_at) COMMENT 'For temporal queries',
  INDEX idx_event_type (event_type) COMMENT 'Filter by event type',
  INDEX idx_user_recorded (user_id, recorded_at) COMMENT 'Composite for user timeline',
  INDEX idx_component_changed (component_changed) COMMENT 'Filter by component'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historical trust score changes';
```

**Sample Data**:
```sql
INSERT INTO trust_score_history VALUES
('660e8400-e29b-41d4-a716-446655440001', '123e4567-e89b-12d3-a456-426614174000',
 85.50, 83.50, 2.00, 'booking_completed', 'Completed booking #1234',
 'Booking History', '2026-02-23 10:30:00', '2026-02-23 10:30:00'),
('660e8400-e29b-41d4-a716-446655440002', '123e4567-e89b-12d3-a456-426614174000',
 83.50, 78.50, 5.00, 'verification_completed', 'Driver license verified',
 'Verification Status', '2026-02-15 14:20:00', '2026-02-15 14:20:00');
```

#### 3. trust_score_components

**Purpose**: Store detailed component metrics and metadata for score calculation

**Table Definition**:
```sql
CREATE TABLE trust_score_components (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID for component record',
  user_id CHAR(36) NOT NULL COMMENT 'Reference to user',
  component_name VARCHAR(50) NOT NULL COMMENT 'Name of score component',
  raw_value DECIMAL(10,2) COMMENT 'Raw metric value (e.g., booking count)',
  calculated_score DECIMAL(5,2) NOT NULL COMMENT 'Calculated score for this component',
  weight DECIMAL(3,2) NOT NULL COMMENT 'Weight in overall score (0-1)',
  status ENUM('excellent', 'good', 'fair', 'poor') NOT NULL COMMENT 'Status category',
  description TEXT COMMENT 'Human-readable description',
  last_updated DATETIME NOT NULL COMMENT 'When component was last updated',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  
  CONSTRAINT fk_trust_score_components_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_calculated_score CHECK (calculated_score >= 0 AND calculated_score <= 100),
  CONSTRAINT chk_weight CHECK (weight >= 0 AND weight <= 1),
  
  INDEX idx_user_id (user_id) COMMENT 'Fast lookup by user',
  INDEX idx_component_name (component_name) COMMENT 'Filter by component',
  INDEX idx_last_updated (last_updated) COMMENT 'For temporal queries',
  INDEX idx_user_component (user_id, component_name) COMMENT 'Composite for user component lookup',
  UNIQUE KEY uk_user_component (user_id, component_name) COMMENT 'One record per user per component'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Detailed component metrics for trust scores';
```

**Sample Data**:
```sql
INSERT INTO trust_score_components VALUES
('770e8400-e29b-41d4-a716-446655440001', '123e4567-e89b-12d3-a456-426614174000',
 'Verification Status', 90.00, 90.00, 0.25, 'excellent',
 'Email, phone, and license verified', '2026-02-20 14:00:00',
 '2026-02-20 14:00:00', '2026-02-20 14:00:00'),
('770e8400-e29b-41d4-a716-446655440002', '123e4567-e89b-12d3-a456-426614174000',
 'Booking History', 15.00, 85.00, 0.20, 'good',
 '15 completed bookings', '2026-02-23 10:30:00',
 '2026-02-23 10:30:00', '2026-02-23 10:30:00');
```

#### 4. improvement_tips

**Purpose**: Store generated improvement recommendations for users

**Table Definition**:
```sql
CREATE TABLE improvement_tips (
  id CHAR(36) PRIMARY KEY COMMENT 'UUID for tip record',
  user_id CHAR(36) NOT NULL COMMENT 'Reference to user',
  title VARCHAR(255) NOT NULL COMMENT 'Tip title',
  description TEXT NOT NULL COMMENT 'Detailed description',
  estimated_impact DECIMAL(5,2) NOT NULL COMMENT 'Estimated score increase',
  priority ENUM('high', 'medium', 'low') NOT NULL COMMENT 'Priority level',
  action_url VARCHAR(500) COMMENT 'URL to take action',
  action_label VARCHAR(100) COMMENT 'Label for action button',
  category VARCHAR(50) NOT NULL COMMENT 'Tip category (verification, behavior, etc.)',
  status ENUM('active', 'completed', 'dismissed') DEFAULT 'active' COMMENT 'Tip status',
  completed_at DATETIME COMMENT 'When tip was completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  
  CONSTRAINT fk_improvement_tips_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_estimated_impact CHECK (estimated_impact >= 0 AND estimated_impact <= 100),
  
  INDEX idx_user_id (user_id) COMMENT 'Fast lookup by user',
  INDEX idx_status (status) COMMENT 'Filter by status',
  INDEX idx_priority (priority) COMMENT 'Filter by priority',
  INDEX idx_category (category) COMMENT 'Filter by category',
  INDEX idx_user_status (user_id, status) COMMENT 'Composite for active tips',
  INDEX idx_created_at (created_at) COMMENT 'For temporal queries'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Improvement recommendations for users';
```

**Sample Data**:
```sql
INSERT INTO improvement_tips VALUES
('880e8400-e29b-41d4-a716-446655440001', '123e4567-e89b-12d3-a456-426614174000',
 'Complete Enhanced Verification', 
 'Complete KYC verification to increase your score by up to 10 points and access premium vehicles',
 10.00, 'high', '/account/verification/kyc', 'Start Verification',
 'verification', 'active', NULL,
 '2026-02-20 10:00:00', '2026-02-20 10:00:00');
```

### Table Modifications

#### users table

Add trust score reference fields for quick access:

```sql
ALTER TABLE users
ADD COLUMN current_trust_score DECIMAL(5,2) DEFAULT 0.00 
  COMMENT 'Cached current trust score for quick access',
ADD COLUMN trust_score_updated_at DATETIME 
  COMMENT 'When trust score was last updated',
ADD INDEX idx_trust_score (current_trust_score) 
  COMMENT 'For leaderboard and filtering';
```

**Migration Script**:
```sql
-- Add columns
ALTER TABLE users
ADD COLUMN current_trust_score DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN trust_score_updated_at DATETIME;

-- Backfill existing users with default score
UPDATE users SET current_trust_score = 0.00 WHERE current_trust_score IS NULL;

-- Add index
ALTER TABLE users ADD INDEX idx_trust_score (current_trust_score);
```

## Relationships

### Entity Relationship Diagram

```
users (1) ----< (M) trust_scores
users (1) ----< (M) trust_score_history
users (1) ----< (M) trust_score_components
users (1) ----< (M) improvement_tips
```

### Foreign Key Relationships

1. **trust_scores.user_id → users.id**
   - Type: Many-to-One (One active score per user)
   - On Delete: CASCADE (delete score when user deleted)
   - Constraint: UNIQUE on user_id

2. **trust_score_history.user_id → users.id**
   - Type: Many-to-One (Multiple history records per user)
   - On Delete: CASCADE (delete history when user deleted)

3. **trust_score_components.user_id → users.id**
   - Type: Many-to-One (Multiple components per user)
   - On Delete: CASCADE (delete components when user deleted)
   - Constraint: UNIQUE on (user_id, component_name)

4. **improvement_tips.user_id → users.id**
   - Type: Many-to-One (Multiple tips per user)
   - On Delete: CASCADE (delete tips when user deleted)

## Indexes

### Primary Indexes

All tables have primary key indexes on `id` column (UUID).

### Secondary Indexes

#### trust_scores table
- `idx_user_id`: Fast lookup by user (most common query)
- `idx_overall_score`: For leaderboard queries and filtering
- `idx_expires_at`: For cache cleanup jobs
- `idx_calculated_at`: For temporal queries
- `uk_user_id`: Unique constraint ensuring one active score per user

#### trust_score_history table
- `idx_user_id`: Fast lookup by user
- `idx_recorded_at`: For temporal queries and date range filters
- `idx_event_type`: Filter by event type
- `idx_user_recorded`: Composite index for user timeline queries (most common)
- `idx_component_changed`: Filter by component

#### trust_score_components table
- `idx_user_id`: Fast lookup by user
- `idx_component_name`: Filter by component
- `idx_last_updated`: For temporal queries
- `idx_user_component`: Composite index for user component lookup (most common)
- `uk_user_component`: Unique constraint ensuring one record per user per component

#### improvement_tips table
- `idx_user_id`: Fast lookup by user
- `idx_status`: Filter by status (active, completed, dismissed)
- `idx_priority`: Filter by priority
- `idx_category`: Filter by category
- `idx_user_status`: Composite index for active tips query (most common)
- `idx_created_at`: For temporal queries

### Index Usage Patterns

**Common Queries**:
1. Get user's current score: Uses `trust_scores.idx_user_id`
2. Get user's score history: Uses `trust_score_history.idx_user_recorded`
3. Get active improvement tips: Uses `improvement_tips.idx_user_status`
4. Get component breakdown: Uses `trust_score_components.idx_user_component`
5. Leaderboard query: Uses `trust_scores.idx_overall_score`

## Data Integrity

### Constraints

#### Check Constraints

1. **Score Range Validation**:
   - All score columns must be between 0 and 100
   - Display rating must be between 0 and 5
   - Component weights must be between 0 and 1

2. **Temporal Validation**:
   - `expires_at` must be greater than `calculated_at`
   - `completed_at` must be after `created_at` (for improvement tips)

3. **Status Validation**:
   - Status fields use ENUM to restrict valid values
   - Priority fields use ENUM to restrict valid values

#### Unique Constraints

1. **trust_scores.user_id**: One active score per user
2. **trust_score_components(user_id, component_name)**: One record per user per component

### Triggers

#### Update users.current_trust_score on trust_scores change

```sql
DELIMITER //

CREATE TRIGGER trg_trust_scores_after_insert
AFTER INSERT ON trust_scores
FOR EACH ROW
BEGIN
  UPDATE users 
  SET current_trust_score = NEW.overall_score,
      trust_score_updated_at = NEW.calculated_at
  WHERE id = NEW.user_id;
END//

CREATE TRIGGER trg_trust_scores_after_update
AFTER UPDATE ON trust_scores
FOR EACH ROW
BEGIN
  UPDATE users 
  SET current_trust_score = NEW.overall_score,
      trust_score_updated_at = NEW.calculated_at
  WHERE id = NEW.user_id;
END//

DELIMITER ;
```

#### Create history entry on trust score change

```sql
DELIMITER //

CREATE TRIGGER trg_trust_scores_history
AFTER UPDATE ON trust_scores
FOR EACH ROW
BEGIN
  IF NEW.overall_score != OLD.overall_score THEN
    INSERT INTO trust_score_history (
      id, user_id, score, previous_score, change_amount,
      event_type, event_description, recorded_at
    ) VALUES (
      UUID(), NEW.user_id, NEW.overall_score, OLD.overall_score,
      NEW.overall_score - OLD.overall_score,
      'score_updated', 'Trust score recalculated',
      NEW.calculated_at
    );
  END IF;
END//

DELIMITER ;
```

#### Validate component weights sum to 1.0

```sql
DELIMITER //

CREATE TRIGGER trg_validate_component_weights
BEFORE INSERT ON trust_score_components
FOR EACH ROW
BEGIN
  DECLARE total_weight DECIMAL(3,2);
  
  SELECT SUM(weight) INTO total_weight
  FROM trust_score_components
  WHERE user_id = NEW.user_id
    AND component_name != NEW.component_name;
  
  IF total_weight + NEW.weight > 1.01 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Component weights exceed 1.0';
  END IF;
END//

DELIMITER ;
```

## Query Optimization

### Common Query Patterns

#### 1. Get User's Current Trust Score

```sql
SELECT 
  ts.overall_score,
  ts.display_rating,
  ts.calculated_at,
  ts.verification_score,
  ts.booking_history_score,
  ts.payment_reliability_score,
  ts.vehicle_care_score,
  ts.communication_score,
  ts.cancellation_rate_score,
  ts.account_age_score
FROM trust_scores ts
WHERE ts.user_id = ?
  AND ts.expires_at > NOW();
```

**Optimization**: Uses `idx_user_id` index, very fast lookup.

#### 2. Get User's Score History

```sql
SELECT 
  tsh.score,
  tsh.previous_score,
  tsh.change_amount,
  tsh.event_type,
  tsh.event_description,
  tsh.component_changed,
  tsh.recorded_at
FROM trust_score_history tsh
WHERE tsh.user_id = ?
  AND tsh.recorded_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
ORDER BY tsh.recorded_at DESC
LIMIT 100;
```

**Optimization**: Uses `idx_user_recorded` composite index for efficient filtering and sorting.

#### 3. Get Component Breakdown

```sql
SELECT 
  tsc.component_name,
  tsc.calculated_score,
  tsc.weight,
  tsc.status,
  tsc.description,
  tsc.last_updated
FROM trust_score_components tsc
WHERE tsc.user_id = ?
ORDER BY tsc.weight DESC;
```

**Optimization**: Uses `idx_user_component` index, returns all components in one query.

#### 4. Get Active Improvement Tips

```sql
SELECT 
  it.id,
  it.title,
  it.description,
  it.estimated_impact,
  it.priority,
  it.action_url,
  it.action_label,
  it.category
FROM improvement_tips it
WHERE it.user_id = ?
  AND it.status = 'active'
ORDER BY 
  FIELD(it.priority, 'high', 'medium', 'low'),
  it.estimated_impact DESC;
```

**Optimization**: Uses `idx_user_status` composite index for efficient filtering.

#### 5. Leaderboard Query

```sql
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.current_trust_score,
  ts.display_rating
FROM users u
INNER JOIN trust_scores ts ON u.id = ts.user_id
WHERE u.current_trust_score > 0
ORDER BY u.current_trust_score DESC
LIMIT 100;
```

**Optimization**: Uses `users.idx_trust_score` index for efficient sorting.

### Database Views

#### v_user_trust_scores

Simplified view for common trust score queries:

```sql
CREATE VIEW v_user_trust_scores AS
SELECT 
  u.id AS user_id,
  u.first_name,
  u.last_name,
  u.email,
  ts.overall_score,
  ts.display_rating,
  ts.calculated_at,
  ts.expires_at,
  CASE 
    WHEN ts.overall_score >= 90 THEN 'Excellent'
    WHEN ts.overall_score >= 75 THEN 'Good'
    WHEN ts.overall_score >= 50 THEN 'Fair'
    ELSE 'Poor'
  END AS score_category
FROM users u
LEFT JOIN trust_scores ts ON u.id = ts.user_id;
```

#### v_trust_score_trends

View for analyzing score trends:

```sql
CREATE VIEW v_trust_score_trends AS
SELECT 
  tsh.user_id,
  DATE(tsh.recorded_at) AS date,
  AVG(tsh.score) AS avg_score,
  MIN(tsh.score) AS min_score,
  MAX(tsh.score) AS max_score,
  COUNT(*) AS change_count
FROM trust_score_history tsh
WHERE tsh.recorded_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
GROUP BY tsh.user_id, DATE(tsh.recorded_at);
```

## Migration Strategy

### Phase 1: Create Tables

```sql
-- Create tables in dependency order
CREATE TABLE trust_scores (...);
CREATE TABLE trust_score_history (...);
CREATE TABLE trust_score_components (...);
CREATE TABLE improvement_tips (...);
```

### Phase 2: Modify Existing Tables

```sql
-- Add columns to users table
ALTER TABLE users
ADD COLUMN current_trust_score DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN trust_score_updated_at DATETIME;
```

### Phase 3: Create Indexes

```sql
-- Create indexes after table creation for better performance
CREATE INDEX idx_user_id ON trust_scores(user_id);
CREATE INDEX idx_overall_score ON trust_scores(overall_score);
-- ... (all other indexes)
```

### Phase 4: Create Triggers

```sql
-- Create triggers for automatic updates
CREATE TRIGGER trg_trust_scores_after_insert ...;
CREATE TRIGGER trg_trust_scores_after_update ...;
CREATE TRIGGER trg_trust_scores_history ...;
```

### Phase 5: Backfill Data

```sql
-- Calculate initial trust scores for existing users
INSERT INTO trust_scores (id, user_id, overall_score, ...)
SELECT 
  UUID(),
  u.id,
  0.00, -- Initial score
  ...
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM trust_scores ts WHERE ts.user_id = u.id
);
```

### Phase 6: Create Views

```sql
-- Create views for common queries
CREATE VIEW v_user_trust_scores AS ...;
CREATE VIEW v_trust_score_trends AS ...;
```

## Performance Considerations

### Partitioning Strategy

For large datasets, partition `trust_score_history` by date:

```sql
ALTER TABLE trust_score_history
PARTITION BY RANGE (YEAR(recorded_at)) (
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p2026 VALUES LESS THAN (2027),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### Archival Strategy

Archive old history records to separate table:

```sql
-- Create archive table
CREATE TABLE trust_score_history_archive LIKE trust_score_history;

-- Move records older than 2 years
INSERT INTO trust_score_history_archive
SELECT * FROM trust_score_history
WHERE recorded_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);

DELETE FROM trust_score_history
WHERE recorded_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);
```

### Query Performance Monitoring

Monitor slow queries and add indexes as needed:

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- Analyze query performance
EXPLAIN SELECT ... FROM trust_scores WHERE ...;
```

## Data Retention

### Retention Policies

- **trust_scores**: Keep current score only (1 record per user)
- **trust_score_history**: Keep 2 years of history, archive older records
- **trust_score_components**: Keep current components only
- **improvement_tips**: Keep active and completed tips for 1 year, delete dismissed tips after 30 days

### Cleanup Jobs

```sql
-- Delete expired trust scores (should be rare, handled by recalculation)
DELETE FROM trust_scores WHERE expires_at < DATE_SUB(NOW(), INTERVAL 1 DAY);

-- Archive old history records
INSERT INTO trust_score_history_archive
SELECT * FROM trust_score_history
WHERE recorded_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);

DELETE FROM trust_score_history
WHERE recorded_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);

-- Delete old dismissed tips
DELETE FROM improvement_tips
WHERE status = 'dismissed'
  AND updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## Technology Stack

- **Database**: MySQL 8.0+
- **Storage Engine**: InnoDB (supports transactions, foreign keys, row-level locking)
- **Character Set**: utf8mb4 (full Unicode support)
- **Collation**: utf8mb4_unicode_ci (case-insensitive, accent-sensitive)

## Implementation Notes

### Data Consistency

- Use transactions for multi-table updates
- Implement optimistic locking for concurrent updates
- Use foreign key constraints to maintain referential integrity
- Validate data at application layer before database insert

### Backup Strategy

- Daily full backups of all trust score tables
- Point-in-time recovery enabled
- Test restore procedures regularly
- Replicate to secondary database for high availability

### Monitoring

- Monitor table sizes and growth rates
- Track query performance and slow queries
- Alert on constraint violations
- Monitor index usage and optimize unused indexes

### Security

- Encrypt sensitive data at rest
- Use parameterized queries to prevent SQL injection
- Implement row-level security for multi-tenant scenarios
- Audit access to trust score data
