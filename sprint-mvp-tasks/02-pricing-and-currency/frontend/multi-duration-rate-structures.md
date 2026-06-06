# Feature: Multi-Duration Rate Structures

## Overview

Comprehensive pricing system supporting multiple rental duration options (hourly, daily, weekly, bi-weekly, monthly) with different rate structures to accommodate various customer needs and maximize revenue across booking patterns. Enables flexible pricing that encourages longer rentals through volume discounts while maintaining profitability across all rental durations.

## Sprint Category

sprint-mvp (MVP - Must have for first release)

## Feature ID

Pricing-Management-1.1

## User Stories

### As a customer
I want to see pricing options for different rental durations, so that I can choose the most cost-effective option for my needs.

### As a short-term renter
I want hourly rates available, so that I can rent a vehicle for just a few hours without paying for a full day.

### As a long-term renter
I want discounted weekly and monthly rates, so that I can save money on extended rentals.

### As a supplier
I want to configure different rates for different durations, so that I can optimize revenue and encourage longer bookings.

### As a platform administrator
I want to enforce minimum and maximum rental durations, so that I can maintain operational efficiency and prevent abuse.

## Frontend Specifications

### Pages

**Pricing Configuration Page** (`/admin/pricing/rates`)
- Configure rates for all duration types
- Set rates per vehicle or vehicle category
- Preview rate calculations
- Bulk rate updates
- Rate history and audit trail

**Vehicle Search Results** (`/search`)
- Display appropriate rate based on selected duration
- Show rate comparison (e.g., "Save 20% with weekly rate")
- Duration selector with rate preview
- Rate breakdown on hover

**Vehicle Detail Page** (`/vehicles/:id`)
- Rate table showing all duration options
- Interactive duration calculator
- Savings calculator
- Rate comparison chart

### UI Components

**RateConfigurationForm Component**
- Input fields for each duration type:
  - Hourly rate (1-23 hours)
  - Daily rate (1+ days)
  - Weekly rate (7 days)
  - Bi-weekly rate (14 days)
  - Monthly rate (30 days)
- Currency selector
- Minimum/maximum duration settings
- Rate validation
- Save and preview buttons
- Bulk update option

**DurationSelector Component**
- Date/time picker for start and end
- Automatic duration calculation
- Display selected duration in appropriate unit
- Show applicable rate type
- Real-time price calculation
- Rate comparison display

**RateComparisonTable Component**
- Table showing all rate options
- Duration column (1 hour, 1 day, 7 days, etc.)
- Rate per unit column
- Total cost column
- Savings percentage column
- Highlight best value option
- Responsive design for mobile

**PricingCalculator Component**
- Interactive duration slider
- Real-time price updates
- Show rate type being applied
- Display savings from volume discounts
- Breakdown of calculation
- Export estimate button

### User Flows

**Rate Configuration Flow** (Admin):
1. Admin navigates to pricing configuration
2. System displays current rates for selected vehicle/category
3. Admin updates hourly rate to $15
4. Admin updates daily rate to $80
5. Admin updates weekly rate to $450 (saves $110 vs 7 daily)
6. Admin updates monthly rate to $1,500 (saves $900 vs 30 daily)
7. Admin sets minimum duration to 1 hour
8. Admin sets maximum duration to 90 days
9. System validates rates (weekly < 7×daily, monthly < 30×daily)
10. Admin saves configuration
11. System updates rates and logs change
12. System displays confirmation

**Customer Duration Selection Flow**:
1. Customer searches for vehicles
2. Customer selects pickup date/time
3. Customer selects return date/time
4. System calculates duration (e.g., 10 days)
5. System determines applicable rate (daily rate)
6. System calculates total: 10 × $80 = $800
7. System checks for volume discount (10 days qualifies for 10% off)
8. System applies discount: $800 - $80 = $720
9. System displays: "$720 for 10 days ($72/day)"
10. System shows comparison: "Save $80 vs standard rate"
11. Customer sees rate breakdown on hover
12. Customer proceeds to booking

### Data Requirements

**From Backend APIs**:
- GET `/api/pricing/rates` - Get rates for vehicle
- POST `/api/pricing/rates` - Update rates (admin)
- GET `/api/pricing/calculate` - Calculate total for duration
- GET `/api/pricing/duration-options` - Get available duration types

**Rate Data**:
- Hourly rate (decimal)
- Daily rate (decimal)
- Weekly rate (decimal)
- Bi-weekly rate (decimal)
- Monthly rate (decimal)
- Minimum duration (hours)
- Maximum duration (days)
- Currency code
- Effective date range

## Backend Specifications

### API Endpoints

**GET `/api/v1/pricing/rates/:vehicleId`**
- Purpose: Get all rate structures for a vehicle
- Authentication: Optional (public pricing)
- Path Parameters:
  - `vehicleId` (guid, required): Vehicle ID
- Response: All duration rates with metadata

