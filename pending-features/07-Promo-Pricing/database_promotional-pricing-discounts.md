# Feature: Promotional Pricing and Discounts - Database

## Overview

Database schema for promotional discount system supporting discount codes, usage tracking, customer segment targeting, vehicle category restrictions, and comprehensive analytics. Designed for high-performance validation, atomic usage tracking, and detailed reporting.

## Sprint Category

sprint-01 (First Sprint - High priority features)

## Feature ID

Pricing-Management-2.2

## Schema Changes

### New Tables

1. **DiscountCodes** - Promotional discount definitions
2. **DiscountUsage** - Track discount code usage per booking
3. **DiscountVehicleCategories** - Many-to-many relationship for vehicle restrictions
4. **DiscountValidationLog** - Track validation attempts for analytics and fraud detection

### Modified Tables

**Bookings Table** - Add discount tracking:
```sql
ALTER TABLE Bookings
ADD COLUMN DiscountAmount DECIMAL(10,2) NULL DEFAULT 0.00 COMMENT 'Total discount applied',
ADD COLUMN DiscountCodes JSON NULL COMMENT 'Array of applied discount codes',
ADD INDEX idx_discount_amount (DiscountAmount);
```

## Table Definitions

### DiscountCodes Table

```sql
CREATE TABLE DiscountCodes (
  DiscountId CHAR(36) PRIMARY KEY,
  Code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Discount code (case-insensitive)',
  Description VARCHAR(500) NOT NULL,
  DiscountType ENUM('percentage', 'fixed') NOT NULL,
  DiscountValue DECIMAL(10,2) NOT NULL,
  ValidFrom DATE NOT NULL,
  ValidTo DATE NOT NULL,
  UsageLimitTotal INT NULL COMMENT 'NULL = unlimited',
  UsageLimitPerCustomer INT NOT NULL DEFAULT 1,
  CurrentUsageCount INT NOT NULL DEFAULT 0,
  CustomerSegments JSON NOT NULL COMMENT 'Array: ["all", "new", "returning", "tier1", "tier2", "tier3"]',
  MinimumDuration INT NULL COMMENT 'Minimum rental duration in hours',
  MinimumValue DECIMAL(10,2) NULL COMMENT 'Minimum booking value',
  AllowStacking BOOLEAN NOT NULL DEFAULT FALSE,
  IsAutomatic BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Auto-apply without code entry',
  Priority INT NOT NULL DEFAULT 0 COMMENT 'For stacking order (higher = first)',
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  SupplierId CHAR(36) NOT NULL,
  CreatedBy CHAR(36) NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (SupplierId) REFERENCES Suppliers(SupplierId) ON DELETE CASCADE,
  FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
  
  INDEX idx_code_active (Code, IsActive),
  INDEX idx_supplier_active (SupplierId, IsActive),
  INDEX idx_valid_dates (ValidFrom, ValidTo, IsActive),
  INDEX idx_automatic (IsAutomatic, IsActive, Priority DESC),
  INDEX idx_usage_limit (UsageLimitTotal, CurrentUsageCount),
  
  CONSTRAINT chk_positive_value CHECK (DiscountValue > 0),
  CONSTRAINT chk_percentage_range CHECK (
    DiscountType != 'percentage' OR 
    (DiscountValue > 0 AND DiscountValue <= 100)
  ),
  CONSTRAINT chk_valid_dates CHECK (ValidTo >= ValidFrom),
  CONSTRAINT chk_usage_limit CHECK (
    UsageLimitTotal IS NULL OR UsageLimitTotal > 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Column Details**:
- `DiscountId`: Primary key (GUID)
- `Code`: Unique discount code, case-insensitive lookup
- `Description`: Human-readable description for admin and customer display
- `DiscountType`: "percentage" for % off, "fixed" for $ off
- `DiscountValue`: Percentage (0-100) or fixed amount
- `ValidFrom/ValidTo`: Date range when code is valid
- `UsageLimitTotal`: Maximum total uses (NULL = unlimited)
- `UsageLimitPerCustomer`: Maximum uses per customer
- `CurrentUsageCount`: Real-time usage counter (updated atomically)
- `CustomerSegments`: JSON array of eligible customer types
- `MinimumDuration`: Minimum rental hours required
- `MinimumValue`: Minimum booking value required
- `AllowStacking`: Can be combined with other discounts
- `IsAutomatic`: Auto-apply without code entry
- `Priority`: Stacking order (higher priority applied first)

### DiscountUsage Table

```sql
CREATE TABLE DiscountUsage (
  UsageId CHAR(36) PRIMARY KEY,
  DiscountId CHAR(36) NOT NULL,
  BookingId CHAR(36) NOT NULL,
  CustomerId CHAR(36) NOT NULL,
  DiscountAmount DECIMAL(10,2) NOT NULL,
  OriginalPrice DECIMAL(10,2) NOT NULL,
  FinalPrice DECIMAL(10,2) NOT NULL,
  UsedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (DiscountId) REFERENCES DiscountCodes(DiscountId) ON DELETE CASCADE,
  FOREIGN KEY (BookingId) REFERENCES Bookings(BookingId) ON DELETE CASCADE,
  FOREIGN KEY (CustomerId) REFERENCES Users(UserId) ON DELETE CASCADE,
  
  INDEX idx_discount_used (DiscountId, UsedAt DESC),
  INDEX idx_customer_discount (CustomerId, DiscountId),
  INDEX idx_booking (BookingId),
  INDEX idx_used_at (UsedAt DESC),
  
  UNIQUE KEY uk_booking_discount (BookingId, DiscountId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Column Details**:
- `UsageId`: Primary key (GUID)
- `DiscountId`: Reference to discount code used
- `BookingId`: Reference to booking where discount was applied
- `CustomerId`: Customer who used the discount
- `DiscountAmount`: Actual discount amount applied
- `OriginalPrice`: Booking price before discount
- `FinalPrice`: Booking price after discount
- `UsedAt`: Timestamp of discount application

**Unique Constraint**: Prevents same discount from being applied twice to same booking

### DiscountVehicleCategories Table

```sql
CREATE TABLE DiscountVehicleCategories (
  DiscountId CHAR(36) NOT NULL,
  CategoryId CHAR(36) NOT NULL,
  
  PRIMARY KEY (DiscountId, CategoryId),
  
  FOREIGN KEY (DiscountId) REFERENCES DiscountCodes(DiscountId) ON DELETE CASCADE,
  FOREIGN KEY (CategoryId) REFERENCES VehicleCategories(CategoryId) ON DELETE CASCADE,
  
  INDEX idx_category (CategoryId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Purpose**: Many-to-many relationship between discounts and vehicle categories. Empty = all categories eligible.

### DiscountValidationLog Table

```sql
CREATE TABLE DiscountValidationLog (
  LogId CHAR(36) PRIMARY KEY,
  DiscountId CHAR(36) NULL,
  Code VARCHAR(50) NOT NULL,
  CustomerId CHAR(36) NULL,
  VehicleId CHAR(36) NULL,
  IsValid BOOLEAN NOT NULL,
  ValidationErrors JSON NULL COMMENT 'Array of error codes',
  IpAddress VARCHAR(45) NULL,
  UserAgent VARCHAR(500) NULL,
  ValidatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (DiscountId) REFERENCES DiscountCodes(DiscountId) ON DELETE SET NULL,
  FOREIGN KEY (CustomerId) REFERENCES Users(UserId) ON DELETE SET NULL,
  FOREIGN KEY (VehicleId) REFERENCES Vehicles(VehicleId) ON DELETE SET NULL,
  
  INDEX idx_code_validated (Code, ValidatedAt DESC),
  INDEX idx_discount_validated (DiscountId, IsValid, ValidatedAt DESC),
  INDEX idx_customer_validated (CustomerId, ValidatedAt DESC),
  INDEX idx_ip_validated (IpAddress, ValidatedAt DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Purpose**: Track all validation attempts for conversion analytics and fraud detection.

## Relationships

### Primary Relationships

- `DiscountCodes.SupplierId` → `Suppliers.SupplierId` (Many-to-One)
  - Each discount belongs to one supplier
  - Cascade delete when supplier is deleted

- `DiscountCodes.CreatedBy` → `Users.UserId` (Many-to-One)
  - Track who created the discount
  - Audit trail for discount creation

- `DiscountUsage.DiscountId` → `DiscountCodes.DiscountId` (Many-to-One)
  - Track which discount was used
  - Cascade delete usage records when discount deleted

- `DiscountUsage.BookingId` → `Bookings.BookingId` (Many-to-One)
  - Link discount to specific booking
  - Cascade delete when booking deleted

- `DiscountUsage.CustomerId` → `Users.UserId` (Many-to-One)
  - Track which customer used discount
  - Cascade delete when customer deleted

- `DiscountVehicleCategories.DiscountId` → `DiscountCodes.DiscountId` (Many-to-Many)
  - Restrict discount to specific vehicle categories
  - Cascade delete when discount deleted

- `DiscountVehicleCategories.CategoryId` → `VehicleCategories.CategoryId` (Many-to-Many)
  - Link to vehicle categories
  - Cascade delete when category deleted

## Indexes

### Performance Indexes

**DiscountCodes Table**:
- `idx_code_active (Code, IsActive)` - Fast code lookup during validation
- `idx_supplier_active (SupplierId, IsActive)` - Supplier discount management queries
- `idx_valid_dates (ValidFrom, ValidTo, IsActive)` - Date-based active discount queries
- `idx_automatic (IsAutomatic, IsActive, Priority DESC)` - Automatic discount lookup with priority
- `idx_usage_limit (UsageLimitTotal, CurrentUsageCount)` - Usage limit checks

**DiscountUsage Table**:
- `idx_discount_used (DiscountId, UsedAt DESC)` - Usage history and analytics
- `idx_customer_discount (CustomerId, DiscountId)` - Per-customer usage tracking
- `idx_booking (BookingId)` - Booking discount lookup
- `idx_used_at (UsedAt DESC)` - Time-based analytics

**DiscountVehicleCategories Table**:
- `idx_category (CategoryId)` - Category-based discount queries

**DiscountValidationLog Table**:
- `idx_code_validated (Code, ValidatedAt DESC)` - Code validation history
- `idx_discount_validated (DiscountId, IsValid, ValidatedAt DESC)` - Conversion analytics
- `idx_customer_validated (CustomerId, ValidatedAt DESC)` - Customer validation patterns
- `idx_ip_validated (IpAddress, ValidatedAt DESC)` - Fraud detection

## Queries

### Get Active Discount by Code

```sql
SELECT 
  dc.*,
  GROUP_CONCAT(dvc.CategoryId) as VehicleCategoryIds
FROM DiscountCodes dc
LEFT JOIN DiscountVehicleCategories dvc ON dc.DiscountId = dvc.DiscountId
WHERE dc.Code = ? 
  AND dc.IsActive = TRUE
  AND CURDATE() BETWEEN dc.ValidFrom AND dc.ValidTo
GROUP BY dc.DiscountId;
```

### Check Customer Usage Count

```sql
SELECT COUNT(*) as UsageCount
FROM DiscountUsage
WHERE DiscountId = ?
  AND CustomerId = ?;
```

### Get Automatic Discounts for Customer

```sql
SELECT 
  dc.*,
  GROUP_CONCAT(dvc.CategoryId) as VehicleCategoryIds
FROM DiscountCodes dc
LEFT JOIN DiscountVehicleCategories dvc ON dc.DiscountId = dvc.DiscountId
WHERE dc.IsActive = TRUE
  AND dc.IsAutomatic = TRUE
  AND CURDATE() BETWEEN dc.ValidFrom AND dc.ValidTo
  AND (dc.UsageLimitTotal IS NULL OR dc.CurrentUsageCount < dc.UsageLimitTotal)
GROUP BY dc.DiscountId
ORDER BY dc.Priority DESC;
```

### Increment Usage Counter (Atomic)

```sql
UPDATE DiscountCodes
SET CurrentUsageCount = CurrentUsageCount + 1,
    UpdatedAt = CURRENT_TIMESTAMP
WHERE DiscountId = ?
  AND (UsageLimitTotal IS NULL OR CurrentUsageCount < UsageLimitTotal);
```

### Get Discount Analytics

```sql
SELECT 
  dc.DiscountId,
  dc.Code,
  COUNT(DISTINCT du.UsageId) as TotalUses,
  COUNT(DISTINCT du.CustomerId) as UniqueCustomers,
  SUM(du.FinalPrice) as TotalRevenue,
  SUM(du.DiscountAmount) as TotalDiscount,
  AVG(du.DiscountAmount) as AverageDiscountPerBooking,
  SUM(du.FinalPrice) / NULLIF(SUM(du.DiscountAmount), 0) as ROI
FROM DiscountCodes dc
LEFT JOIN DiscountUsage du ON dc.DiscountId = du.DiscountId
WHERE dc.DiscountId = ?
  AND (du.UsedAt IS NULL OR du.UsedAt BETWEEN ? AND ?)
GROUP BY dc.DiscountId, dc.Code;
```

### Get Usage by Date

```sql
SELECT 
  DATE(du.UsedAt) as Date,
  COUNT(*) as Uses,
  SUM(du.FinalPrice) as Revenue,
  SUM(du.DiscountAmount) as Discount
FROM DiscountUsage du
WHERE du.DiscountId = ?
  AND du.UsedAt BETWEEN ? AND ?
GROUP BY DATE(du.UsedAt)
ORDER BY Date ASC;
```

### Detect Suspicious Validation Patterns

```sql
SELECT 
  IpAddress,
  COUNT(DISTINCT Code) as UniqueCodesAttempted,
  COUNT(*) as TotalAttempts,
  SUM(CASE WHEN IsValid = FALSE THEN 1 ELSE 0 END) as FailedAttempts
FROM DiscountValidationLog
WHERE ValidatedAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY IpAddress
HAVING UniqueCodesAttempted > 10 OR FailedAttempts > 20;
```

## Data Integrity

### Constraints

**DiscountCodes Table**:
- `chk_positive_value`: Discount value must be positive
- `chk_percentage_range`: Percentage discounts must be 0-100
- `chk_valid_dates`: ValidTo must be >= ValidFrom
- `chk_usage_limit`: UsageLimitTotal must be positive if set
- `UNIQUE (Code)`: Prevent duplicate discount codes

**DiscountUsage Table**:
- `uk_booking_discount`: Prevent same discount applied twice to same booking
- Foreign key constraints ensure referential integrity

### Triggers

**Update Usage Counter Trigger**:
```sql
DELIMITER //

CREATE TRIGGER trg_discount_usage_after_insert
AFTER INSERT ON DiscountUsage
FOR EACH ROW
BEGIN
  -- Increment usage counter
  UPDATE DiscountCodes
  SET CurrentUsageCount = CurrentUsageCount + 1,
      UpdatedAt = CURRENT_TIMESTAMP
  WHERE DiscountId = NEW.DiscountId;
END//

DELIMITER ;
```

**Validation Log Trigger**:
```sql
DELIMITER //

CREATE TRIGGER trg_discount_validation_log
AFTER INSERT ON DiscountValidationLog
FOR EACH ROW
BEGIN
  -- Check for suspicious activity (>20 failed attempts in 10 minutes)
  DECLARE failed_count INT;
  
  SELECT COUNT(*) INTO failed_count
  FROM DiscountValidationLog
  WHERE IpAddress = NEW.IpAddress
    AND IsValid = FALSE
    AND ValidatedAt >= DATE_SUB(NOW(), INTERVAL 10 MINUTE);
  
  IF failed_count > 20 THEN
    -- Log security alert
    INSERT INTO SecurityAlerts (AlertId, AlertType, Details, CreatedAt)
    VALUES (
      UUID(),
      'DISCOUNT_BRUTE_FORCE',
      JSON_OBJECT('ipAddress', NEW.IpAddress, 'failedAttempts', failed_count),
      CURRENT_TIMESTAMP
    );
  END IF;
END//

DELIMITER ;
```

## Sample Data

### Example Discount Codes

```sql
-- Summer promotion - 20% off
INSERT INTO DiscountCodes (
  DiscountId, Code, Description, DiscountType, DiscountValue,
  ValidFrom, ValidTo, UsageLimitTotal, UsageLimitPerCustomer,
  CustomerSegments, MinimumDuration, MinimumValue,
  AllowStacking, IsAutomatic, Priority, IsActive,
  SupplierId, CreatedBy
) VALUES (
  UUID(),
  'SUMMER2024',
  'Summer promotion - 20% off all rentals over $200',
  'percentage',
  20.00,
  '2024-06-01',
  '2024-08-31',
  500,
  1,
  '["all"]',
  72,
  200.00,
  FALSE,
  FALSE,
  0,
  TRUE,
  '123e4567-e89b-12d3-a456-426614174001',
  '123e4567-e89b-12d3-a456-426614174002'
);

-- New customer welcome - $50 off
INSERT INTO DiscountCodes (
  DiscountId, Code, Description, DiscountType, DiscountValue,
  ValidFrom, ValidTo, UsageLimitTotal, UsageLimitPerCustomer,
  CustomerSegments, MinimumDuration, MinimumValue,
  AllowStacking, IsAutomatic, Priority, IsActive,
  SupplierId, CreatedBy
) VALUES (
  UUID(),
  'WELCOME50',
  'New customer welcome - $50 off first rental',
  'fixed',
  50.00,
  '2024-01-01',
  '2024-12-31',
  NULL,
  1,
  '["new"]',
  24,
  150.00,
  TRUE,
  FALSE,
  0,
  TRUE,
  '123e4567-e89b-12d3-a456-426614174001',
  '123e4567-e89b-12d3-a456-426614174002'
);

-- Automatic loyalty discount - 10% off
INSERT INTO DiscountCodes (
  DiscountId, Code, Description, DiscountType, DiscountValue,
  ValidFrom, ValidTo, UsageLimitTotal, UsageLimitPerCustomer,
  CustomerSegments, MinimumDuration, MinimumValue,
  AllowStacking, IsAutomatic, Priority, IsActive,
  SupplierId, CreatedBy
) VALUES (
  UUID(),
  'LOYALTY10',
  'Loyal customer - 10% off automatically applied',
  'percentage',
  10.00,
  '2024-01-01',
  '2024-12-31',
  NULL,
  999,
  '["returning", "tier1", "tier2", "tier3"]',
  NULL,
  NULL,
  TRUE,
  TRUE,
  10,
  TRUE,
  '123e4567-e89b-12d3-a456-426614174001',
  '123e4567-e89b-12d3-a456-426614174002'
);
```

## Migration Scripts

### Initial Migration

```sql
-- Create DiscountCodes table
CREATE TABLE DiscountCodes (...);

-- Create DiscountUsage table
CREATE TABLE DiscountUsage (...);

-- Create DiscountVehicleCategories table
CREATE TABLE DiscountVehicleCategories (...);

-- Create DiscountValidationLog table
CREATE TABLE DiscountValidationLog (...);

-- Modify Bookings table
ALTER TABLE Bookings
ADD COLUMN DiscountAmount DECIMAL(10,2) NULL DEFAULT 0.00,
ADD COLUMN DiscountCodes JSON NULL,
ADD INDEX idx_discount_amount (DiscountAmount);

-- Create triggers
CREATE TRIGGER trg_discount_usage_after_insert (...);
CREATE TRIGGER trg_discount_validation_log (...);
```

### Rollback Migration

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS trg_discount_usage_after_insert;
DROP TRIGGER IF EXISTS trg_discount_validation_log;

-- Revert Bookings table
ALTER TABLE Bookings
DROP COLUMN DiscountAmount,
DROP COLUMN DiscountCodes,
DROP INDEX idx_discount_amount;

-- Drop tables in reverse order
DROP TABLE IF EXISTS DiscountValidationLog;
DROP TABLE IF EXISTS DiscountVehicleCategories;
DROP TABLE IF EXISTS DiscountUsage;
DROP TABLE IF EXISTS DiscountCodes;
```

## Performance Considerations

### Indexing Strategy

- Code lookups use `idx_code_active` for O(log n) performance
- Customer usage checks use `idx_customer_discount` for fast counting
- Date-based queries use `idx_valid_dates` for efficient filtering
- Automatic discount queries use `idx_automatic` with priority sorting

### Query Optimization

- Use covering indexes where possible
- Limit result sets with pagination
- Cache active discount codes in application layer
- Use prepared statements for all queries
- Batch analytics queries during off-peak hours

### Concurrency Handling

- Use atomic increment for usage counter: `CurrentUsageCount = CurrentUsageCount + 1`
- Use database transactions for discount application
- Handle race conditions with optimistic locking
- Unique constraint prevents duplicate applications

## Security Considerations

### Data Protection

- Store discount codes in uppercase for case-insensitive comparison
- Hash sensitive discount codes if needed
- Encrypt customer segment data if contains PII
- Audit all discount operations

### Fraud Prevention

- Log all validation attempts in DiscountValidationLog
- Track IP addresses for rate limiting
- Detect brute force attempts via trigger
- Alert on suspicious patterns
- Implement exponential backoff for failed attempts

### Access Control

- Suppliers can only manage their own discounts
- Admins can manage all discounts
- Customers can only view/apply discounts
- Audit trail for all modifications

## Testing Requirements

### Data Integrity Tests

- Test unique code constraint
- Test foreign key constraints
- Test check constraints (percentage range, positive values)
- Test trigger execution
- Test cascade deletes

### Performance Tests

- Test code lookup performance (target: <10ms)
- Test usage counter increment under load
- Test concurrent discount applications
- Test analytics query performance
- Load test with 10,000+ active codes

### Business Logic Tests

- Test usage limit enforcement
- Test per-customer limit enforcement
- Test date range validation
- Test customer segment filtering
- Test vehicle category restrictions
- Test minimum requirements validation
- Test stacking logic

## Related Features

- Multi-Duration Rate Structures: Base pricing system
- Vehicle-Specific Pricing: Vehicle rate management
- Date-Based Seasonal Pricing: Time-based pricing
- Customer Loyalty Program: Automatic loyalty discounts
- Booking Management: Discount application to bookings
