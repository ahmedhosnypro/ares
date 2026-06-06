# Feature: Location-Based Pricing

## Overview

Database schema for location-specific pricing with support for price multipliers, regional pricing groups, airport premiums, and location pricing history. Enables geographic price differentiation while maintaining data integrity and query performance.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

Pricing-Management-1.3

## User Stories

### As a database
I want to store location-specific pricing multipliers, so that prices can vary by geographic location.

### As a data integrity system
I want to enforce valid multiplier ranges, so that pricing remains within acceptable bounds.

### As a query optimizer
I want efficient indexes for location pricing lookups, so that price calculations are fast.

## Database Specifications

### Schema Changes

**Modified Tables**:
- `Locations` - Add pricing multiplier columns

**New Tables**:
- `PricingRegions` - Regional pricing groups
- `LocationPricingHistory` - Location pricing audit trail

### Table Definitions

**Locations Table Modifications**:
```sql
ALTER TABLE Locations
ADD COLUMN PriceMultiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00 COMMENT 'Location-specific price multiplier (0.5 - 2.0)',
ADD COLUMN AirportPremiumEnabled BOOLEAN DEFAULT FALSE COMMENT 'Whether airport premium is active',
ADD COLUMN AirportPremiumPercentage DECIMAL(5,2) DEFAULT 0.20 COMMENT 'Airport premium percentage (default 20%)',
ADD COLUMN RegionId CHAR(36) NULL COMMENT 'Pricing region assignment',
ADD COLUMN PricingUpdatedAt DATETIME NULL COMMENT 'Last pricing configuration update',
ADD COLUMN PricingUpdatedBy CHAR(36) NULL COMMENT 'User who last updated pricing',
ADD CONSTRAINT chk_multiplier_range CHECK (PriceMultiplier BETWEEN 0.5 AND 2.0),
ADD CONSTRAINT chk_airport_premium_range CHECK (AirportPremiumPercentage BETWEEN 0 AND 1.0),
ADD INDEX idx_region (RegionId),
ADD INDEX idx_price_multiplier (PriceMultiplier),
ADD FOREIGN KEY (RegionId) REFERENCES PricingRegions(RegionId) ON DELETE SET NULL,
ADD FOREIGN KEY (PricingUpdatedBy) REFERENCES Users(UserId) ON DELETE SET NULL;
```

