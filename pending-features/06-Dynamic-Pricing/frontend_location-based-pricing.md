# Feature: Location-Based Pricing

## Overview

Geographic price differentiation system enabling different pricing for the same vehicle at different locations to reflect local market conditions, demand patterns, airport premiums, and competitive dynamics. Supports location-specific rates, regional pricing groups, and location price multipliers for optimal revenue across all locations.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

Pricing-Management-1.3

## User Stories

### As a supplier with multiple locations
I want to set different prices by location, so that I can reflect local market conditions and competition.

### As a revenue manager
I want to charge premium rates at airport locations, so that I can capture higher willingness to pay from travelers.

### As a customer
I want to see location-specific pricing, so that I can choose the most cost-effective pickup location.

### As a platform administrator
I want to manage location pricing multipliers, so that I can quickly adjust rates across locations.

## Frontend Specifications

### Pages

**Location Pricing Page** (`/admin/locations/:id/pricing`)
- Configure location-specific rates
- Set location price multipliers
- View location pricing analytics
- Compare with other locations
- Apply regional pricing groups

**Regional Pricing Page** (`/admin/pricing/regions`)
- Create and manage pricing regions
- Assign locations to regions
- Set regional multipliers
- View regional performance

**Location Comparison Page** (`/admin/pricing/location-comparison`)
- Compare rates across locations
- Identify pricing anomalies
- Benchmark against competitors
- Visualize pricing heat map

### UI Components

**LocationPricingForm Component**
- Location information display
- Base rate multiplier input
- Airport premium toggle and amount
- Urban/suburban classification
- Regional assignment selector
- Competitor rate comparison
- Save and preview buttons

**PriceMultiplierSlider Component**
- Visual slider for multiplier (0.5x - 2.0x)
- Real-time price preview
- Percentage display
- Reset to 1.0x button
- Impact calculation

**RegionalPricingMap Component**
- Interactive map showing locations
- Color-coded by price level
- Click location for details
- Regional boundaries overlay
- Competitor location markers

**LocationComparisonTable Component**
- Table of all locations
- Rate columns for each duration
- Multiplier column
- Revenue column
- Utilization column
- Sort and filter controls

### User Flows

**Location Pricing Configuration Flow**:
1. Supplier navigates to location pricing
2. System displays location details and current multiplier
3. System shows base vehicle rates
4. Supplier enables "Airport Premium"
5. System suggests 20% premium for airport location
6. Supplier adjusts multiplier to 1.20
7. System previews new rates for all vehicles
8. Supplier reviews impact on revenue
9. Supplier saves configuration
10. System applies multiplier to all vehicles at location
11. System logs change
12. System displays confirmation

**Regional Pricing Setup Flow**:
1. Admin navigates to regional pricing
2. Admin creates new region "Downtown Metro"
3. Admin assigns 5 locations to region
4. Admin sets regional multiplier: 1.15
5. System previews rate changes
6. Admin confirms application
7. System updates all vehicles at assigned locations
8. System displays update summary

### Data Requirements

**From Backend APIs**:
- GET `/api/locations/:id/pricing` - Location pricing config
- POST `/api/locations/:id/pricing` - Update location pricing
- GET `/api/pricing/regions` - Get pricing regions
- POST `/api/pricing/regions` - Create/update region
- GET `/api/pricing/location-comparison` - Compare locations

**Location Data**:
- Location ID, name, address
- Location type (airport, urban, suburban, rural)
- Current price multiplier
- Regional assignment
- Competitor rates
- Revenue and utilization metrics

## Backend Specifications

### API Endpoints

**GET `/api/v1/locations/:locationId/pricing`**
- Purpose: Get location pricing configuration
- Authentication: Required (JWT)
- Authorization: Supplier (own locations) or Admin
- Path Parameters:
  - `locationId` (guid, required): Location ID
- Response: Location pricing config with multipliers

**POST `/api/v1/locations/:locationId/pricing`**
- Purpose: Update location pricing configuration
- Authentication: Required (JWT)
- Authorization: Supplier (own locations) or Admin
- Path Parameters:
  - `locationId` (guid, required): Location ID
- Request Body: LocationPricingConfiguration
- Response: Updated configuration

**GET `/api/v1/pricing/regions`**
- Purpose: Get all pricing regions
- Authentication: Required (JWT)
- Query Parameters:
  - `supplierId` (guid, optional): Filter by supplier
- Response: Array of pricing regions

**POST `/api/v1/pricing/regions`**
- Purpose: Create or update pricing region
- Authentication: Required (JWT)
- Authorization: Supplier or Admin
- Request Body: PricingRegion
- Response: Created/updated region

**POST `/api/v1/pricing/regions/:regionId/apply`**
- Purpose: Apply regional multiplier to all locations in region
- Authentication: Required (JWT)
- Authorization: Supplier or Admin
- Path Parameters:
  - `regionId` (guid, required): Region ID
