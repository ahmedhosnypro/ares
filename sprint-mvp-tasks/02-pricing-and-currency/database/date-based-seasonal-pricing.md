# Feature: Date-Based Seasonal Pricing

## Overview

Database schema for time-based pricing rules with support for seasonal rates, event-based pricing, holiday premiums, weekday/weekend differentiation, and advance booking discounts. Includes rule priority system, conflict detection, and comprehensive audit trail.

## Sprint Category

sprint-mvp (MVP - Must have for first release)

## Feature ID

Pricing-Management-2.1

## User Stories

### As a database
I want to store seasonal pricing rules with date ranges, so that prices can vary by time period.

### As a rule engine
I want to efficiently query applicable rules for any date, so that price calculations are fast.

### As an audit system
I want to track all seasonal rule changes, so that pricing decisions are traceable.

## Database Specifications

### Schema Changes

**New Tables**:
- `SeasonalPricingRules` - Date-based pricing rules
- `PricingEvents` - External events affecting pricing
- `Holidays` - Holiday calendar
- `AdvanceBookingDiscounts` - Early booking discount tiers
- `SeasonalRuleHistory` - Rule change audit trail

### Table Definitions

**SeasonalPricingRules Table**:
```sql
CREATE TABLE SeasonalPricingRules (
  RuleId CHAR(36) PRIMARY KEY,
  SupplierId CHAR(36) NOT NULL,
  RuleName VARCHAR(100) NOT NULL,
  Description VARCHAR(500) NULL,
  StartDate DATE NOT NULL,
  EndDate DATE NOT NULL,
  PriceMultiplier DECIMAL(5,2) NOT NULL COMMENT 'Price adjustment multiplier',
  DaysOfWeek VARCHAR(50) NULL COMMENT 'Comma-separated: Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  VehicleCategories JSON NULL COMMENT 'Array of applicable categories',
  LocationIds JSON NULL COMMENT 'Array of applicable location IDs',
  Priority INT NOT NULL DEFAULT 5 COMMENT '1-10, higher = more important',
  IsRecurring BOOLEAN DEFAULT FALSE,
  RecurrencePattern ENUM('yearly', 'monthly', 'weekly') NULL,
  EventId VARCHAR(100) NULL COMMENT 'External event ID if event-based',
  IsActive BOOLEAN DEFAULT TRUE,
  CreatedBy CHAR(36) NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (SupplierId) REFERENCES Suppliers(SupplierId) ON DELETE CASCADE,
  FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
  
  INDEX idx_supplier_active (SupplierId, IsActive),
  INDEX idx_date_range (StartDate, EndDate),
  INDEX idx_priority (Priority DESC),
  INDEX idx_active_dates (IsActive, StartDate, EndDate),
  INDEX idx_event (EventId),
  
  CONSTRAINT chk_date_range CHECK (EndDate >= StartDate),
  CONSTRAINT chk_multiplier_range CHECK (PriceMultiplier BETWEEN 0.5 AND 2.0),
  CONSTRAINT chk_priority_range CHECK (Priority BETWEEN 1 AND 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PricingEvents Table**:
```sql
CREATE TABLE PricingEvents (
  EventId CHAR(36) PRIMARY KEY,
  ExternalEventId VARCHAR(100) NOT NULL COMMENT 'ID from event API',
  EventName VARCHAR(255) NOT NULL,
  EventType VARCHAR(50) NOT NULL COMMENT 'concert, conference, sports, festival, holiday',
  Venue VARCHAR(255) NULL,
  Latitude DECIMAL(10,8) NOT NULL,
  Longitude DECIMAL(11,8) NOT NULL,
  StartDate DATETIME NOT NULL,
  EndDate DATETIME NOT NULL,
  ExpectedAttendance INT NULL,
  ImpactRadius DECIMAL(5,2) NOT NULL DEFAULT 10.0 COMMENT 'Miles',
  SuggestedMultiplier DECIMAL(5,2) NULL,
  Source VARCHAR(100) NULL COMMENT 'API source or manual',
  IsActive BOOLEAN DEFAULT TRUE,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_external_event (ExternalEventId),
  INDEX idx_dates (StartDate, EndDate),
  INDEX idx_location (Latitude, Longitude),
  INDEX idx_active_dates (IsActive, StartDate, EndDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Holidays Table**:
```sql
CREATE TABLE Holidays (
  HolidayId CHAR(36) PRIMARY KEY,
  HolidayName VARCHAR(100) NOT NULL,
  Date DATE NOT NULL,
  Country CHAR(2) NOT NULL COMMENT 'ISO country code',
  Region VARCHAR(50) NULL COMMENT 'State/province if regional',
  IsNational BOOLEAN DEFAULT TRUE,
  PriceMultiplier DECIMAL(5,2) NOT NULL DEFAULT 1.30 COMMENT 'Default 30% premium',
  IsActive BOOLEAN DEFAULT TRUE,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_date_country (Date, Country),
  INDEX idx_active_date (IsActive, Date),
  UNIQUE KEY uk_holiday_date_country (HolidayName, Date, Country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**AdvanceBookingDiscounts Table**:
```sql
CREATE TABLE AdvanceBookingDiscounts (
  DiscountId CHAR(36) PRIMARY KEY,
  SupplierId CHAR(36) NOT NULL,
  DaysInAdvance INT NOT NULL COMMENT 'Minimum days before rental',
  DiscountPercentage DECIMAL(5,4) NOT NULL COMMENT 'e.g., 0.15 for 15%',
  MinimumDuration INT NULL COMMENT 'Minimum rental hours (optional)',
  MaximumDuration INT NULL COMMENT 'Maximum rental hours (optional)',
  ExcludedDates JSON NULL COMMENT 'Array of excluded date ranges',
  IsActive BOOLEAN DEFAULT TRUE,
  CreatedBy CHAR(36) NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (SupplierId) REFERENCES Suppliers(SupplierId) ON DELETE CASCADE,
  FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
  
  INDEX idx_supplier_active (SupplierId, IsActive),
  INDEX idx_days_advance (DaysInAdvance DESC),
  UNIQUE KEY uk_supplier_days (SupplierId, DaysInAdvance),
  
  CONSTRAINT chk_days_positive CHECK (DaysInAdvance > 0),
  CONSTRAINT chk_discount_range CHECK (DiscountPercentage BETWEEN 0 AND 0.50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**SeasonalRuleHistory Table**:
```sql
CREATE TABLE SeasonalRuleHistory (
  HistoryId CHAR(36) PRIMARY KEY,
  RuleId CHAR(36) NOT NULL,
  ChangeType ENUM('created', 'updated', 'activated', 'deactivated', 'deleted') NOT NULL,
  PreviousValues JSON NULL,
  NewValues JSON NOT NULL,
  ChangedBy CHAR(36) NOT NULL,
  ChangeReason VARCHAR(500) NULL,
  ChangedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (RuleId) REFERENCES SeasonalPricingRules(RuleId) ON DELETE CASCADE,
  FOREIGN KEY (ChangedBy) REFERENCES Users(UserId),
  
  INDEX idx_rule_changed (RuleId, ChangedAt DESC),
  INDEX idx_changed_by (ChangedBy, ChangedAt DESC),
  INDEX idx_change_type (ChangeType, ChangedAt DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

**SeasonalPricingRules Relationships**:
- `SeasonalPricingRules.SupplierId` → `Suppliers.SupplierId` (Many-to-One, CASCADE DELETE)
- `SeasonalPricingRules.CreatedBy` → `Users.UserId` (Many-to-One)

**AdvanceBookingDiscounts Relationships**:
- `AdvanceBookingDiscounts.SupplierId` → `Suppliers.SupplierId` (Many-to-One, CASCADE DELETE)
- `AdvanceBookingDiscounts.CreatedBy` → `Users.UserId` (Many-to-One)

**SeasonalRuleHistory Relationships**:
- `SeasonalRuleHistory.RuleId` → `SeasonalPricingRules.RuleId` (Many-to-One, CASCADE DELETE)
- `SeasonalRuleHistory.ChangedBy` → `Users.UserId` (Many-to-One)

### Indexes

**Rule Query Indexes**:
- `idx_supplier_active` on `SeasonalPricingRules(SupplierId, IsActive)` - Active rule lookup
- `idx_date_range` on `SeasonalPricingRules(StartDate, EndDate)` - Date range queries
- `idx_priority` on `SeasonalPricingRules(Priority DESC)` - Priority-based sorting
- `idx_active_dates` on `SeasonalPricingRules(IsActive, StartDate, EndDate)` - Combined lookup
- `idx_event` on `SeasonalPricingRules(EventId)` - Event-based rules

**Event Indexes**:
- `uk_external_event` on `PricingEvents(ExternalEventId)` - Prevent duplicate events
- `idx_dates` on `PricingEvents(StartDate, EndDate)` - Date range queries
- `idx_location` on `PricingEvents(Latitude, Longitude)` - Geospatial queries
- `idx_active_dates` on `PricingEvents(IsActive, StartDate, EndDate)` - Active event lookup

**Holiday Indexes**:
- `idx_date_country` on `Holidays(Date, Country)` - Holiday lookup
- `idx_active_date` on `Holidays(IsActive, Date)` - Active holiday queries
- `uk_holiday_date_country` on `Holidays(HolidayName, Date, Country)` - Unique holidays

**Discount Indexes**:
- `idx_supplier_active` on `AdvanceBookingDiscounts(SupplierId, IsActive)` - Active discount lookup
- `idx_days_advance` on `AdvanceBookingDiscounts(DaysInAdvance DESC)` - Tier lookup
- `uk_supplier_days` on `AdvanceBookingDiscounts(SupplierId, DaysInAdvance)` - Unique tiers

### Data Integrity Constraints

**Check Constraints**:
- `chk_date_range`: End date must be >= start date
- `chk_multiplier_range`: Multiplier between 0.5 and 2.0
- `chk_priority_range`: Priority between 1 and 10
- `chk_days_positive`: Days in advance must be positive
- `chk_discount_range`: Discount between 0 and 50%

**Unique Constraints**:
- `uk_external_event`: External event IDs unique
- `uk_holiday_date_country`: Holidays unique per date and country
- `uk_supplier_days`: Advance booking tiers unique per supplier

### Sample Data

**Seasonal Rules**:
```sql
-- Summer peak season
INSERT INTO SeasonalPricingRules (RuleId, SupplierId, RuleName, Description, StartDate, EndDate, PriceMultiplier, Priority, CreatedBy)
VALUES 
  ('rule-001', 'supplier-001', 'Summer Peak', 'Peak summer season pricing', '2026-06-01', '2026-08-31', 1.30, 7, 'admin-001');

-- Winter holiday season
INSERT INTO SeasonalPricingRules (RuleId, SupplierId, RuleName, Description, StartDate, EndDate, PriceMultiplier, Priority, CreatedBy)
VALUES 
  ('rule-002', 'supplier-001', 'Winter Holidays', 'Christmas and New Year pricing', '2026-12-20', '2027-01-05', 1.40, 8, 'admin-001');

-- Weekend premium
INSERT INTO SeasonalPricingRules (RuleId, SupplierId, RuleName, Description, StartDate, EndDate, PriceMultiplier, DaysOfWeek, Priority, IsRecurring, RecurrencePattern, CreatedBy)
VALUES 
  ('rule-003', 'supplier-001', 'Weekend Premium', 'Weekend rate increase', '2026-01-01', '2026-12-31', 1.15, 'Fri,Sat,Sun', 6, TRUE, 'weekly', 'admin-001');
```

**Holidays**:
```sql
INSERT INTO Holidays (HolidayId, HolidayName, Date, Country, IsNational, PriceMultiplier)
VALUES 
  ('holiday-001', 'New Year''s Day', '2026-01-01', 'US', TRUE, 1.40),
  ('holiday-002', 'Independence Day', '2026-07-04', 'US', TRUE, 1.35),
  ('holiday-003', 'Thanksgiving', '2026-11-26', 'US', TRUE, 1.45),
  ('holiday-004', 'Christmas', '2026-12-25', 'US', TRUE, 1.50);
```

**Advance Booking Discounts**:
```sql
INSERT INTO AdvanceBookingDiscounts (DiscountId, SupplierId, DaysInAdvance, DiscountPercentage, CreatedBy)
VALUES 
  ('discount-001', 'supplier-001', 60, 0.20, 'admin-001'),  -- 20% off for 60+ days
  ('discount-002', 'supplier-001', 30, 0.15, 'admin-001'),  -- 15% off for 30-59 days
  ('discount-003', 'supplier-001', 14, 0.10, 'admin-001'),  -- 10% off for 14-29 days
  ('discount-004', 'supplier-001', 7, 0.05, 'admin-001');   -- 5% off for 7-13 days
```

### Query Patterns

**Get Applicable Rules for Date**:
```sql
SELECT * FROM SeasonalPricingRules
WHERE SupplierId = ?
  AND IsActive = TRUE
  AND StartDate <= ?
  AND EndDate >= ?
  AND (DaysOfWeek IS NULL OR FIND_IN_SET(?, DaysOfWeek) > 0)
  AND (VehicleCategories IS NULL OR JSON_CONTAINS(VehicleCategories, JSON_QUOTE(?)))
  AND (LocationIds IS NULL OR JSON_CONTAINS(LocationIds, JSON_QUOTE(?)))
ORDER BY Priority DESC, StartDate DESC
LIMIT 1;
```

**Get Events Near Location**:
```sql
SELECT * FROM PricingEvents
WHERE IsActive = TRUE
  AND StartDate <= DATE_ADD(?, INTERVAL 1 DAY)
  AND EndDate >= DATE_SUB(?, INTERVAL 1 DAY)
  AND (
    6371 * ACOS(
      COS(RADIANS(?)) * COS(RADIANS(Latitude)) *
      COS(RADIANS(Longitude) - RADIANS(?)) +
      SIN(RADIANS(?)) * SIN(RADIANS(Latitude))
    )
  ) <= ImpactRadius;
```

**Get Advance Booking Discount**:
```sql
SELECT * FROM AdvanceBookingDiscounts
WHERE SupplierId = ?
  AND IsActive = TRUE
  AND DaysInAdvance <= ?
  AND (MinimumDuration IS NULL OR ? >= MinimumDuration)
  AND (MaximumDuration IS NULL OR ? <= MaximumDuration)
ORDER BY DaysInAdvance DESC
LIMIT 1;
```

**Check if Holiday**:
```sql
SELECT HolidayName, PriceMultiplier
FROM Holidays
WHERE Date = ?
  AND Country = ?
  AND IsActive = TRUE
LIMIT 1;
```

### Migration Scripts

**Create Seasonal Pricing Tables**:
```sql
-- Create SeasonalPricingRules table
CREATE TABLE SeasonalPricingRules (...);

-- Create PricingEvents table
CREATE TABLE PricingEvents (...);

-- Create Holidays table
CREATE TABLE Holidays (...);

-- Create AdvanceBookingDiscounts table
CREATE TABLE AdvanceBookingDiscounts (...);

-- Create SeasonalRuleHistory table
CREATE TABLE SeasonalRuleHistory (...);

-- Create indexes
CREATE INDEX idx_supplier_active ON SeasonalPricingRules(SupplierId, IsActive);
CREATE INDEX idx_date_range ON SeasonalPricingRules(StartDate, EndDate);
-- ... additional indexes

-- Insert default holidays
INSERT INTO Holidays (HolidayId, HolidayName, Date, Country, IsNational, PriceMultiplier)
VALUES 
  (UUID(), 'New Year''s Day', '2026-01-01', 'US', TRUE, 1.40),
  (UUID(), 'Memorial Day', '2026-05-25', 'US', TRUE, 1.35),
  (UUID(), 'Independence Day', '2026-07-04', 'US', TRUE, 1.35),
  (UUID(), 'Labor Day', '2026-09-07', 'US', TRUE, 1.30),
  (UUID(), 'Thanksgiving', '2026-11-26', 'US', TRUE, 1.45),
  (UUID(), 'Christmas', '2026-12-25', 'US', TRUE, 1.50);
```

**Rollback Migration**:
```sql
DROP TABLE IF EXISTS SeasonalRuleHistory;
DROP TABLE IF EXISTS AdvanceBookingDiscounts;
DROP TABLE IF EXISTS Holidays;
DROP TABLE IF EXISTS PricingEvents;
DROP TABLE IF EXISTS SeasonalPricingRules;
```

## Technology Stack

- Database: MySQL 8.0+
- ORM: Entity Framework Core
- Migration Tool: EF Core Migrations

## Implementation Notes

**Rule Evaluation Performance**:
- Use composite indexes for date range queries
- Cache frequently accessed rules
- Optimize JSON column queries
- Use FIND_IN_SET for day of week checks

**Event Data Management**:
- Daily sync with external event APIs
- Store events up to 90 days in advance
- Archive past events after 30 days
- Maintain event performance history

**Holiday Management**:
- Pre-populate major holidays
- Support custom holiday additions
- Handle regional holidays
- Update annually

**Data Archival**:
- Archive seasonal rules after expiration + 1 year
- Archive event data after event + 90 days
- Maintain rule history for 2 years
- Compress archived data

**Monitoring**:
- Track rule application frequency
- Monitor query performance
- Alert on rule conflicts
- Track seasonal pricing effectiveness