**PricingRegions Table**:
```sql
CREATE TABLE PricingRegions (
  RegionId CHAR(36) PRIMARY KEY,
  SupplierId CHAR(36) NOT NULL,
  RegionName VARCHAR(100) NOT NULL,
  Description VARCHAR(500) NULL,
  PriceMultiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00 COMMENT 'Regional price multiplier',
  IsActive BOOLEAN DEFAULT TRUE,
  CreatedBy CHAR(36) NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (SupplierId) REFERENCES Suppliers(SupplierId) ON DELETE CASCADE,
  FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
  
  INDEX idx_supplier_active (SupplierId, IsActive),
  INDEX idx_multiplier (PriceMultiplier),
  UNIQUE KEY uk_supplier_region (SupplierId, RegionName),
  
  CONSTRAINT chk_region_multiplier_range CHECK (PriceMultiplier BETWEEN 0.5 AND 2.0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**LocationPricingHistory Table**:
```sql
CREATE TABLE LocationPricingHistory (
  HistoryId CHAR(36) PRIMARY KEY,
  LocationId CHAR(36) NOT NULL,
  ChangeType ENUM('multiplier_changed', 'airport_premium_enabled', 'airport_premium_disabled', 'airport_premium_changed', 'region_assigned', 'region_removed', 'region_multiplier_changed') NOT NULL,
  PreviousMultiplier DECIMAL(5,2) NULL,
  NewMultiplier DECIMAL(5,2) NULL,
  PreviousAirportPremium DECIMAL(5,2) NULL,
  NewAirportPremium DECIMAL(5,2) NULL,
  PreviousRegionId CHAR(36) NULL,
  NewRegionId CHAR(36) NULL,
  EffectiveMultiplier DECIMAL(5,2) NULL COMMENT 'Combined multiplier after change',
  ChangedBy CHAR(36) NOT NULL,
  ChangeReason VARCHAR(500) NULL,
  ChangedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (LocationId) REFERENCES Locations(LocationId) ON DELETE CASCADE,
  FOREIGN KEY (PreviousRegionId) REFERENCES PricingRegions(RegionId) ON DELETE SET NULL,
  FOREIGN KEY (NewRegionId) REFERENCES PricingRegions(RegionId) ON DELETE SET NULL,
  FOREIGN KEY (ChangedBy) REFERENCES Users(UserId),
  
  INDEX idx_location_changed (LocationId, ChangedAt DESC),
  INDEX idx_changed_by (ChangedBy, ChangedAt DESC),
  INDEX idx_change_type (ChangeType, ChangedAt DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

**Location Relationships**:
- `Locations.RegionId` → `PricingRegions.RegionId` (Many-to-One, SET NULL on delete)
- `Locations.PricingUpdatedBy` → `Users.UserId` (Many-to-One, SET NULL on delete)

**PricingRegions Relationships**:
- `PricingRegions.SupplierId` → `Suppliers.SupplierId` (Many-to-One, CASCADE DELETE)
- `PricingRegions.CreatedBy` → `Users.UserId` (Many-to-One)

**LocationPricingHistory Relationships**:
- `LocationPricingHistory.LocationId` → `Locations.LocationId` (Many-to-One, CASCADE DELETE)
- `LocationPricingHistory.PreviousRegionId` → `PricingRegions.RegionId` (Many-to-One, SET NULL)
- `LocationPricingHistory.NewRegionId` → `PricingRegions.RegionId` (Many-to-One, SET NULL)
- `LocationPricingHistory.ChangedBy` → `Users.UserId` (Many-to-One)

### Indexes

**Location Indexes**:
- `idx_region` on `Locations(RegionId)` - Regional location queries
- `idx_price_multiplier` on `Locations(PriceMultiplier)` - Multiplier-based queries

**Region Indexes**:
- `idx_supplier_active` on `PricingRegions(SupplierId, IsActive)` - Active region lookup
- `idx_multiplier` on `PricingRegions(PriceMultiplier)` - Multiplier-based queries
- `uk_supplier_region` on `PricingRegions(SupplierId, RegionName)` - Unique region names per supplier

**History Indexes**:
- `idx_location_changed` on `LocationPricingHistory(LocationId, ChangedAt DESC)` - Location history
- `idx_changed_by` on `LocationPricingHistory(ChangedBy, ChangedAt DESC)` - User audit trail
- `idx_change_type` on `LocationPricingHistory(ChangeType, ChangedAt DESC)` - Change type queries

### Data Integrity Constraints

**Check Constraints**:
- `chk_multiplier_range`: Location multiplier between 0.5 and 2.0
- `chk_airport_premium_range`: Airport premium between 0 and 1.0 (0-100%)
- `chk_region_multiplier_range`: Regional multiplier between 0.5 and 2.0

**Unique Constraints**:
- `uk_supplier_region`: Region names unique per supplier

**Foreign Key Constraints**:
- SET NULL on region deletion (preserve location)
- CASCADE DELETE on supplier deletion
- Preserve user references for audit

### Sample Data

**Pricing Regions**:
```sql
INSERT INTO PricingRegions (RegionId, SupplierId, RegionName, Description, PriceMultiplier, CreatedBy)
VALUES 
  ('region-001', 'supplier-001', 'Downtown Metro', 'High-demand downtown locations with premium pricing', 1.15, 'admin-001'),
  ('region-002', 'supplier-001', 'Suburban Standard', 'Standard suburban locations with base pricing', 1.00, 'admin-001'),
  ('region-003', 'supplier-001', 'Airport Cluster', 'All airport locations with premium pricing', 1.25, 'admin-001'),
  ('region-004', 'supplier-001', 'Rural Discount', 'Rural locations with competitive pricing', 0.90, 'admin-001');
```

**Location Pricing Configuration**:
```sql
-- Airport locations with premium
UPDATE Locations 
SET PriceMultiplier = 1.00,
    AirportPremiumEnabled = TRUE,
    AirportPremiumPercentage = 0.20,
    RegionId = 'region-003',
    PricingUpdatedAt = NOW(),
    PricingUpdatedBy = 'admin-001'
WHERE LocationType = 'Airport';

-- Downtown locations with premium
UPDATE Locations 
SET PriceMultiplier = 1.15,
    RegionId = 'region-001',
    PricingUpdatedAt = NOW(),
    PricingUpdatedBy = 'admin-001'
WHERE LocationType = 'Urban' AND City IN ('Downtown', 'City Center');

-- Suburban locations with standard pricing
UPDATE Locations 
SET PriceMultiplier = 1.00,
    RegionId = 'region-002',
    PricingUpdatedAt = NOW(),
    PricingUpdatedBy = 'admin-001'
WHERE LocationType = 'Suburban';

-- Rural locations with discount
UPDATE Locations 
SET PriceMultiplier = 0.90,
    RegionId = 'region-004',
    PricingUpdatedAt = NOW(),
    PricingUpdatedBy = 'admin-001'
WHERE LocationType = 'Rural';
```

### Query Patterns

**Get Effective Multiplier for Location**:
```sql
SELECT 
  l.LocationId,
  l.PriceMultiplier as LocationMultiplier,
  l.AirportPremiumEnabled,
  l.AirportPremiumPercentage,
  pr.PriceMultiplier as RegionalMultiplier,
  (l.PriceMultiplier * COALESCE(pr.PriceMultiplier, 1.0) * 
   IF(l.AirportPremiumEnabled, 1 + l.AirportPremiumPercentage, 1.0)) as EffectiveMultiplier
FROM Locations l
LEFT JOIN PricingRegions pr ON l.RegionId = pr.RegionId AND pr.IsActive = TRUE
WHERE l.LocationId = ?;
```

**Get Locations by Region**:
```sql
SELECT 
  l.LocationId,
  l.Name,
  l.PriceMultiplier,
  l.AirportPremiumEnabled,
  COUNT(v.VehicleId) as VehicleCount
FROM Locations l
LEFT JOIN Vehicles v ON l.LocationId = v.LocationId AND v.IsActive = TRUE
WHERE l.RegionId = ?
GROUP BY l.LocationId, l.Name, l.PriceMultiplier, l.AirportPremiumEnabled;
```

**Compare Location Pricing**:
```sql
SELECT 
  l.LocationId,
  l.Name,
  l.LocationType,
  l.PriceMultiplier,
  pr.RegionName,
  pr.PriceMultiplier as RegionalMultiplier,
  (l.PriceMultiplier * COALESCE(pr.PriceMultiplier, 1.0)) as EffectiveMultiplier,
  COUNT(v.VehicleId) as VehicleCount,
  AVG(vr.DailyRate) as AvgBaseRate,
  AVG(vr.DailyRate * l.PriceMultiplier * COALESCE(pr.PriceMultiplier, 1.0)) as AvgLocationRate
FROM Locations l
LEFT JOIN PricingRegions pr ON l.RegionId = pr.RegionId
LEFT JOIN Vehicles v ON l.LocationId = v.LocationId AND v.IsActive = TRUE
LEFT JOIN VehicleRates vr ON v.VehicleId = vr.VehicleId AND vr.IsActive = TRUE
WHERE l.SupplierId = ?
GROUP BY l.LocationId, l.Name, l.LocationType, l.PriceMultiplier, pr.RegionName, pr.PriceMultiplier
ORDER BY EffectiveMultiplier DESC;
```

### Migration Scripts

**Add Location Pricing Columns**:
```sql
-- Add pricing columns to Locations table
ALTER TABLE Locations
ADD COLUMN PriceMultiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
ADD COLUMN AirportPremiumEnabled BOOLEAN DEFAULT FALSE,
ADD COLUMN AirportPremiumPercentage DECIMAL(5,2) DEFAULT 0.20,
ADD COLUMN RegionId CHAR(36) NULL,
ADD COLUMN PricingUpdatedAt DATETIME NULL,
ADD COLUMN PricingUpdatedBy CHAR(36) NULL;

-- Add constraints
ALTER TABLE Locations
ADD CONSTRAINT chk_multiplier_range CHECK (PriceMultiplier BETWEEN 0.5 AND 2.0),
ADD CONSTRAINT chk_airport_premium_range CHECK (AirportPremiumPercentage BETWEEN 0 AND 1.0);

-- Add indexes
CREATE INDEX idx_region ON Locations(RegionId);
CREATE INDEX idx_price_multiplier ON Locations(PriceMultiplier);

-- Create PricingRegions table
CREATE TABLE PricingRegions (...);

-- Create LocationPricingHistory table
CREATE TABLE LocationPricingHistory (...);

-- Set airport premium for existing airport locations
UPDATE Locations 
SET AirportPremiumEnabled = TRUE,
    PriceMultiplier = 1.20,
    PricingUpdatedAt = NOW()
WHERE LocationType = 'Airport';
```

**Rollback Migration**:
```sql
-- Drop foreign key first
ALTER TABLE Locations DROP FOREIGN KEY Locations_ibfk_region;

-- Drop tables
DROP TABLE IF EXISTS LocationPricingHistory;
DROP TABLE IF EXISTS PricingRegions;

-- Remove columns from Locations
ALTER TABLE Locations
DROP COLUMN PriceMultiplier,
DROP COLUMN AirportPremiumEnabled,
DROP COLUMN AirportPremiumPercentage,
DROP COLUMN RegionId,
DROP COLUMN PricingUpdatedAt,
DROP COLUMN PricingUpdatedBy;
```

## Technology Stack

- Database: MySQL 8.0+
- ORM: Entity Framework Core
- Migration Tool: EF Core Migrations

## Implementation Notes

**Query Optimization**:
- Use covering indexes for common queries
- Optimize JOIN operations
- Cache location multipliers
- Use read replicas for analytics

**Data Consistency**:
- Use transactions for regional updates
- Validate multiplier ranges at database level
- Maintain referential integrity
- Handle concurrent updates with optimistic locking

**Monitoring**:
- Track query performance
- Monitor index usage
- Alert on constraint violations
- Track pricing change frequency

**Backup and Recovery**:
- Include pricing tables in backups
- Test restoration procedures
- Maintain pricing history for compliance
- Archive old history periodically