- Request Body:
  - `multiplier` (decimal, required)
  - `effectiveDate` (date, optional)
- Response: Application results

**GET `/api/v1/pricing/location-comparison`**
- Purpose: Compare pricing across locations
- Authentication: Required (JWT)
- Query Parameters:
  - `supplierId` (guid, required)
  - `vehicleCategory` (string, optional)
- Response: Location comparison data

### Request Schemas

**LocationPricingConfiguration**:
```
{
  locationId: guid,
  priceMultiplier: decimal (0.5 - 2.0),
  airportPremium: {
    enabled: boolean,
    percentage: decimal
  },
  locationType: "airport" | "urban" | "suburban" | "rural",
  regionId: guid (optional),
  effectiveDate: date,
  reason: string (optional)
}
```

**PricingRegion**:
```
{
  regionName: string,
  description: string,
  locationIds: [guid],
  priceMultiplier: decimal,
  supplierId: guid
}
```

### Response Schemas

**LocationPricingResponse**:
```
{
  locationId: guid,
  locationName: string,
  locationType: string,
  priceMultiplier: decimal,
  airportPremium: {
    enabled: boolean,
    percentage: decimal
  },
  region: {
    regionId: guid,
    regionName: string,
    regionalMultiplier: decimal
  },
  effectiveMultiplier: decimal (location × regional),
  sampleRates: {
    economyDaily: decimal,
    luxuryDaily: decimal
  },
  competitorRates: {
    avgDaily: decimal,
    position: "below" | "competitive" | "above"
  },
  performance: {
    revenue: decimal,
    utilization: decimal,
    bookingCount: int
  }
}
```

### Business Logic

**Effective Multiplier Calculation**:
```csharp
public decimal CalculateEffectiveMultiplier(Location location)
{
    decimal multiplier = location.PriceMultiplier;
    
    // Apply regional multiplier if location is in a region
    if (location.RegionId.HasValue)
    {
        var region = await _dbContext.PricingRegions.FindAsync(location.RegionId);
        multiplier *= region.PriceMultiplier;
    }
    
    // Apply airport premium if applicable
    if (location.IsAirport && location.AirportPremiumEnabled)
    {
        multiplier *= (1 + location.AirportPremiumPercentage);
    }
    
    return Math.Round(multiplier, 2);
}
```

**Location Price Calculation**:
```csharp
public decimal CalculateLocationPrice(decimal baseRate, Location location)
{
    var effectiveMultiplier = CalculateEffectiveMultiplier(location);
    return Math.Round(baseRate * effectiveMultiplier, 2);
}
```

**Regional Multiplier Application**:
```csharp
public async Task<RegionApplicationResult> ApplyRegionalMultiplier(
    Guid regionId,
    decimal multiplier,
    DateTime effectiveDate)
{
    var region = await _dbContext.PricingRegions
        .Include(r => r.Locations)
        .FirstAsync(r => r.RegionId == regionId);
    
    var results = new List<LocationUpdateResult>();
    
    foreach (var location in region.Locations)
    {
        location.PriceMultiplier = multiplier;
        location.UpdatedAt = DateTime.UtcNow;
        
        results.Add(new LocationUpdateResult
        {
            LocationId = location.LocationId,
            LocationName = location.Name,
            PreviousMultiplier = location.PriceMultiplier,
            NewMultiplier = multiplier
        });
    }
    
    await _dbContext.SaveChangesAsync();
    await InvalidateLocationPricingCache(region.Locations.Select(l => l.LocationId));
    
    return new RegionApplicationResult
    {
        RegionId = regionId,
        LocationsUpdated = results.Count,
        Results = results
    };
}
```

### Authentication Requirements

- Supplier role required to manage own location pricing
- Admin role required to manage any location pricing
- Admin role required for regional pricing management
- All changes logged with user attribution

## Database Specifications

### Schema Changes

**Modified Tables**:
- `Locations` - Add pricing multiplier fields

**New Tables**:
- `PricingRegions` - Regional pricing groups
- `LocationPricingHistory` - Location pricing change history

### Table Definitions

**Locations Table Modifications**:
```sql
ALTER TABLE Locations
ADD COLUMN PriceMultiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00 COMMENT 'Location price multiplier',
ADD COLUMN AirportPremiumEnabled BOOLEAN DEFAULT FALSE,
ADD COLUMN AirportPremiumPercentage DECIMAL(5,2) DEFAULT 0.20 COMMENT '20% default',
ADD COLUMN RegionId CHAR(36) NULL,
ADD COLUMN PricingUpdatedAt DATETIME NULL,
ADD CONSTRAINT chk_multiplier_range CHECK (PriceMultiplier BETWEEN 0.5 AND 2.0),
ADD CONSTRAINT chk_airport_premium CHECK (AirportPremiumPercentage BETWEEN 0 AND 1.0),
ADD INDEX idx_region (RegionId),
ADD FOREIGN KEY (RegionId) REFERENCES PricingRegions(RegionId) ON DELETE SET NULL;
```