**POST `/api/v1/pricing/rates`**
- Purpose: Create or update rate structures
- Authentication: Required (JWT)
- Authorization: Supplier or Admin role
- Request Body: RateConfiguration
- Response: Updated rates

**POST `/api/v1/pricing/calculate-duration`**
- Purpose: Calculate total cost for specific duration
- Authentication: Optional
- Request Body:
  - `vehicleId` (guid, required)
  - `startDate` (datetime, required)
  - `endDate` (datetime, required)
- Response: Total cost with rate type used

**POST `/api/v1/pricing/rates/bulk-update`**
- Purpose: Update rates for multiple vehicles
- Authentication: Required (JWT)
- Authorization: Supplier or Admin role
- Request Body:
  - `vehicleIds` (array<guid>, required)
  - `rateUpdates` (object, required)
  - `updateType` ("replace" | "multiply" | "add")
- Response: Update summary

### Request Schemas

**RateConfiguration**:
```
{
  vehicleId: guid,
  supplierId: guid,
  rates: {
    hourly: decimal,
    daily: decimal,
    weekly: decimal,
    biWeekly: decimal,
    monthly: decimal
  },
  minimumDuration: int (hours),
  maximumDuration: int (days),
  currency: string,
  effectiveDate: date,
  expirationDate: date (optional)
}
```

**BulkRateUpdate**:
```
{
  vehicleIds: [guid],
  rateUpdates: {
    hourly: decimal (optional),
    daily: decimal (optional),
    weekly: decimal (optional),
    biWeekly: decimal (optional),
    monthly: decimal (optional)
  },
  updateType: "replace" | "multiply" | "add",
  effectiveDate: date
}
```

### Response Schemas

**RateStructureResponse**:
```
{
  vehicleId: guid,
  vehicleName: string,
  supplierId: guid,
  rates: {
    hourly: {
      rate: decimal,
      minDuration: 1,
      maxDuration: 23,
      unit: "hour"
    },
    daily: {
      rate: decimal,
      minDuration: 1,
      maxDuration: 6,
      unit: "day"
    },
    weekly: {
      rate: decimal,
      duration: 7,
      unit: "week",
      savingsVsDaily: decimal,
      savingsPercentage: decimal
    },
    biWeekly: {
      rate: decimal,
      duration: 14,
      unit: "week",
      savingsVsDaily: decimal,
      savingsPercentage: decimal
    },
    monthly: {
      rate: decimal,
      duration: 30,
      unit: "month",
      savingsVsDaily: decimal,
      savingsPercentage: decimal
    }
  },
  minimumDuration: int,
  maximumDuration: int,
  currency: string,
  effectiveDate: date,
  expirationDate: date
}
```

**DurationCalculationResponse**:
```
{
  duration: {
    hours: int,
    days: int,
    weeks: int,
    months: int
  },
  rateTypeUsed: "hourly" | "daily" | "weekly" | "biWeekly" | "monthly",
  ratePerUnit: decimal,
  units: int,
  subtotal: decimal,
  volumeDiscount: decimal,
  total: decimal,
  currency: string,
  breakdown: string (e.g., "10 days × $80/day = $800")
}
```

### Business Logic

**Rate Type Selection Algorithm**:
```
Duration < 24 hours → Use hourly rate
Duration >= 24 hours AND < 7 days → Use daily rate
Duration >= 7 days AND < 14 days → Use weekly rate (if available)
Duration >= 14 days AND < 30 days → Use bi-weekly rate (if available)
Duration >= 30 days → Use monthly rate (if available)
```

**Rate Calculation Logic**:
- Calculate total hours between start and end datetime
- Determine optimal rate type based on duration
- Calculate number of units (hours, days, weeks, months)
- Apply rate × units
- Check for volume discounts
- Apply minimum/maximum duration constraints
- Round to 2 decimal places

**Volume Discount Logic**:
- 7-13 days: 10% discount on daily rate
- 14-27 days: 15% discount on daily rate
- 28+ days: 20% discount on daily rate
- Discounts apply only if weekly/monthly rates not used

**Rate Validation Rules**:
- Weekly rate should be < 7 × daily rate (to incentivize longer rentals)
- Bi-weekly rate should be < 14 × daily rate
- Monthly rate should be < 30 × daily rate
- Hourly rate × 24 should be >= daily rate (prevent hourly abuse)
- All rates must be positive numbers
- Minimum duration must be >= 1 hour
- Maximum duration must be <= 365 days

**Bulk Update Logic**:
- Replace: Set new rate values directly
- Multiply: Multiply existing rates by factor (e.g., 1.1 for 10% increase)
- Add: Add fixed amount to existing rates
- Validate all updated rates
- Apply changes atomically (all or nothing)
- Log all changes with user attribution

### Authentication Requirements

- No authentication required for viewing rates
- Supplier role required to update own vehicle rates
- Admin role required to update any vehicle rates
- Admin role required for bulk updates
- Audit logging for all rate changes

## Database Specifications

### Schema Changes

