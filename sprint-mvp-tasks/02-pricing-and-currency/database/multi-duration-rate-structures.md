# Feature: Multi-Duration Rate Structures

## Overview

Database schema supporting flexible multi-duration pricing with hourly, daily, weekly, bi-weekly, and monthly rates. Includes rate history tracking, validation constraints, and optimized indexes for fast rate lookups during search and booking operations.

## Sprint Category

sprint-mvp (MVP - Must have for first release)

## Feature ID

Pricing-Management-1.1

## User Stories

### As a database
I want to store multiple rate types per vehicle, so that the pricing engine can select the optimal rate for any duration.

### As a data integrity system
I want to enforce rate validation rules, so that invalid pricing configurations are prevented.

### As an audit system
I want to track all rate changes, so that pricing history is preserved for analysis and compliance.

## Database Specifications

### Schema Changes

**New Tables**:
- `VehicleRates` - Multi-duration rate structures
- `RateHistory` - Historical rate changes
- `RateTemplates` - Reusable rate templates

### Table Definitions

**VehicleRates Table**:
```sql
CREATE TABLE VehicleRates (
  RateId CHAR(36) PRIMARY KEY,
  VehicleId CHAR(36) NOT NULL,
  SupplierId CHAR(36) NOT NULL,
  HourlyRate DECIMAL(10,2) NULL COMMENT 'Rate per hour (1-23 hours)',
  DailyRate DECIMAL(10,2) NOT NULL COMMENT 'Rate per day (required)',
  WeeklyRate DECIMAL(10,2) NULL COMMENT 'Rate per week (7 days)',
  BiWeeklyRate DECIMAL(10,2) NULL COMMENT 'Rate per 2 weeks (14 days)',
  MonthlyRate DECIMAL(10,2) NULL COMMENT 'Rate per month (30 days)',
  MinimumDuration INT NOT NULL DEFAULT 1 COMMENT 'Minimum rental duration in hours',
  MaximumDuration INT NOT NULL DEFAULT 90 COMMENT 'Maximum rental duration in days',
  Currency CHAR(3) NOT NULL DEFAULT 'USD',
  EffectiveDate DATE NOT NULL COMMENT 'When this rate becomes active',
  ExpirationDate DATE NULL COMMENT 'When this rate expires (NULL = no expiration)',
  IsActive BOOLEAN DEFAULT TRUE,
  CreatedBy CHAR(36) NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (VehicleId) REFERENCES Vehicles(VehicleId) ON DELETE CASCADE,
  FOREIGN KEY (SupplierId) REFERENCES Suppliers(SupplierId) ON DELETE CASCADE,
  FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
  
  INDEX idx_vehicle_active (VehicleId, IsActive, EffectiveDate DESC),
  INDEX idx_supplier_active (SupplierId, IsActive),
  INDEX idx_effective_dates (EffectiveDate, ExpirationDate),
  INDEX idx_active_effective (IsActive, EffectiveDate),
  
  CONSTRAINT chk_daily_positive CHECK (DailyRate > 0),
  CONSTRAINT chk_weekly_discount CHECK (WeeklyRate IS NULL OR WeeklyRate < (DailyRate * 7)),
  CONSTRAINT chk_biweekly_discount CHECK (BiWeeklyRate IS NULL OR BiWeeklyRate < (DailyRate * 14)),
  CONSTRAINT chk_monthly_discount CHECK (MonthlyRate IS NULL OR MonthlyRate < (DailyRate * 30)),
  CONSTRAINT chk_hourly_daily CHECK (HourlyRate IS NULL OR (HourlyRate * 24) >= DailyRate),
  CONSTRAINT chk_duration_range CHECK (MinimumDuration >= 1 AND MaximumDuration <= 365),
  CONSTRAINT chk_date_range CHECK (ExpirationDate IS NULL OR ExpirationDate > EffectiveDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**RateHistory Table**:
```sql
CREATE TABLE RateHistory (
  HistoryId CHAR(36) PRIMARY KEY,
  RateId CHAR(36) NOT NULL,
  VehicleId CHAR(36) NOT NULL,
  ChangeType ENUM('created', 'updated', 'expired', 'deleted') NOT NULL,
  PreviousRates JSON NULL COMMENT 'Previous rate values before change',
  NewRates JSON NOT NULL COMMENT 'New rate values after change',
  ChangedBy CHAR(36) NOT NULL,
  ChangeReason VARCHAR(500) NULL COMMENT 'Optional reason for change',
  ChangedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (RateId) REFERENCES VehicleRates(RateId) ON DELETE CASCADE,
  FOREIGN KEY (VehicleId) REFERENCES Vehicles(VehicleId) ON DELETE CASCADE,
  FOREIGN KEY (ChangedBy) REFERENCES Users(UserId),
  
  INDEX idx_vehicle_changed (VehicleId, ChangedAt DESC),
  INDEX idx_rate_history (RateId, ChangedAt DESC),
  INDEX idx_changed_by (ChangedBy, ChangedAt DESC),
  INDEX idx_change_type (ChangeType, ChangedAt DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**RateTemplates Table**:
```sql
CREATE TABLE RateTemplates (
  TemplateId CHAR(36) PRIMARY KEY,
  SupplierId CHAR(36) NOT NULL,
  TemplateName VARCHAR(100) NOT NULL,
  Description VARCHAR(500) NULL,
  VehicleCategory VARCHAR(50) NULL COMMENT 'Economy, Luxury, SUV, etc.',
  HourlyRate DECIMAL(10,2) NULL,
  DailyRate DECIMAL(10,2) NOT NULL,
  WeeklyRate DECIMAL(10,2) NULL,
  BiWeeklyRate DECIMAL(10,2) NULL,
  MonthlyRate DECIMAL(10,2) NULL,
  MinimumDuration INT NOT NULL DEFAULT 1,
  MaximumDuration INT NOT NULL DEFAULT 90,
  Currency CHAR(3) NOT NULL DEFAULT 'USD',
  IsActive BOOLEAN DEFAULT TRUE,
  CreatedBy CHAR(36) NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (SupplierId) REFERENCES Suppliers(SupplierId) ON DELETE CASCADE,
  FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
  
  INDEX idx_supplier_active (SupplierId, IsActive),
  INDEX idx_category (VehicleCategory),
  
  CONSTRAINT chk_template_daily_positive CHECK (DailyRate > 0),
  CONSTRAINT chk_template_weekly CHECK (WeeklyRate IS NULL OR WeeklyRate < (DailyRate * 7)),
  CONSTRAINT chk_template_monthly CHECK (MonthlyRate IS NULL OR MonthlyRate < (DailyRate * 30))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

**VehicleRates Relationships**:
- `VehicleRates.VehicleId` → `Vehicles.VehicleId` (Many-to-One, CASCADE DELETE)
- `VehicleRates.SupplierId` → `Suppliers.SupplierId` (Many-to-One, CASCADE DELETE)
- `VehicleRates.CreatedBy` → `Users.UserId` (Many-to-One)

**RateHistory Relationships**:
- `RateHistory.RateId` → `VehicleRates.RateId` (Many-to-One, CASCADE DELETE)
- `RateHistory.VehicleId` → `Vehicles.VehicleId` (Many-to-One, CASCADE DELETE)
- `RateHistory.ChangedBy` → `Users.UserId` (Many-to-One)

**RateTemplates Relationships**:
- `RateTemplates.SupplierId` → `Suppliers.SupplierId` (Many-to-One, CASCADE DELETE)
- `RateTemplates.CreatedBy` → `Users.UserId` (Many-to-One)

### Indexes

**Performance Indexes**:
- `idx_vehicle_active` on `VehicleRates(VehicleId, IsActive, EffectiveDate DESC)` - Fast active rate lookup
- `idx_supplier_active` on `VehicleRates(SupplierId, IsActive)` - Supplier rate management
- `idx_effective_dates` on `VehicleRates(EffectiveDate, ExpirationDate)` - Date-based queries
- `idx_active_effective` on `VehicleRates(IsActive, EffectiveDate)` - Active rate queries

**History Indexes**:
- `idx_vehicle_changed` on `RateHistory(VehicleId, ChangedAt DESC)` - Vehicle rate history
- `idx_rate_history` on `RateHistory(RateId, ChangedAt DESC)` - Rate change timeline
- `idx_changed_by` on `RateHistory(ChangedBy, ChangedAt DESC)` - User audit trail

**Template Indexes**:
- `idx_supplier_active` on `RateTemplates(SupplierId, IsActive)` - Template lookup
- `idx_category` on `RateTemplates(VehicleCategory)` - Category-based templates

### Data Integrity Constraints

**Check Constraints**:
- `chk_daily_positive`: Ensures daily rate is positive
- `chk_weekly_discount`: Ensures weekly rate provides discount vs daily
- `chk_biweekly_discount`: Ensures bi-weekly rate provides discount vs daily
- `chk_monthly_discount`: Ensures monthly rate provides discount vs daily
- `chk_hourly_daily`: Prevents hourly rate abuse (24 hours should cost >= 1 day)
- `chk_duration_range`: Ensures valid duration constraints
- `chk_date_range`: Ensures expiration date is after effective date

**Foreign Key Constraints**:
- CASCADE DELETE on vehicle deletion (rates deleted with vehicle)
- CASCADE DELETE on supplier deletion (rates deleted with supplier)
- Preserve user reference for audit trail

### Sample Data

**Economy Vehicle Rates**:
```sql
INSERT INTO VehicleRates (RateId, VehicleId, SupplierId, HourlyRate, DailyRate, WeeklyRate, BiWeeklyRate, MonthlyRate, Currency, EffectiveDate, CreatedBy)
VALUES 
  ('rate-001', 'vehicle-001', 'supplier-001', 12.00, 50.00, 300.00, 550.00, 1200.00, 'USD', '2026-01-01', 'admin-001');
```

**Luxury Vehicle Rates**:
```sql
INSERT INTO VehicleRates (RateId, VehicleId, SupplierId, HourlyRate, DailyRate, WeeklyRate, BiWeeklyRate, MonthlyRate, Currency, EffectiveDate, CreatedBy)
VALUES 
  ('rate-002', 'vehicle-002', 'supplier-001', 50.00, 250.00, 1500.00, 2800.00, 6000.00, 'USD', '2026-01-01', 'admin-001');
```

### Migration Scripts

**Initial Migration**:
```sql
-- Create VehicleRates table
CREATE TABLE VehicleRates (...);

-- Create RateHistory table
CREATE TABLE RateHistory (...);

-- Create RateTemplates table
CREATE TABLE RateTemplates (...);

-- Create indexes
CREATE INDEX idx_vehicle_active ON VehicleRates(VehicleId, IsActive, EffectiveDate DESC);
-- ... additional indexes

-- Migrate existing pricing data if applicable
INSERT INTO VehicleRates (RateId, VehicleId, SupplierId, DailyRate, Currency, EffectiveDate, CreatedBy)
SELECT 
  UUID() as RateId,
  VehicleId,
  SupplierId,
  Price as DailyRate,
  'USD' as Currency,
  CURDATE() as EffectiveDate,
  'system' as CreatedBy
FROM Vehicles
WHERE Price IS NOT NULL;
```

## Technology Stack

- Database: MySQL 8.0+
- ORM: Entity Framework Core
- Migration Tool: EF Core Migrations

## Implementation Notes

**Query Optimization**:
- Use covering indexes where possible
- Avoid SELECT * queries
- Use appropriate JOIN types
- Limit result sets with pagination
- Use query hints for complex queries

**Data Consistency**:
- Use transactions for rate updates
- Implement optimistic concurrency control
- Handle concurrent rate updates gracefully
- Validate data integrity on writes

**Backup and Recovery**:
- Include rate tables in regular backups
- Test rate data restoration
- Maintain rate history for audit compliance
- Archive old rate history periodically

**Monitoring**:
- Monitor rate query performance
- Alert on slow queries
- Track rate update frequency
- Monitor cache hit rates