**PricingRegions Table**:
```sql
CREATE TABLE PricingRegions (
  RegionId CHAR(36) PRIMARY KEY,
  SupplierId CHAR(36) NOT NULL,
  RegionName VARCHAR(100) NOT NULL,
  Description VARCHAR(500) NULL,
  PriceMultiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  IsActive BOOLEAN DEFAULT TRUE,
  CreatedBy CHAR(36) NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (SupplierId) REFERENCES Suppliers(SupplierId) ON DELETE CASCADE,
  FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
  
  INDEX idx_supplier_active (SupplierId, IsActive),
  UNIQUE KEY uk_supplier_region (SupplierId, RegionName),
  
  CONSTRAINT chk_region_multiplier CHECK (PriceMultiplier BETWEEN 0.5 AND 2.0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**LocationPricingHistory Table**:
```sql
CREATE TABLE LocationPricingHistory (
  HistoryId CHAR(36) PRIMARY KEY,
  LocationId CHAR(36) NOT NULL,
  ChangeType ENUM('multiplier_changed', 'airport_premium_changed', 'region_assigned', 'region_removed') NOT NULL,
  PreviousMultiplier DECIMAL(5,2) NULL,
  NewMultiplier DECIMAL(5,2) NULL,
  PreviousRegionId CHAR(36) NULL,
  NewRegionId CHAR(36) NULL,
  ChangedBy CHAR(36) NOT NULL,
  ChangeReason VARCHAR(500) NULL,
  ChangedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (LocationId) REFERENCES Locations(LocationId) ON DELETE CASCADE,
  FOREIGN KEY (ChangedBy) REFERENCES Users(UserId),
  
  INDEX idx_location_changed (LocationId, ChangedAt DESC),
  INDEX idx_changed_by (ChangedBy, ChangedAt DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- `Locations.RegionId` → `PricingRegions.RegionId` (Many-to-One, SET NULL on delete)
- `PricingRegions.SupplierId` → `Suppliers.SupplierId` (Many-to-One, CASCADE DELETE)
- `PricingRegions.CreatedBy` → `Users.UserId` (Many-to-One)
- `LocationPricingHistory.LocationId` → `Locations.LocationId` (Many-to-One, CASCADE DELETE)
- `LocationPricingHistory.ChangedBy` → `Users.UserId` (Many-to-One)

### Indexes

- `idx_region` on `Locations(RegionId)` - Regional location queries
- `idx_supplier_active` on `PricingRegions(SupplierId, IsActive)` - Active region lookup
- `uk_supplier_region` on `PricingRegions(SupplierId, RegionName)` - Unique region names
- `idx_location_changed` on `LocationPricingHistory(LocationId, ChangedAt DESC)` - Location history

### Sample Data

**Pricing Regions**:
```sql
INSERT INTO PricingRegions (RegionId, SupplierId, RegionName, Description, PriceMultiplier, CreatedBy)
VALUES 
  ('region-001', 'supplier-001', 'Downtown Metro', 'High-demand downtown locations', 1.15, 'admin-001'),
  ('region-002', 'supplier-001', 'Suburban Areas', 'Standard suburban locations', 1.00, 'admin-001'),
  ('region-003', 'supplier-001', 'Airport Cluster', 'All airport locations', 1.25, 'admin-001');
```

**Location Pricing**:
```sql
UPDATE Locations 
SET PriceMultiplier = 1.25,
    AirportPremiumEnabled = TRUE,
    AirportPremiumPercentage = 0.20,
    RegionId = 'region-003'
WHERE LocationType = 'Airport';

UPDATE Locations 
SET PriceMultiplier = 1.15,
    RegionId = 'region-001'
WHERE LocationType = 'Urban' AND City = 'Downtown';
```

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript
- Mapping: Google Maps API or similar

## Implementation Notes

**Price Calculation Order**:
1. Get base vehicle rate
2. Apply location multiplier
3. Apply regional multiplier (if applicable)
4. Apply airport premium (if applicable)
5. Round to 2 decimal places

**Competitive Positioning**:
- Monitor competitor rates by location
- Alert if pricing significantly different
- Suggest optimal multipliers
- Track market share by location

**Performance**:
- Cache location multipliers
- Batch calculate prices for search
- Use indexes for location queries
- Optimize regional lookups

**Testing Requirements**:
- Test multiplier application
- Test regional pricing
- Test airport premium calculation
- Test effective multiplier calculation
- Verify audit trail
- Test bulk location updates

## Related Features

- Multi-Duration Rate Structures: Base rate configuration
- Vehicle-Specific Pricing: Individual vehicle rates
- Dynamic Pricing Engine: Advanced pricing optimization
- Competitive Pricing Intelligence: Market positioning