**New Tables**:
- `VehicleRates` - Multi-duration rate structures
- `RateHistory` - Historical rate changes

**Modified Tables**:
- `Vehicles` - Add current rate reference

### Table Definitions

**VehicleRates Table**:
```sql
CREATE TABLE VehicleRates (
  RateId CHAR(36) PRIMARY KEY,
  VehicleId CHAR(36) NOT NULL,
  SupplierId CHAR(36) NOT NULL,
  HourlyRate DECIMAL(10,2) NULL,
  DailyRate DECIMAL(10,2) NOT NULL,
  WeeklyRate DECIMAL(10,2) NULL,
  BiWeeklyRate DECIMAL(10,2) NULL,
  MonthlyRate DECIMAL(10,2) NULL,
  MinimumDuration INT NOT NULL DEFAULT 1 COMMENT 'Hours',
  MaximumDuration INT NOT NULL DEFAULT 90 COMMENT 'Days',
  Currency CHAR(3) NOT NULL DEFAULT 'USD',
  EffectiveDate DATE NOT NULL,
  ExpirationDate DATE NULL,
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
  
  CONSTRAINT chk_weekly_discount CHECK (WeeklyRate IS NULL OR WeeklyRate < (DailyRate * 7)),
  CONSTRAINT chk_monthly_discount CHECK (MonthlyRate IS NULL OR MonthlyRate < (DailyRate * 30)),
  CONSTRAINT chk_positive_rates CHECK (DailyRate > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**RateHistory Table**:
```sql
CREATE TABLE RateHistory (
  HistoryId CHAR(36) PRIMARY KEY,
  RateId CHAR(36) NOT NULL,
  VehicleId CHAR(36) NOT NULL,
  ChangeType ENUM('created', 'updated', 'expired', 'deleted') NOT NULL,
  PreviousRates JSON NULL COMMENT 'Previous rate values',
  NewRates JSON NOT NULL COMMENT 'New rate values',
  ChangedBy CHAR(36) NOT NULL,
  ChangeReason VARCHAR(500) NULL,
  ChangedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (RateId) REFERENCES VehicleRates(RateId) ON DELETE CASCADE,
  FOREIGN KEY (VehicleId) REFERENCES Vehicles(VehicleId) ON DELETE CASCADE,
  FOREIGN KEY (ChangedBy) REFERENCES Users(UserId),
  
  INDEX idx_vehicle_changed (VehicleId, ChangedAt DESC),
  INDEX idx_rate_history (RateId, ChangedAt DESC),
  INDEX idx_changed_by (ChangedBy, ChangedAt DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- `VehicleRates.VehicleId` → `Vehicles.VehicleId` (Many-to-One)
- `VehicleRates.SupplierId` → `Suppliers.SupplierId` (Many-to-One)
- `VehicleRates.CreatedBy` → `Users.UserId` (Many-to-One)
- `RateHistory.RateId` → `VehicleRates.RateId` (Many-to-One)
- `RateHistory.VehicleId` → `Vehicles.VehicleId` (Many-to-One)
- `RateHistory.ChangedBy` → `Users.UserId` (Many-to-One)

### Indexes

- `idx_vehicle_active` on `VehicleRates(VehicleId, IsActive, EffectiveDate DESC)` - Active rate lookup
- `idx_supplier_active` on `VehicleRates(SupplierId, IsActive)` - Supplier rate management
- `idx_effective_dates` on `VehicleRates(EffectiveDate, ExpirationDate)` - Date-based rate queries
- `idx_vehicle_changed` on `RateHistory(VehicleId, ChangedAt DESC)` - Rate change history

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript

## Implementation Notes

**Rate Selection Priority**:
1. Check for active rate with matching effective date
2. If multiple rates exist, use most recent effective date
3. Fall back to default category rate if vehicle-specific rate not found
4. Return error if no applicable rate found

**Duration Calculation**:
- Calculate exact hours between start and end datetime
- Round up to next hour for hourly rentals
- Round up to next day for daily rentals
- Use exact week/month counts for longer durations

**Rate Display**:
- Always show daily rate as primary
- Show weekly/monthly rates with savings percentage
- Highlight best value option
- Use clear formatting: "$80/day" or "$450/week (Save 20%)"

**Performance Optimization**:
- Cache active rates in Redis (15-minute TTL)
- Invalidate cache on rate updates
- Use database indexes for fast lookups
- Batch rate calculations for search results

**Testing Requirements**:
- Test rate calculation for all duration types
- Test volume discount application
- Test minimum/maximum duration enforcement
- Test rate validation rules
- Test bulk rate updates
- Test rate history tracking
- Verify rate selection algorithm

## Related Features

- F-PB-011: Dynamic Pricing Engine (Advanced pricing strategies)
- F-PB-007: Transparent Pricing Breakdown (Price display)
- Vehicle-Specific Pricing: Individual vehicle rate management
- Location-Based Pricing: Geographic price differentiation

